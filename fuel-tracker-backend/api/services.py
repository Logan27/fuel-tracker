"""
Service layer for application business logic.
Encapsulates metrics calculation and cascade recalculation logic.
"""
from decimal import Decimal
from typing import Optional, Dict, List, Any
from datetime import date, timedelta
from django.db import transaction
from django.db.models import Avg, Sum, Count, Min, Max, Q
from django.utils import timezone
from .models import FuelEntry, Vehicle


class FuelEntryMetricsService:
    """
    Service for calculating fuel entry metrics.
    
    Business rules:
    1. First entry for vehicle - baseline (metrics = None)
    2. Subsequent entries calculate metrics based on previous
    3. Metrics stored in metric system (km, liters)
    """
    
    @staticmethod
    def calculate_metrics(fuel_entry: FuelEntry, previous_entry: Optional[FuelEntry] = None) -> None:
        """
        Calculate metrics for fuel entry.
        
        Args:
            fuel_entry: Fuel entry (must be saved to DB)
            previous_entry: previous entry (optional). If not provided, will query DB.
        """
        # unit_price is always calculated
        fuel_entry.unit_price = fuel_entry.total_amount / fuel_entry.liters
        
        # If previous_entry not provided, get it from DB.
        # This maintains backward compatibility, but for bulk operations it should be passed.
        if previous_entry is None:
            previous_entry = FuelEntry.objects.filter(
                vehicle=fuel_entry.vehicle,
                entry_date__lt=fuel_entry.entry_date
            ).order_by('-entry_date', '-created_at').first()
        
        # If this is first entry (baseline) - metrics are not calculated
        # According to BRD 3.5: "Per-fill Computed Fields (for each entry after the baseline)"
        if not previous_entry:
            fuel_entry.distance_since_last = None
            fuel_entry.consumption_l_100km = None
            fuel_entry.cost_per_km = None
            return
        
        # Calculate distance from previous entry
        distance = fuel_entry.odometer - previous_entry.odometer
        fuel_entry.distance_since_last = distance
        
        # Calculate consumption (L/100km) and cost_per_km if there's positive distance
        if distance > 0:
            # consumption = (liters / distance) * 100
            fuel_entry.consumption_l_100km = (fuel_entry.liters / Decimal(distance)) * Decimal(100)
            
            # cost_per_km = total_amount / distance
            fuel_entry.cost_per_km = fuel_entry.total_amount / Decimal(distance)
        else:
            fuel_entry.consumption_l_100km = None
            fuel_entry.cost_per_km = None
    
    @staticmethod
    def get_previous_entry(vehicle_id: int, entry_date: date, entry_id: Optional[int] = None) -> Optional[FuelEntry]:
        """
        Get previous entry for vehicle.
        Considers entries with same date but created earlier.
        """
        queryset = FuelEntry.objects.filter(vehicle_id=vehicle_id)
        
        if entry_id:
            queryset = queryset.exclude(id=entry_id)
            
        # Look for entries strictly earlier by date OR same day, but created earlier
        # This is needed for correct operation when changing date of existing entry
        current_entry_instance = FuelEntry.objects.filter(id=entry_id).first()
        
        # If we're editing existing entry, we need to know its created_at
        entry_created_at = current_entry_instance.created_at if current_entry_instance else timezone.now()

        previous_entries = queryset.filter(
            Q(entry_date__lt=entry_date) | 
            Q(entry_date=entry_date, created_at__lt=entry_created_at)
        ).order_by('-entry_date', '-created_at')
        
        return previous_entries.first()
    
    @staticmethod
    def get_next_entry(vehicle_id: int, entry_date: date, entry_id: Optional[int] = None) -> Optional[FuelEntry]:
        """
        Get next entry for vehicle.
        Considers entries with same date, but created later.
        """
        queryset = FuelEntry.objects.filter(vehicle_id=vehicle_id)
        
        if entry_id:
            queryset = queryset.exclude(id=entry_id)
            
        # Look for entries strictly later by date OR same day but created later
        current_entry_instance = FuelEntry.objects.filter(id=entry_id).first()
        
        # If we're editing existing entry, we need to know its created_at
        entry_created_at = current_entry_instance.created_at if current_entry_instance else timezone.now()

        next_entries = queryset.filter(
            Q(entry_date__gt=entry_date) |
            Q(entry_date=entry_date, created_at__gt=entry_created_at)
        ).order_by('entry_date', 'created_at')
        
        return next_entries.first()
    
    @staticmethod
    @transaction.atomic
    def recalculate_metrics_after_entry(fuel_entry: FuelEntry) -> int:
        """
        Cascade metrics recalculation for all entries after specified.
        
        Args:
            fuel_entry: Entry after which to recalculate
        
        Returns:
            Number of recalculated entries
        """
        # Get all entries after current
        entries_to_recalculate = FuelEntry.objects.filter(
            vehicle=fuel_entry.vehicle,
            entry_date__gt=fuel_entry.entry_date
        ).order_by('entry_date', 'created_at')
        
        count = 0
        for entry in entries_to_recalculate:
            FuelEntryMetricsService.calculate_metrics(entry)
            entry.save(update_fields=[
                'unit_price', 
                'distance_since_last', 
                'consumption_l_100km', 
                'cost_per_km'
            ])
            count += 1
        
        return count
    
    @staticmethod
    @transaction.atomic
    def recalculate_all_metrics_for_vehicle(vehicle_id: int) -> int:
        """
        Optimized full metrics recalculation for all vehicle entries.
        Used after entry deletion or changing initial_odometer.
        Performs 1 SELECT for entries, 1 SELECT for vehicle and 1 bulk_update.
        
        Args:
            vehicle_id: Vehicle ID
        
        Returns:
            Number of updated entries
        """
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id)
        except Vehicle.DoesNotExist:
            return 0

        # 1. One SELECT for all entries
        entries = list(FuelEntry.objects.filter(
            vehicle_id=vehicle_id
        ).order_by('entry_date', 'created_at'))

        if not entries:
            return 0
        
        # 2. Calculate metrics in memory
        previous_entry = None
        for entry in entries:
            # Pass previous_entry to avoid N+1 queries
            FuelEntryMetricsService.calculate_metrics(entry, previous_entry)
            previous_entry = entry

        # 3. One bulk_update to save all changes
        update_fields = ['unit_price', 'distance_since_last', 'consumption_l_100km', 'cost_per_km']
        FuelEntry.objects.bulk_update(entries, update_fields)

        return len(entries)


