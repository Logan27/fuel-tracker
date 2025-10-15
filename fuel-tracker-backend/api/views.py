from datetime import datetime
import hashlib
from django.db import transaction
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views.decorators.cache import cache_page
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import CursorPagination, PageNumberPagination
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from .models import Vehicle, FuelEntry
from .serializers import (
    VehicleSerializer,
    FuelEntrySerializer,
    DashboardStatisticsResponseSerializer,
    BrandStatisticsSerializer,
    GradeStatisticsSerializer
)
from .permissions import IsOwner
from .services import FuelEntryMetricsService, StatisticsService


def generate_safe_cache_key(prefix, user_id, **kwargs):
    """
    Generate safe cache key using hash for user-controlled data.
    Protection against cache pollution and NoSQL injection via Redis keys.
    """
    # Sort kwargs for consistency
    sorted_params = sorted(kwargs.items())
    params_str = '_'.join(f"{k}={v}" for k, v in sorted_params if v is not None)
    
    # Create hash from parameters
    params_hash = hashlib.md5(params_str.encode()).hexdigest()[:16]
    
    return f"{prefix}_user{user_id}_{params_hash}"


class FuelEntryCursorPagination(CursorPagination):
    """
    Custom pagination for FuelEntry
    Sort by date (newest first), then by odometer (highest first for same day)
    """
    page_size = 25
    max_page_size = 100  # DoS Protection: maximum 100 records at once
    ordering = ['-entry_date', '-odometer']  # Sort by date desc, then odometer desc

    def get_ordering(self, request, queryset, view):
        """
        Get sorting from request parameters or use default
        """
        sort_by = request.query_params.get('sort_by', 'entry_date')
        sort_order = request.query_params.get('sort_order', 'desc')

        # Validation of sorting parameters
        valid_sort_fields = ['entry_date', 'odometer', 'total_amount', 'created_at']
        if sort_by in valid_sort_fields:
            if sort_order == 'desc':
                # When sorting by custom field, add secondary sort by odometer desc
                return [f'-{sort_by}', '-odometer']
            else:
                # For ascending, use ascending order for both
                return [sort_by, 'odometer']

        # Default sorting: date desc, then odometer desc (for entries on same day)
        return ['-entry_date', '-odometer']


class VehiclePagination(PageNumberPagination):
    """
    Pagination for Vehicle list.
    DoS Protection: limit selection size.
    """
    page_size = 50
    max_page_size = 100  # Maximum 100 vehicles per request
    page_size_query_param = 'page_size'


