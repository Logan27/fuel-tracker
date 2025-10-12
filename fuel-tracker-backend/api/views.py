from datetime import datetime
import hashlib
from django.db import transaction
from django.core.cache import cache
from django.utils.decorators import method_decorator
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
    Генерирует безопасный cache key используя hash для user-controlled данных.
    Защита от cache pollution и NoSQL injection через Redis keys.
    """
    # Сортируем kwargs для консистентности
    sorted_params = sorted(kwargs.items())
    params_str = '_'.join(f"{k}={v}" for k, v in sorted_params if v is not None)
    
    # Создаём hash от параметров
    params_hash = hashlib.md5(params_str.encode()).hexdigest()[:16]
    
    return f"{prefix}_user{user_id}_{params_hash}"


class FuelEntryCursorPagination(CursorPagination):
    """
    Кастомная пагинация для FuelEntry
    Сортировка по дате (новые первыми), затем по created_at
    """
    page_size = 25
    max_page_size = 100  # DoS Protection: максимум 100 записей за раз
    ordering = '-entry_date'  # Сортировка по дате заправки (новые первыми)
    
    def get_ordering(self, request, queryset, view):
        """
        Получаем сортировку из параметров запроса или используем по умолчанию
        """
        sort_by = request.query_params.get('sort_by', 'entry_date')
        sort_order = request.query_params.get('sort_order', 'desc')
        
        # Валидация параметров сортировки
        valid_sort_fields = ['entry_date', 'odometer', 'total_amount', 'created_at']
        if sort_by in valid_sort_fields:
            if sort_order == 'desc':
                return [f'-{sort_by}']
            else:
                return [sort_by]
        
        # Сортировка по умолчанию
        return ['-entry_date']


class VehiclePagination(PageNumberPagination):
    """
    Пагинация для Vehicle list.
    DoS Protection: ограничение размера выборки.
    """
    page_size = 50
    max_page_size = 100  # Максимум 100 vehicles за запрос
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
    ViewSet для CRUD операций с автомобилями.
    Пользователь видит и управляет только своими автомобилями.
    """
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    pagination_class = VehiclePagination  # DoS Protection

    def get_queryset(self):
        """
        Изоляция данных: возвращаем только автомобили текущего пользователя.
        Используем select_related для оптимизации запросов.
        """
        return Vehicle.objects.filter(user=self.request.user).select_related('user')

    def perform_create(self, serializer):
        """
        При создании автомобиля автоматически привязываем его к текущему пользователю.
        """
        serializer.save(user=self.request.user)


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
    ViewSet для CRUD операций с записями о заправках.
    
    Бизнес-логика:
    - При создании: вычисляет метрики автоматически
    - При обновлении: пересчитывает метрики текущей и последующих записей
    - При удалении: пересчитывает метрики всех записей автомобиля
    - Все операции выполняются в транзакциях
    """
    serializer_class = FuelEntrySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    pagination_class = FuelEntryCursorPagination

    def get_queryset(self):
        """
        Изоляция данных: возвращаем только записи текущего пользователя.
        Используем select_related для оптимизации запросов к связанным объектам.
        """
        queryset = FuelEntry.objects.filter(user=self.request.user).select_related('vehicle', 'user')
        
        # Фильтрация по vehicle (опционально)
        vehicle_id = self.request.query_params.get('vehicle', None)
        if vehicle_id is not None:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        
        # Фильтрация по диапазону дат (опционально)
        date_after = self.request.query_params.get('date_after', None)
        date_before = self.request.query_params.get('date_before', None)
        
        if date_after:
            queryset = queryset.filter(entry_date__gte=date_after)
        if date_before:
            queryset = queryset.filter(entry_date__lte=date_before)
        
        # Фильтрация по бренду топлива (опционально)
        fuel_brand = self.request.query_params.get('fuel_brand', None)
        if fuel_brand:
            queryset = queryset.filter(fuel_brand__icontains=fuel_brand)
        
        # Фильтрация по типу топлива (опционально)
        fuel_grade = self.request.query_params.get('fuel_grade', None)
        if fuel_grade:
            queryset = queryset.filter(fuel_grade__icontains=fuel_grade)
        
        # Фильтрация по названию станции (опционально)
        station_name = self.request.query_params.get('station_name', None)
        if station_name:
            queryset = queryset.filter(station_name__icontains=station_name)
        
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        """
        При создании записи:
        1. Привязываем к текущему пользователю
        2. Сохраняем в БД
        3. Вычисляем метрики
        4. Пересчитываем метрики последующих записей (если есть)
        5. Инвалидируем кэш статистики
        """
        # Сохраняем запись
        fuel_entry = serializer.save(user=self.request.user)
        
        # Вычисляем метрики для текущей записи
        FuelEntryMetricsService.calculate_metrics(fuel_entry)
        fuel_entry.save(update_fields=[
            'unit_price', 
            'distance_since_last', 
            'consumption_l_100km', 
            'cost_per_km'
        ])
        
        # Пересчитываем метрики для всех последующих записей
        FuelEntryMetricsService.recalculate_metrics_after_entry(fuel_entry)
        
        # Инвалидируем кэш статистики для этого пользователя
        self._invalidate_statistics_cache(fuel_entry.user_id)

    @transaction.atomic
    def perform_update(self, serializer):
        """
        При обновлении записи:
        1. Сохраняем изменения
        2. Пересчитываем метрики текущей записи
        3. Пересчитываем метрики всех последующих записей
        4. Инвалидируем кэш статистики
        """
        # Сохраняем обновленную запись
        fuel_entry = serializer.save()
        
        # Пересчитываем метрики для текущей записи
        FuelEntryMetricsService.calculate_metrics(fuel_entry)
        fuel_entry.save(update_fields=[
            'unit_price', 
            'distance_since_last', 
            'consumption_l_100km', 
            'cost_per_km'
        ])
        
        # Пересчитываем метрики для всех последующих записей
        FuelEntryMetricsService.recalculate_metrics_after_entry(fuel_entry)
        
        # Инвалидируем кэш статистики для этого пользователя
        self._invalidate_statistics_cache(fuel_entry.user_id)

    @transaction.atomic
    def perform_destroy(self, instance):
        """
        При удалении записи:
        1. Сохраняем vehicle_id и user_id
        2. Удаляем запись
        3. Пересчитываем метрики для всех оставшихся записей автомобиля
        4. Инвалидируем кэш статистики
        """
        vehicle_id = instance.vehicle_id
        user_id = instance.user_id
        
        # Удаляем запись
        instance.delete()
        
        # Пересчитываем метрики для всех записей этого автомобиля
        FuelEntryMetricsService.recalculate_all_metrics_for_vehicle(vehicle_id)
        
        # Инвалидируем кэш статистики для этого пользователя
        self._invalidate_statistics_cache(user_id)
    
    def _invalidate_statistics_cache(self, user_id: int):
        """
        Инвалидирует весь кэш статистики для пользователя.
        Использует паттерн с префиксом для удаления всех ключей.
        """
        # Удаляем все ключи кэша для этого пользователя
        cache_pattern = f'dashboard_stats_user{user_id}_*'
        # Django redis не поддерживает delete_pattern из коробки,
        # поэтому просто удаляем весь кэш для этого пользователя
        # В production можно использовать более сложную логику с Redis SCAN
        # Для простоты сбрасываем все возможные комбинации
        for period in ['30d', '90d', 'ytd']:
            for vehicle_id in [None, '*']:
                cache_key = f'dashboard_stats_user{user_id}_vehicle{vehicle_id}_period{period}_afterNone_beforeNone'
                cache.delete(cache_key)
        
        # Инвалидируем кэш статистики по брендам и маркам
        cache.delete(f'brand_stats_user{user_id}_vehicleNone')
        cache.delete(f'grade_stats_user{user_id}_vehicleNone')
        
        # Инвалидируем кэш для всех автомобилей пользователя
        from api.models import Vehicle
        user_vehicles = Vehicle.objects.filter(user_id=user_id).values_list('id', flat=True)
        for vehicle_id in user_vehicles:
            cache.delete(f'brand_stats_user{user_id}_vehicle{vehicle_id}')
            cache.delete(f'grade_stats_user{user_id}_vehicle{vehicle_id}')


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
    Эндпоинт для получения статистики дашборда.
    
    Query Parameters:
    - vehicle: ID автомобиля (опционально)
    - period: тип периода (30d, 90d, ytd, custom), по умолчанию 30d
    - date_after: начало периода (для period=custom), формат YYYY-MM-DD
    - date_before: конец периода (для period=custom), формат YYYY-MM-DD
    
    Использует кэширование для оптимизации производительности.
    Кэш инвалидируется при создании/обновлении/удалении записей.
    """
    user_id = request.user.id
    vehicle_id = request.query_params.get('vehicle', None)
    period_type = request.query_params.get('period', '30d')
    date_after_str = request.query_params.get('date_after', None)
    date_before_str = request.query_params.get('date_before', None)
    
    # Валидация period_type
    if period_type not in ['30d', '90d', 'ytd', 'custom']:
        return Response(
            {'errors': [{'status': '400', 'code': 'invalid_period', 'detail': 'Invalid period type. Must be one of: 30d, 90d, ytd, custom'}]},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Парсинг дат для custom периода
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
    
    # Валидация custom period range (защита от DoS через большие периоды)
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
    
    # Формируем безопасный ключ кэша (защита от cache pollution)
    cache_key = generate_safe_cache_key(
        'dashboard_stats',
        user_id,
        vehicle=vehicle_id,
        period=period_type,
        after=date_after_str,
        before=date_before_str
    )
    
    # Пытаемся получить из кэша
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return Response(cached_result)
    
    # Вычисляем статистику
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
    
    # Кэшируем на 5 минут (300 секунд)
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
    Эндпоинт для получения статистики по брендам топлива.

    Query Parameters:
    - vehicle: ID автомобиля (опционально)

    Возвращает all-time статистику для каждого бренда:
    - average_consumption: средний расход (л/100км)
    - average_unit_price: средняя цена за литр
    - average_cost_per_km: средняя стоимость за км
    - fill_count: количество заправок
    """
    user_id = request.user.id
    vehicle_id = request.query_params.get('vehicle', None)
    
    # Формируем безопасный ключ кэша
    cache_key = generate_safe_cache_key(
        'brand_stats',
        user_id,
        vehicle=vehicle_id
    )
    
    # Пытаемся получить из кэша
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return Response(cached_result)

    # Вычисляем статистику
    result = StatisticsService.calculate_brand_statistics(
        user_id=user_id,
        vehicle_id=int(vehicle_id) if vehicle_id else None
    )

    # Кэшируем на 5 минут (300 секунд)
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
    Эндпоинт для получения статистики по маркам топлива.

    Query Parameters:
    - vehicle: ID автомобиля (опционально)

    Возвращает all-time статистику для каждой марки:
    - average_consumption: средний расход (л/100км)
    - average_unit_price: средняя цена за литр
    - average_cost_per_km: средняя стоимость за км
    - fill_count: количество заправок
    """
    user_id = request.user.id
    vehicle_id = request.query_params.get('vehicle', None)
    
    # Формируем безопасный ключ кэша
    cache_key = generate_safe_cache_key(
        'grade_stats',
        user_id,
        vehicle=vehicle_id
    )
    
    # Пытаемся получить из кэша
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return Response(cached_result)

    # Вычисляем статистику
    result = StatisticsService.calculate_grade_statistics(
        user_id=user_id,
        vehicle_id=int(vehicle_id) if vehicle_id else None
    )

    # Кэшируем на 5 минут (300 секунд)
    cache.set(cache_key, result, 300)

    return Response(result)