class StatisticsService:
    """
    Service for calculating statistics and aggregates for fuel entries.
    
    Supports periods:
    - 30d: last 30 days
    - 90d: last 90 days
    - ytd: from start of year
    - custom: custom period (date_after, date_before)
    """
    
    @staticmethod
    def get_period_dates(period_type: str, date_after: Optional[date] = None, date_before: Optional[date] = None) -> Dict[str, date]:
        """
        Calculate period boundaries based on type.
        
        Args:
            period_type: Period type (30d, 90d, ytd, custom)
            date_after: Period start (for custom)
            date_before: Period end (for custom)
        
        Returns:
            Dict with date_after and date_before
        """
        today = timezone.now().date()
        
        if period_type == '30d':
            return {
                'date_after': today - timedelta(days=30),
                'date_before': today
            }
        elif period_type == '90d':
            return {
                'date_after': today - timedelta(days=90),
                'date_before': today
            }
        elif period_type == 'ytd':
            return {
                'date_after': date(today.year, 1, 1),
                'date_before': today
            }
        elif period_type == 'custom':
            if not date_after or not date_before:
                raise ValueError("Custom period requires date_after and date_before")
            return {
                'date_after': date_after,
                'date_before': date_before
            }
        else:
            raise ValueError(f"Invalid period type: {period_type}")
    
    @staticmethod
    def calculate_dashboard_statistics(
        user_id: int,
        vehicle_id: Optional[int] = None,
        period_type: str = '30d',
        date_after: Optional[date] = None,
        date_before: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Calculate dashboard statistics.
        
        Args:
            user_id: User ID
            vehicle_id: Vehicle ID (optional, if None - for all)
            period_type: Period type (30d, 90d, ytd, custom)
            date_after: Period start (for custom)
            date_before: Period end (for custom)
        
        Returns:
            Dict with statistics: period, aggregates, time_series
        """
        # Determine period boundaries
        period_dates = StatisticsService.get_period_dates(period_type, date_after, date_before)
        
        # Base queryset with filtering by user and period
        queryset = FuelEntry.objects.filter(
            user_id=user_id,
            entry_date__gte=period_dates['date_after'],
            entry_date__lte=period_dates['date_before']
        )
        
        # Filter by vehicle (if specified)
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        
        # Aggregates (only for entries with calculated metrics for consumption)
        # Exclude baseline entries (where distance_since_last = None)
        entries_with_metrics = queryset.exclude(
            Q(distance_since_last__isnull=True) | Q(consumption_l_100km__isnull=True)
        )
        
        aggregates = entries_with_metrics.aggregate(
            total_fuel_for_consumption=Sum('liters'),
            min_consumption=Min('consumption_l_100km'),
            max_consumption=Max('consumption_l_100km'),
        )
        
        # Aggregate total sums across all entries
        # total_cost and total_fuel include baseline entries
        total_aggregates = queryset.aggregate(
            total_fuel=Sum('liters'),
            total_cost=Sum('total_amount'),
            entry_count=Count('id'),
        )

        # Combine aggregation results
        aggregates.update(total_aggregates)

        # Calculate total_distance correctly
        # For each vehicle: distance = max_odometer - initial_odometer
        # This accounts for total distance traveled, including baseline entries
        # Then sum distances across all vehicles
        total_distance = 0

        if vehicle_id:
            # For single vehicle - simple case
            vehicle_stats = queryset.aggregate(
                max_odometer=Max('odometer'),
            )

            max_odometer = vehicle_stats.get('max_odometer')

            if max_odometer:
                # total_distance = max_odometer - initial_odometer for any number of entries
                try:
                    vehicle = Vehicle.objects.get(id=vehicle_id)
                    total_distance = max_odometer - vehicle.initial_odometer
                except Vehicle.DoesNotExist:
                    total_distance = 0
        else:
            # For multiple vehicles - group by vehicle_id
            vehicle_distances = queryset.values('vehicle_id').annotate(
                max_odometer=Max('odometer'),
            )

            # For each vehicle calculate distance: max_odometer - initial_odometer
            for veh_stat in vehicle_distances:
                vehicle_id_temp = veh_stat['vehicle_id']
                max_odo = veh_stat['max_odometer']

                if max_odo:
                    try:
                        vehicle = Vehicle.objects.get(id=vehicle_id_temp)
                        distance = max_odo - vehicle.initial_odometer
                        total_distance += distance
                    except Vehicle.DoesNotExist:
                        pass

        total_fuel_for_consumption = aggregates.get('total_fuel_for_consumption') or 0
        total_fuel = aggregates.get('total_fuel') or 0
        total_cost = aggregates.get('total_cost') or 0

        # BRD 3.5: average consumption = average fuel consumption for entries with metrics
        avg_consumption = (total_fuel_for_consumption / total_distance * 100) if total_distance > 0 else None

        # BRD 3.5: average cost per km = total_cost / total_distance
        # Use total_cost (all entries) and total_distance (entries with metrics)
        avg_cost_per_km = (total_cost / total_distance) if total_distance > 0 else None

        # BRD 3.5: average unit price = total_cost / total_fuel
        avg_unit_price = (total_cost / total_fuel) if total_fuel > 0 else None

        aggregates['average_consumption'] = avg_consumption
        aggregates['average_cost_per_km'] = avg_cost_per_km
        aggregates['average_unit_price'] = avg_unit_price
        

        # Time series (consumption and unit_price by days)
        # Use all entries (including baseline for unit_price)
        # Optimize: Get only needed fields and filter at DB level
        time_series_data = queryset.values('entry_date', 'consumption_l_100km', 'unit_price', 'cost_per_km').order_by('entry_date')
        
        # Form time series more efficiently
        consumption_series = []
        unit_price_series = []
        cost_per_km_series = []
        
        for entry in time_series_data:
            entry_date_str = str(entry['entry_date'])
            
            if entry['consumption_l_100km'] is not None:
                consumption_series.append({
                    'date': entry_date_str, 
                    'value': float(entry['consumption_l_100km'])
                })
            
            if entry['unit_price'] is not None:
                unit_price_series.append({
                    'date': entry_date_str, 
                    'value': float(entry['unit_price'])
                })
            
            if entry['cost_per_km'] is not None:
                cost_per_km_series.append({
                    'date': entry_date_str, 
                    'value': float(entry['cost_per_km'])
                })
        
        # Calculate average_distance_per_day
        # Use smaller value between request period and actual usage period
        # This is needed to not divide by large period, if entries exist only for few days
        requested_period_days = (period_dates['date_before'] - period_dates['date_after']).days + 1  # +1 to include both days

        # Get actual usage period (from first to last entry in period)
        if queryset.exists():
            date_range = queryset.aggregate(
                first_entry_date=Min('entry_date'),
                last_entry_date=Max('entry_date')
            )
            first_date = date_range.get('first_entry_date')
            last_date = date_range.get('last_entry_date')

            if first_date and last_date:
                actual_period_days = (last_date - first_date).days + 1  # +1 to include both days
                # Use smaller value
                period_days = min(requested_period_days, actual_period_days)
            else:
                period_days = requested_period_days
        else:
            period_days = requested_period_days

        average_distance_per_day = (total_distance / period_days) if period_days > 0 and total_distance > 0 else None
        
        # Format result
        result = {
            'period': {
                'type': period_type,
                'date_after': str(period_dates['date_after']),
                'date_before': str(period_dates['date_before'])
            },
            'aggregates': {
                'average_consumption': round(float(aggregates['average_consumption']), 1) if aggregates['average_consumption'] else None,
                'average_unit_price': round(float(aggregates['average_unit_price']), 2) if aggregates['average_unit_price'] else None,
                'average_cost_per_km': round(float(aggregates['average_cost_per_km']), 4) if aggregates['average_cost_per_km'] else None,
                'total_distance': int(total_distance),
                'total_liters': round(float(total_fuel), 2),
                'total_spent': round(float(total_cost), 2),
                'fill_up_count': aggregates.get('entry_count', 0),
                'entry_count': aggregates.get('entry_count', 0),  # backward compatibility for tests
                'total_fuel': round(float(total_fuel), 2),  # Alias for total_liters (backward compatibility)
                'total_cost': round(float(total_cost), 2),  # Alias for total_spent (backward compatibility)
                'average_distance_per_day': round(float(average_distance_per_day), 1) if average_distance_per_day else None,
                'min_consumption': round(float(aggregates['min_consumption']), 1) if aggregates['min_consumption'] else None,
                'max_consumption': round(float(aggregates['max_consumption']), 1) if aggregates['max_consumption'] else None,
            },
            'time_series': {
                'consumption': consumption_series,
                'unit_price': unit_price_series,
                'cost_per_km': cost_per_km_series,
            }
        }
        
        return result

    @staticmethod
    def calculate_brand_statistics(
        user_id: int,
        vehicle_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Calculate fuel brand statistics (all-time).

        Args:
            user_id: User ID
            vehicle_id: Vehicle ID (optional)

        Returns:
            List[Dict] with statistics for each brand
        """
        # Base queryset with filtering by user
        # Use select_related for query optimization
        queryset = FuelEntry.objects.filter(user_id=user_id).select_related('vehicle')

        # Filter by vehicle (if specified)
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        # One query to get all brand data
        # Use values() for grouping and aggregation
        brand_stats = queryset.exclude(
            Q(fuel_brand__isnull=True) | Q(fuel_brand='')
        ).values('fuel_brand').annotate(
            total_liters=Sum('liters'),
            total_cost=Sum('total_amount'),
            total_distance=Sum('distance_since_last'),
            fill_count=Count('id')
        ).order_by('-fill_count')

        # Form result with correct average calculation
        result = []
        for stat in brand_stats:
            total_liters = stat['total_liters'] or 0
            total_cost = stat['total_cost'] or 0
            total_distance = stat['total_distance'] or 0

            avg_consumption = (total_liters / total_distance * 100) if total_distance > 0 else None
            avg_unit_price = (total_cost / total_liters) if total_liters > 0 else None
            avg_cost_per_km = (total_cost / total_distance) if total_distance > 0 else None

            result.append({
                'brand': stat['fuel_brand'],
                'average_consumption': round(float(avg_consumption), 1) if avg_consumption else None,
                'average_unit_price': round(float(avg_unit_price), 2) if avg_unit_price else None,
                'average_cost_per_km': round(float(avg_cost_per_km), 4) if avg_cost_per_km else None,
                'fill_count': stat['fill_count']
            })

        return result

    @staticmethod
    def calculate_grade_statistics(
        user_id: int,
        vehicle_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Calculate fuel grade statistics (all-time).

        Args:
            user_id: User ID
            vehicle_id: Vehicle ID (optional)

        Returns:
            List[Dict] with statistics for each grade
        """
        # Base queryset with filtering by user
        # Use select_related for query optimization
        queryset = FuelEntry.objects.filter(user_id=user_id).select_related('vehicle')

        # Filter by vehicle (if specified)
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        # One query to get all grade data
        # Use values() for grouping and aggregation
        grade_stats = queryset.exclude(
            Q(fuel_grade__isnull=True) | Q(fuel_grade='')
        ).values('fuel_grade').annotate(
            total_liters=Sum('liters'),
            total_cost=Sum('total_amount'),
            total_distance=Sum('distance_since_last'),
            fill_count=Count('id')
        ).order_by('-fill_count')

        # Form result with correct average calculation
        result = []
        for stat in grade_stats:
            total_liters = stat['total_liters'] or 0
            total_cost = stat['total_cost'] or 0
            total_distance = stat['total_distance'] or 0

            avg_consumption = (total_liters / total_distance * 100) if total_distance > 0 else None
            avg_unit_price = (total_cost / total_liters) if total_liters > 0 else None
            avg_cost_per_km = (total_cost / total_distance) if total_distance > 0 else None

            result.append({
                'grade': stat['fuel_grade'],
                'average_consumption': round(float(avg_consumption), 1) if avg_consumption else None,
                'average_unit_price': round(float(avg_unit_price), 2) if avg_unit_price else None,
                'average_cost_per_km': round(float(avg_cost_per_km), 4) if avg_cost_per_km else None,
                'fill_count': stat['fill_count']
            })

        return result