@extend_schema_view(
    list=extend_schema(
        summary="List all vehicles",
        description="Retrieve a list of all vehicles belonging to the authenticated user.",
        tags=['Vehicles'],
    ),
    create=extend_schema(
        summary="Create a new vehicle",
        description="Create a new vehicle and associate it with the authenticated user.",
        tags=['Vehicles'],
    ),
    retrieve=extend_schema(
        summary="Get vehicle details",
        description="Retrieve details of a specific vehicle by ID.",
        tags=['Vehicles'],
    ),
    update=extend_schema(
        summary="Update vehicle",
        description="Update all fields of a specific vehicle.",
        tags=['Vehicles'],
    ),
    partial_update=extend_schema(
        summary="Partially update vehicle",
        description="Update specific fields of a vehicle.",
        tags=['Vehicles'],
    ),
    destroy=extend_schema(
        summary="Delete vehicle",
        description="Delete a vehicle and all its associated fuel entries.",
        tags=['Vehicles'],
    ),
)
class VehicleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CRUD operations with vehicles.
    User sees and manages only their own vehicles.
    """
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    pagination_class = VehiclePagination  # DoS Protection

    def get_queryset(self):
        """
        Data isolation: return only current user's vehicles.
        Use select_related for query optimization.
        """
        return Vehicle.objects.filter(user=self.request.user).select_related('user')

    def perform_create(self, serializer):
        """
        When creating a vehicle, automatically bind it to the current user.
        """
        serializer.save(user=self.request.user)

    @transaction.atomic
    def perform_update(self, serializer):
        """
        When updating vehicle:
        1. Check if initial_odometer was changed
        2. Save changes
        3. If initial_odometer changed, recalculate all metrics for vehicle entries
        4. Invalidate statistics cache
        """
        # Get old initial_odometer value before update
        old_initial_odometer = serializer.instance.initial_odometer

        # Save updated vehicle
        vehicle = serializer.save()

        # If initial_odometer changed, recalculate all metrics for this vehicle
        if vehicle.initial_odometer != old_initial_odometer:
            FuelEntryMetricsService.recalculate_all_metrics_for_vehicle(vehicle.id)

            # Invalidate statistics cache for this user
            self._invalidate_statistics_cache(vehicle.user_id)

    def _invalidate_statistics_cache(self, user_id: int):
        """
        Invalidates statistics cache for user by updating version key.
        This makes all old cache entries invalid.
        """
        cache.set(f'stats_version_user_{user_id}', timezone.now().timestamp())


@extend_schema_view(
    list=extend_schema(
        summary="List fuel entries",
        description="Retrieve a paginated list of fuel entries. Supports filtering and sorting.",
        tags=['Fuel Entries'],
        parameters=[
            OpenApiParameter(
                name='vehicle',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filter by vehicle ID',
                required=False,
            ),
            OpenApiParameter(
                name='date_after',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='Filter entries on or after this date (YYYY-MM-DD)',
                required=False,
            ),
            OpenApiParameter(
                name='date_before',
                type=OpenApiTypes.DATE,
                location=OpenApiParameter.QUERY,
                description='Filter entries on or before this date (YYYY-MM-DD)',
                required=False,
            ),
            OpenApiParameter(
                name='fuel_brand',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by fuel brand (case-insensitive partial match)',
                required=False,
            ),
            OpenApiParameter(
                name='fuel_grade',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by fuel grade (case-insensitive partial match)',
                required=False,
            ),
            OpenApiParameter(
                name='station_name',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by station name (case-insensitive partial match)',
                required=False,
            ),
            OpenApiParameter(
                name='sort_by',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Sort by field: entry_date, odometer, total_amount, created_at',
                required=False,
            ),
            OpenApiParameter(
                name='sort_order',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Sort order: asc or desc',
                required=False,
            ),
        ],
    ),
    create=extend_schema(
        summary="Create fuel entry",
        description="Create a new fuel entry. Automatically calculates metrics (consumption, cost per km, etc.). "
                    "Validates that odometer reading is greater than the previous entry for the same vehicle.",
        tags=['Fuel Entries'],
    ),
    retrieve=extend_schema(
        summary="Get fuel entry details",
        description="Retrieve details of a specific fuel entry by ID.",
        tags=['Fuel Entries'],
    ),
    update=extend_schema(
        summary="Update fuel entry",
        description="Update all fields of a fuel entry. Recalculates metrics for this and subsequent entries.",
        tags=['Fuel Entries'],
    ),
    partial_update=extend_schema(
        summary="Partially update fuel entry",
        description="Update specific fields of a fuel entry. Recalculates metrics for this and subsequent entries.",
        tags=['Fuel Entries'],
    ),
    destroy=extend_schema(
        summary="Delete fuel entry",
        description="Delete a fuel entry and recalculate metrics for all remaining entries of the vehicle.",
        tags=['Fuel Entries'],
    ),
)
class FuelEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CRUD operations with fuel entries.
    
    Business logic:
    - On creation: calculates metrics automatically
    - On update: recalculates metrics for current and subsequent entries
    - On deletion: recalculates metrics for all vehicle entries
    - All operations are performed in transactions
    """
    serializer_class = FuelEntrySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    pagination_class = FuelEntryCursorPagination

    def get_queryset(self):
        """
        Data isolation: return only current user's entries.
        Use select_related for optimization of related object queries.
        """
        queryset = FuelEntry.objects.filter(user=self.request.user).select_related('vehicle', 'user')
        
        # Filter by vehicle (optional)
        vehicle_id = self.request.query_params.get('vehicle', None)
        if vehicle_id is not None:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        
        # Filter by date range (optional)
        date_after = self.request.query_params.get('date_after', None)
        date_before = self.request.query_params.get('date_before', None)
        
        if date_after:
            queryset = queryset.filter(entry_date__gte=date_after)
        if date_before:
            queryset = queryset.filter(entry_date__lte=date_before)
        
        # Filter by fuel brand (optional)
        fuel_brand = self.request.query_params.get('fuel_brand', None)
        if fuel_brand:
            queryset = queryset.filter(fuel_brand__icontains=fuel_brand)
        
        # Filter by fuel grade (optional)
        fuel_grade = self.request.query_params.get('fuel_grade', None)
        if fuel_grade:
            queryset = queryset.filter(fuel_grade__icontains=fuel_grade)
        
        # Filter by station name (optional)
        station_name = self.request.query_params.get('station_name', None)
        if station_name:
            queryset = queryset.filter(station_name__icontains=station_name)
        
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        """
        When creating entry:
        1. Bind to current user
        2. Save to DB
        3. Calculate metrics
        4. Recalculate metrics for subsequent entries (if any)
        5. Invalidate statistics cache
        """
        # Save entry
        fuel_entry = serializer.save(user=self.request.user)
        
        # Calculate metrics for current entry
        FuelEntryMetricsService.calculate_metrics(fuel_entry)
        fuel_entry.save(update_fields=[
            'unit_price', 
            'distance_since_last', 
            'consumption_l_100km', 
            'cost_per_km'
        ])
        
        # Recalculate metrics for all subsequent entries
        FuelEntryMetricsService.recalculate_metrics_after_entry(fuel_entry)
        
        # Invalidate statistics cache for this user
        self._invalidate_statistics_cache(fuel_entry.user_id)

    @transaction.atomic
    def perform_update(self, serializer):
        """
        When updating entry:
        1. Save changes
        2. Recalculate metrics for current entry
        3. Recalculate metrics for all subsequent entries
        4. Invalidate statistics cache
        """
        # Save updated entry
        fuel_entry = serializer.save()
        
        # Recalculate metrics for current entry
        FuelEntryMetricsService.calculate_metrics(fuel_entry)
        fuel_entry.save(update_fields=[
            'unit_price', 
            'distance_since_last', 
            'consumption_l_100km', 
            'cost_per_km'
        ])
        
        # Recalculate metrics for all subsequent entries
        FuelEntryMetricsService.recalculate_metrics_after_entry(fuel_entry)
        
        # Invalidate statistics cache for this user
        self._invalidate_statistics_cache(fuel_entry.user_id)

    @transaction.atomic
    def perform_destroy(self, instance):
        """
        When deleting entry:
        1. Save vehicle_id and user_id
        2. Delete entry
        3. Recalculate metrics for all remaining vehicle entries
        4. Invalidate statistics cache
        """
        vehicle_id = instance.vehicle_id
        user_id = instance.user_id
        
        # Delete entry
        instance.delete()
        
        # Recalculate metrics for all entries of this vehicle
        FuelEntryMetricsService.recalculate_all_metrics_for_vehicle(vehicle_id)
        
        # Invalidate statistics cache for this user
        self._invalidate_statistics_cache(user_id)
    
    def _invalidate_statistics_cache(self, user_id: int):
        """
        Invalidates statistics cache for user by updating version key.
        This makes all old cache entries invalid.
        """
        cache.set(f'stats_version_user_{user_id}', timezone.now().timestamp())


