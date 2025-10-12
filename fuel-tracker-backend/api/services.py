"""
Сервисный слой для бизнес-логики приложения.
Инкапсулирует логику вычисления метрик и каскадного пересчета.
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
    Сервис для вычисления метрик заправок.
    
    Бизнес-правила:
    1. Первая запись для автомобиля - baseline (метрики = None)
    2. Последующие записи вычисляют метрики на основе предыдущей
    3. Метрики хранятся в метрической системе (км, литры)
    """
    
    @staticmethod
    def calculate_metrics(fuel_entry: FuelEntry) -> None:
        """
        Вычисляет метрики для записи о заправке.
        
        Args:
            fuel_entry: Запись о заправке (должна быть сохранена в БД)
        """
        # unit_price всегда вычисляется
        fuel_entry.unit_price = fuel_entry.total_amount / fuel_entry.liters
        
        # Получаем предыдущую запись для этого же автомобиля
        previous_entry = FuelEntry.objects.filter(
            vehicle=fuel_entry.vehicle,
            entry_date__lt=fuel_entry.entry_date
        ).order_by('-entry_date', '-created_at').first()
        
        # Если это первая запись - это baseline
        if not previous_entry:
            fuel_entry.distance_since_last = None
            fuel_entry.consumption_l_100km = None
            fuel_entry.cost_per_km = None
            return
        
        # Вычисляем расстояние
        distance = fuel_entry.odometer - previous_entry.odometer
        fuel_entry.distance_since_last = distance
        
        # Вычисляем расход (л/100км) если есть расстояние
        if distance > 0:
            # consumption = (liters / distance) * 100
            fuel_entry.consumption_l_100km = (fuel_entry.liters / Decimal(distance)) * Decimal(100)
            
            # cost_per_km = total_amount / distance
            fuel_entry.cost_per_km = fuel_entry.total_amount / Decimal(distance)
        else:
            fuel_entry.consumption_l_100km = None
            fuel_entry.cost_per_km = None
    
    @staticmethod
    def get_previous_entry(vehicle_id: int, before_date, before_id: Optional[int] = None) -> Optional[FuelEntry]:
        """
        Получить предыдущую запись для автомобиля.
        
        Args:
            vehicle_id: ID автомобиля
            before_date: Дата, до которой искать
            before_id: ID записи для исключения (при обновлении)
        
        Returns:
            Предыдущая запись или None
        """
        queryset = FuelEntry.objects.filter(
            vehicle_id=vehicle_id,
            entry_date__lt=before_date
        )
        
        if before_id:
            queryset = queryset.exclude(id=before_id)
        
        return queryset.order_by('-entry_date', '-created_at').first()
    
    @staticmethod
    def get_next_entry(vehicle_id: int, after_date, after_id: Optional[int] = None) -> Optional[FuelEntry]:
        """
        Получить следующую запись для автомобиля.
        
        Args:
            vehicle_id: ID автомобиля
            after_date: Дата, после которой искать
            after_id: ID записи для исключения (при обновлении)
        
        Returns:
            Следующая запись или None
        """
        queryset = FuelEntry.objects.filter(
            vehicle_id=vehicle_id,
            entry_date__gt=after_date
        )
        
        if after_id:
            queryset = queryset.exclude(id=after_id)
        
        return queryset.order_by('entry_date', 'created_at').first()
    
    @staticmethod
    @transaction.atomic
    def recalculate_metrics_after_entry(fuel_entry: FuelEntry) -> int:
        """
        Каскадный пересчет метрик для всех записей после указанной.
        
        Args:
            fuel_entry: Запись, после которой пересчитывать
        
        Returns:
            Количество пересчитанных записей
        """
        # Получаем все записи после текущей
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
        Полный пересчет метрик для всех записей автомобиля.
        Используется после удаления записи.
        
        Args:
            vehicle_id: ID автомобиля
        
        Returns:
            Количество пересчитанных записей
        """
        entries = FuelEntry.objects.filter(
            vehicle_id=vehicle_id
        ).order_by('entry_date', 'created_at')
        
        count = 0
        for entry in entries:
            FuelEntryMetricsService.calculate_metrics(entry)
            entry.save(update_fields=[
                'unit_price', 
                'distance_since_last', 
                'consumption_l_100km', 
                'cost_per_km'
            ])
            count += 1
        
        return count


class StatisticsService:
    """
    Сервис для вычисления статистики и агрегатов по заправкам.
    
    Поддерживает периоды:
    - 30d: последние 30 дней
    - 90d: последние 90 дней
    - ytd: с начала года
    - custom: произвольный период (date_after, date_before)
    """
    
    @staticmethod
    def get_period_dates(period_type: str, date_after: Optional[date] = None, date_before: Optional[date] = None) -> Dict[str, date]:
        """
        Вычисляет границы периода на основе типа.
        
        Args:
            period_type: Тип периода (30d, 90d, ytd, custom)
            date_after: Начало периода (для custom)
            date_before: Конец периода (для custom)
        
        Returns:
            Dict с date_after и date_before
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
        Вычисляет статистику для дашборда.
        
        Args:
            user_id: ID пользователя
            vehicle_id: ID автомобиля (опционально, если None - по всем)
            period_type: Тип периода (30d, 90d, ytd, custom)
            date_after: Начало периода (для custom)
            date_before: Конец периода (для custom)
        
        Returns:
            Dict со статистикой: period, aggregates, time_series
        """
        # Определяем границы периода
        period_dates = StatisticsService.get_period_dates(period_type, date_after, date_before)
        
        # Базовый queryset с фильтрацией по пользователю и периоду
        queryset = FuelEntry.objects.filter(
            user_id=user_id,
            entry_date__gte=period_dates['date_after'],
            entry_date__lte=period_dates['date_before']
        )
        
        # Фильтрация по автомобилю (если указан)
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        
        # Агрегаты (только для записей с вычисленными метриками)
        # Исключаем baseline записи (где distance_since_last = None)
        entries_with_metrics = queryset.exclude(
            Q(distance_since_last__isnull=True) | Q(consumption_l_100km__isnull=True)
        )
        
        aggregates = entries_with_metrics.aggregate(
            average_consumption=Avg('consumption_l_100km'),
            average_unit_price=Avg('unit_price'),
            average_cost_per_km=Avg('cost_per_km'),
            total_distance=Sum('distance_since_last'),
            total_fuel=Sum('liters'),
            total_cost=Sum('total_amount'),
            entry_count=Count('id'),
            min_consumption=Min('consumption_l_100km'),
            max_consumption=Max('consumption_l_100km'),
        )
        
        # Временные ряды (consumption и unit_price по дням)
        # Используем все записи (включая baseline для unit_price)
        # Оптимизируем: получаем только нужные поля и фильтруем на уровне БД
        time_series_data = queryset.values('entry_date', 'consumption_l_100km', 'unit_price', 'cost_per_km').order_by('entry_date')
        
        # Формируем временные ряды более эффективно
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
        
        # Вычисляем average_distance_per_day
        total_distance = aggregates['total_distance'] if aggregates['total_distance'] else 0
        period_days = (period_dates['date_before'] - period_dates['date_after']).days + 1  # +1 чтобы включить оба дня
        average_distance_per_day = (total_distance / period_days) if period_days > 0 and total_distance > 0 else None
        
        # Форматируем результат
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
                'total_distance': int(aggregates['total_distance']) if aggregates['total_distance'] else 0,
                'total_liters': round(float(aggregates['total_fuel']), 2) if aggregates['total_fuel'] else 0,
                'total_spent': round(float(aggregates['total_cost']), 2) if aggregates['total_cost'] else 0,
                'fill_up_count': aggregates['entry_count'],
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
        Вычисляет статистику по брендам топлива (all-time).

        Args:
            user_id: ID пользователя
            vehicle_id: ID автомобиля (опционально)

        Returns:
            List[Dict] со статистикой по каждому бренду
        """
        # Базовый queryset с фильтрацией по пользователю
        # Используем select_related для оптимизации запросов
        queryset = FuelEntry.objects.filter(user_id=user_id).select_related('vehicle')

        # Фильтрация по автомобилю (если указан)
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        # Один запрос для получения всех данных по брендам
        # Используем values() для группировки и агрегации
        brand_stats = queryset.exclude(
            Q(fuel_brand__isnull=True) | Q(fuel_brand='') | Q(consumption_l_100km__isnull=True)
        ).values('fuel_brand').annotate(
            avg_consumption=Avg('consumption_l_100km'),
            avg_unit_price=Avg('unit_price'),
            avg_cost_per_km=Avg('cost_per_km'),
            fill_count=Count('id')
        ).order_by('-fill_count')

        # Формируем результат
        result = []
        for stat in brand_stats:
            result.append({
                'brand': stat['fuel_brand'],
                'average_consumption': round(float(stat['avg_consumption']), 1) if stat['avg_consumption'] else None,
                'average_unit_price': round(float(stat['avg_unit_price']), 2) if stat['avg_unit_price'] else None,
                'average_cost_per_km': round(float(stat['avg_cost_per_km']), 4) if stat['avg_cost_per_km'] else None,
                'fill_count': stat['fill_count']
            })

        return result

    @staticmethod
    def calculate_grade_statistics(
        user_id: int,
        vehicle_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Вычисляет статистику по маркам топлива (all-time).

        Args:
            user_id: ID пользователя
            vehicle_id: ID автомобиля (опционально)

        Returns:
            List[Dict] со статистикой по каждой марке
        """
        # Базовый queryset с фильтрацией по пользователю
        # Используем select_related для оптимизации запросов
        queryset = FuelEntry.objects.filter(user_id=user_id).select_related('vehicle')

        # Фильтрация по автомобилю (если указан)
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        # Один запрос для получения всех данных по маркам
        # Используем values() для группировки и агрегации
        grade_stats = queryset.exclude(
            Q(fuel_grade__isnull=True) | Q(fuel_grade='') | Q(consumption_l_100km__isnull=True)
        ).values('fuel_grade').annotate(
            avg_consumption=Avg('consumption_l_100km'),
            avg_unit_price=Avg('unit_price'),
            avg_cost_per_km=Avg('cost_per_km'),
            fill_count=Count('id')
        ).order_by('-fill_count')

        # Формируем результат
        result = []
        for stat in grade_stats:
            result.append({
                'grade': stat['fuel_grade'],
                'average_consumption': round(float(stat['avg_consumption']), 1) if stat['avg_consumption'] else None,
                'average_unit_price': round(float(stat['avg_unit_price']), 2) if stat['avg_unit_price'] else None,
                'average_cost_per_km': round(float(stat['avg_cost_per_km']), 4) if stat['avg_cost_per_km'] else None,
                'fill_count': stat['fill_count']
            })

        return result