@extend_schema(
    summary="Get dashboard statistics",
    description="Retrieve aggregated statistics for the dashboard. Supports filtering by vehicle and time period. "
                "Results are cached for 5 minutes for performance optimization.",
    tags=['Statistics'],
    responses={
        200: DashboardStatisticsResponseSerializer,
        400: OpenApiResponse(description="Validation error (invalid period, missing dates for custom period)"),
    },
    parameters=[
        OpenApiParameter(
            name='vehicle',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='Filter statistics by vehicle ID. If omitted, aggregates across all vehicles.',
            required=False,
        ),
        OpenApiParameter(
            name='period',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='Time period type. Options: 30d (last 30 days), 90d (last 90 days), ytd (year to date), custom (requires date_after and date_before)',
            required=False,
            enum=['30d', '90d', 'ytd', 'custom'],
        ),
        OpenApiParameter(
            name='date_after',
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description='Start date for custom period (YYYY-MM-DD). Required when period=custom.',
            required=False,
        ),
        OpenApiParameter(
            name='date_before',
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description='End date for custom period (YYYY-MM-DD). Required when period=custom.',
            required=False,
        ),
    ],
    examples=[
        OpenApiExample(
            'Last 30 days',
            description='Get statistics for the last 30 days across all vehicles',
            value={
                'period': {
                    'type': '30d',
                    'date_after': '2024-12-16',
                    'date_before': '2025-01-15'
                },
                'aggregates': {
                    'average_consumption': 8.5,
                    'average_unit_price': 1.42,
                    'total_distance': 1200,
                    'total_spent': 560.00,
                    'average_cost_per_km': 0.47,
                    'total_liters': 102.0,
                    'entries_count': 8
                },
                'time_series': {
                    'consumption': [
                        {'date': '2024-12-20', 'value': 9.2},
                        {'date': '2024-12-25', 'value': 8.1}
                    ],
                    'unit_price': [
                        {'date': '2024-12-20', 'value': 1.45},
                        {'date': '2024-12-25', 'value': 1.40}
                    ]
                }
            },
            response_only=True,
        ),
    ],
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_statistics(request):
    """
    Endpoint for retrieving dashboard statistics.
    
    Query Parameters:
    - vehicle: Vehicle ID (optional)
    - period: Period type (30d, 90d, ytd, custom), default 30d
    - date_after: Period start (for period=custom), format YYYY-MM-DD
    - date_before: Period end (for period=custom), format YYYY-MM-DD
    
    Uses caching for performance optimization.
    Cache is invalidated when creating/updating/deleting entries.
    """
    user_id = request.user.id
    vehicle_id = request.query_params.get('vehicle', None)
    period_type = request.query_params.get('period', '30d')
    date_after_str = request.query_params.get('date_after', None)
    date_before_str = request.query_params.get('date_before', None)
    
    # Validation period_type
    if period_type not in ['30d', '90d', 'ytd', 'custom']:
        return Response(
            {'errors': [{'status': '400', 'code': 'invalid_period', 'detail': 'Invalid period type. Must be one of: 30d, 90d, ytd, custom'}]},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse dates for custom period
    date_after = None
    date_before = None
    if period_type == 'custom':
        if not date_after_str or not date_before_str:
            return Response(
                {'errors': [{'status': '400', 'code': 'missing_dates', 'detail': 'Custom period requires date_after and date_before parameters'}]},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            date_after = datetime.strptime(date_after_str, '%Y-%m-%d').date()
            date_before = datetime.strptime(date_before_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'errors': [{'status': '400', 'code': 'invalid_date_format', 'detail': 'Invalid date format. Use YYYY-MM-DD'}]},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Validate custom period range (DoS protection via large periods)
    if period_type == 'custom' and date_after and date_before:
        date_range = (date_before - date_after).days
        if date_range > 365:
            return Response({
                'errors': [{
                    'status': '400',
                    'code': 'period_too_long',
                    'detail': 'Custom period cannot exceed 365 days'
                }]
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get statistics cache version key
    stats_version = cache.get(f'stats_version_user_{user_id}', 1)
    
    # Form safe cache key (protection against cache pollution)
    cache_key = generate_safe_cache_key(
        'dashboard_stats',
        user_id,
        version=stats_version,
        vehicle=vehicle_id,
        period=period_type,
        after=date_after_str,
        before=date_before_str
    )
    
    # Try to get from cache
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return Response(cached_result)
    
    # Calculate statistics
    try:
        result = StatisticsService.calculate_dashboard_statistics(
            user_id=user_id,
            vehicle_id=int(vehicle_id) if vehicle_id else None,
            period_type=period_type,
            date_after=date_after,
            date_before=date_before
        )
    except ValueError as e:
        return Response(
            {'errors': [{'status': '400', 'code': 'calculation_error', 'detail': str(e)}]},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Cache for 5 minutes (300 seconds)
    cache.set(cache_key, result, 300)

    return Response(result)


@extend_schema(
    summary="Get statistics by fuel brand",
    description="Retrieve all-time statistics grouped by fuel brand. Includes average consumption, "
                "average unit price, average cost per km, and number of fill-ups for each brand. "
                "Results are cached for 5 minutes for performance optimization.",
    tags=['Statistics'],
    responses={
        200: BrandStatisticsSerializer(many=True),
    },
    parameters=[
        OpenApiParameter(
            name='vehicle',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='Filter statistics by vehicle ID. If omitted, aggregates across all vehicles.',
            required=False,
        ),
    ],
    examples=[
        OpenApiExample(
            'Brand statistics example',
            description='Statistics for all fuel brands',
            value=[
                {
                    'brand': 'Shell',
                    'average_consumption': 8.5,
                    'average_unit_price': 1.42,
                    'average_cost_per_km': 0.47,
                    'fill_count': 15
                },
                {
                    'brand': 'BP',
                    'average_consumption': 8.7,
                    'average_unit_price': 1.38,
                    'average_cost_per_km': 0.48,
                    'fill_count': 12
                }
            ],
            response_only=True,
        ),
    ],
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def brand_statistics(request):
    """
    Endpoint for retrieving fuel brand statistics.

    Query Parameters:
    - vehicle: Vehicle ID (optional)

    Returns all-time statistics for each brand:
    - average_consumption: average consumption (L/100km)
    - average_unit_price: average price per liter
    - average_cost_per_km: average cost per km
    - fill_count: number of fill-ups
    """
    user_id = request.user.id
    vehicle_id = request.query_params.get('vehicle', None)
    
    # Get statistics cache version key
    stats_version = cache.get(f'stats_version_user_{user_id}', 1)
    
    # Form safe cache key
    cache_key = generate_safe_cache_key(
        'brand_stats',
        user_id,
        version=stats_version,
        vehicle=vehicle_id
    )
    
    # Try to get from cache
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return Response(cached_result)

    # Calculate statistics
    result = StatisticsService.calculate_brand_statistics(
        user_id=user_id,
        vehicle_id=int(vehicle_id) if vehicle_id else None
    )

    # Cache for 5 minutes (300 seconds)
    cache.set(cache_key, result, 300)

    return Response(result)


@extend_schema(
    summary="Get statistics by fuel grade",
    description="Retrieve all-time statistics grouped by fuel grade (octane number). Includes average consumption, "
                "average unit price, average cost per km, and number of fill-ups for each grade.",
    tags=['Statistics'],
    responses={
        200: GradeStatisticsSerializer(many=True),
    },
    parameters=[
        OpenApiParameter(
            name='vehicle',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='Filter statistics by vehicle ID. If omitted, aggregates across all vehicles.',
            required=False,
        ),
    ],
    examples=[
        OpenApiExample(
            'Grade statistics example',
            description='Statistics for all fuel grades',
            value=[
                {
                    'grade': '95',
                    'average_consumption': 8.5,
                    'average_unit_price': 1.42,
                    'average_cost_per_km': 0.47,
                    'fill_count': 20
                },
                {
                    'grade': '98',
                    'average_consumption': 8.3,
                    'average_unit_price': 1.52,
                    'average_cost_per_km': 0.49,
                    'fill_count': 7
                }
            ],
            response_only=True,
        ),
    ],
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def grade_statistics(request):
    """
    Endpoint for retrieving fuel grade statistics.

    Query Parameters:
    - vehicle: Vehicle ID (optional)

    Returns all-time statistics for each grade:
    - average_consumption: average consumption (L/100km)
    - average_unit_price: average price per liter
    - average_cost_per_km: average cost per km
    - fill_count: number of fill-ups
    """
    user_id = request.user.id
    vehicle_id = request.query_params.get('vehicle', None)
    
    # Get statistics cache version key
    stats_version = cache.get(f'stats_version_user_{user_id}', 1)
    
    # Form safe cache key
    cache_key = generate_safe_cache_key(
        'grade_stats',
        user_id,
        version=stats_version,
        vehicle=vehicle_id
    )
    
    # Try to get from cache
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return Response(cached_result)

    # Calculate statistics
    result = StatisticsService.calculate_grade_statistics(
        user_id=user_id,
        vehicle_id=int(vehicle_id) if vehicle_id else None
    )

    # Cache for 5 minutes (300 seconds)
    cache.set(cache_key, result, 300)

    return Response(result)
