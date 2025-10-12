"""
Unit-тесты для сервисов бизнес-логики
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal
from .models import Vehicle, FuelEntry
from .services import FuelEntryMetricsService, StatisticsService

User = get_user_model()


class FuelEntryMetricsServiceTestCase(TestCase):
    """
    Unit-тесты для FuelEntryMetricsService
    """
    
    def setUp(self):
        """Создаём тестовые данные"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        
        self.vehicle = Vehicle.objects.create(
            user=self.user,
            name='Test Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
    
    def test_calculate_metrics_baseline_entry(self):
        """Тест вычисления метрик для baseline записи (первой)"""
        entry = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today(),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('2750.00')
        )
        
        FuelEntryMetricsService.calculate_metrics(entry)
        
        # unit_price должен быть вычислен
        self.assertIsNotNone(entry.unit_price)
        self.assertEqual(entry.unit_price, Decimal('55.00'))  # 2750 / 50
        
        # Остальные метрики должны быть None для baseline
        self.assertIsNone(entry.distance_since_last)
        self.assertIsNone(entry.consumption_l_100km)
        self.assertIsNone(entry.cost_per_km)
    
    def test_calculate_metrics_second_entry(self):
        """Тест вычисления метрик для второй записи"""
        # Создаём baseline
        baseline = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today() - timedelta(days=7),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('2750.00')
        )
        FuelEntryMetricsService.calculate_metrics(baseline)
        baseline.save()
        
        # Создаём вторую запись
        entry = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today(),
            odometer=10500,  # +500 км
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('42.00'),
            total_amount=Decimal('2310.00')
        )
        
        FuelEntryMetricsService.calculate_metrics(entry)
        
        # unit_price
        self.assertEqual(entry.unit_price, Decimal('55.00'))  # 2310 / 42
        
        # distance_since_last
        self.assertEqual(entry.distance_since_last, 500)
        
        # consumption_l_100km = (42 / 500) * 100 = 8.4
        self.assertIsNotNone(entry.consumption_l_100km)
        self.assertAlmostEqual(float(entry.consumption_l_100km), 8.4, places=1)
        
        # cost_per_km = 2310 / 500 = 4.62
        self.assertIsNotNone(entry.cost_per_km)
        self.assertAlmostEqual(float(entry.cost_per_km), 4.62, places=2)
    
    def test_calculate_metrics_zero_distance(self):
        """Тест вычисления метрик когда distance = 0 (одинаковый одометр)"""
        baseline = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today() - timedelta(days=1),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('2750.00')
        )
        FuelEntryMetricsService.calculate_metrics(baseline)
        baseline.save()
        
        # Вторая запись с тем же одометром (теоретический случай)
        entry = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today(),
            odometer=10000,  # Тот же одометр
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('42.00'),
            total_amount=Decimal('2310.00')
        )
        
        FuelEntryMetricsService.calculate_metrics(entry)
        
        # distance = 0
        self.assertEqual(entry.distance_since_last, 0)
        
        # consumption и cost_per_km должны быть None при distance = 0
        self.assertIsNone(entry.consumption_l_100km)
        self.assertIsNone(entry.cost_per_km)
    
    def test_recalculate_metrics_after_entry(self):
        """Тест пересчёта метрик последующих записей"""
        # Создаём три записи
        entry1 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today() - timedelta(days=20),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('2750.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry1)
        entry1.save()
        
        entry2 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today() - timedelta(days=10),
            odometer=10500,
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('42.00'),
            total_amount=Decimal('2310.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry2)
        entry2.save()
        
        entry3 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today(),
            odometer=11000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('48.00'),
            total_amount=Decimal('2640.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry3)
        entry3.save()
        
        # Изменяем entry2 (одометр)
        entry2.odometer = 10600
        entry2.save()
        
        # Пересчитываем метрики последующих записей
        FuelEntryMetricsService.recalculate_metrics_after_entry(entry2)
        
        # Проверяем, что метрики entry3 пересчитались
        entry3.refresh_from_db()
        self.assertEqual(entry3.distance_since_last, 400)  # 11000 - 10600
    
    def test_insert_entry_with_earlier_date(self):
        """Тест вставки записи с более ранней датой"""
        # Создаём две записи
        entry1 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today() - timedelta(days=20),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('2750.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry1)
        entry1.save()
        
        entry2 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today() - timedelta(days=5),
            odometer=10800,
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('45.00'),
            total_amount=Decimal('2475.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry2)
        entry2.save()
        
        # Проверяем, что entry2 имеет метрики на основе entry1
        entry2.refresh_from_db()
        self.assertEqual(entry2.distance_since_last, 800)  # 10800 - 10000
        
        # Вставляем новую запись между entry1 и entry2
        entry_middle = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today() - timedelta(days=12),  # Между -20 и -5
            odometer=10400,
            station_name='Lukoil',
            fuel_brand='Lukoil',
            fuel_grade='95',
            liters=Decimal('40.00'),
            total_amount=Decimal('2200.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry_middle)
        entry_middle.save()
        
        # Пересчитываем метрики последующих записей
        FuelEntryMetricsService.recalculate_metrics_after_entry(entry_middle)
        
        # Проверяем, что entry_middle вычислил метрики на основе entry1
        entry_middle.refresh_from_db()
        self.assertEqual(entry_middle.distance_since_last, 400)  # 10400 - 10000
        
        # Проверяем, что entry2 ПЕРЕСЧИТАЛ метрики на основе entry_middle
        entry2.refresh_from_db()
        self.assertEqual(entry2.distance_since_last, 400)  # 10800 - 10400 (НЕ 800!)
    
    def test_recalculate_all_metrics_for_vehicle(self):
        """Тест полного пересчёта всех метрик для автомобиля"""
        # Создаём несколько записей
        entries_data = [
            (date.today() - timedelta(days=30), 10000, '50.00', '2750.00'),
            (date.today() - timedelta(days=20), 10500, '42.00', '2310.00'),
            (date.today() - timedelta(days=10), 11000, '48.00', '2640.00'),
            (date.today(), 11500, '45.00', '2475.00'),
        ]
        
        for entry_date, odometer, liters, amount in entries_data:
            FuelEntry.objects.create(
                vehicle=self.vehicle,
                user=self.user,
                entry_date=entry_date,
                odometer=odometer,
                station_name='Shell',
                fuel_brand='Shell',
                fuel_grade='95',
                liters=Decimal(liters),
                total_amount=Decimal(amount)
            )
        
        # Пересчитываем все метрики
        FuelEntryMetricsService.recalculate_all_metrics_for_vehicle(self.vehicle.id)
        
        # Проверяем, что метрики рассчитаны корректно
        entries = FuelEntry.objects.filter(vehicle=self.vehicle).order_by('entry_date', 'odometer')
        
        # Первая запись - baseline
        self.assertIsNone(entries[0].distance_since_last)
        
        # Остальные должны иметь вычисленные метрики
        for i in range(1, len(entries)):
            self.assertIsNotNone(entries[i].distance_since_last)
            self.assertGreater(entries[i].distance_since_last, 0)


class StatisticsServiceTestCase(TestCase):
    """
    Unit-тесты для StatisticsService
    """
    
    def setUp(self):
        """Создаём тестовые данные"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        
        self.vehicle = Vehicle.objects.create(
            user=self.user,
            name='Test Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
        
        # Создаём записи для разных периодов
        today = date.today()
        
        # Запись 1: 40 дней назад (вне 30d)
        self.entry1 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=40),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('2750.00')
        )
        
        # Запись 2: 20 дней назад (внутри 30d)
        self.entry2 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=20),
            odometer=10500,
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('42.00'),
            total_amount=Decimal('2310.00')
        )
        
        # Запись 3: 10 дней назад (внутри 30d)
        self.entry3 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=10),
            odometer=11000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('48.00'),
            total_amount=Decimal('2640.00')
        )
        
        # Вычисляем метрики
        from .services import FuelEntryMetricsService
        for entry in [self.entry1, self.entry2, self.entry3]:
            FuelEntryMetricsService.calculate_metrics(entry)
            entry.save()
    
    def test_calculate_dashboard_statistics_30d(self):
        """Тест расчёта статистики за 30 дней"""
        result = StatisticsService.calculate_dashboard_statistics(
            user_id=self.user.id,
            vehicle_id=None,
            period_type='30d',
            date_after=None,
            date_before=None
        )
        
        self.assertIn('period', result)
        self.assertIn('aggregates', result)
        self.assertIn('time_series', result)
        
        # Проверяем период
        self.assertEqual(result['period']['type'], '30d')
        
        # Проверяем aggregates
        # Должно быть 2 записи в периоде 30d (entry2 и entry3)
        self.assertEqual(result['aggregates']['entry_count'], 2)
        
        # Проверяем total_fuel = 42 + 48 = 90
        self.assertEqual(float(result['aggregates']['total_fuel']), 90.0)
        
        # Проверяем total_cost = 2310 + 2640 = 4950
        self.assertEqual(float(result['aggregates']['total_cost']), 4950.0)
    
    def test_calculate_dashboard_statistics_vehicle_filter(self):
        """Тест статистики с фильтром по автомобилю"""
        # Создаём второй автомобиль
        vehicle2 = Vehicle.objects.create(
            user=self.user,
            name='Second Car',
            make='Honda',
            model='Accord',
            year=2021,
            fuel_type='Gasoline'
        )
        
        # Создаём запись для второго автомобиля
        FuelEntry.objects.create(
            vehicle=vehicle2,
            user=self.user,
            entry_date=date.today(),
            odometer=20000,
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('40.00'),
            total_amount=Decimal('2200.00')
        )
        
        # Получаем статистику только для первого автомобиля
        result = StatisticsService.calculate_dashboard_statistics(
            user_id=self.user.id,
            vehicle_id=self.vehicle.id,
            period_type='30d',
            date_after=None,
            date_before=None
        )
        
        # Должно быть только 2 записи (entry2 и entry3), без записи vehicle2
        self.assertEqual(result['aggregates']['entry_count'], 2)
    
    def test_calculate_dashboard_statistics_custom_period(self):
        """Тест статистики с кастомным периодом"""
        today = date.today()
        date_after = today - timedelta(days=15)
        date_before = today
        
        result = StatisticsService.calculate_dashboard_statistics(
            user_id=self.user.id,
            vehicle_id=None,
            period_type='custom',
            date_after=date_after,
            date_before=date_before
        )
        
        # Должна быть только 1 запись (entry3) в периоде
        self.assertEqual(result['aggregates']['entry_count'], 1)
        self.assertEqual(result['period']['type'], 'custom')
    
    def test_calculate_dashboard_statistics_empty_period(self):
        """Тест статистики для периода без данных"""
        today = date.today()
        date_after = today - timedelta(days=5)
        date_before = today - timedelta(days=1)
        
        result = StatisticsService.calculate_dashboard_statistics(
            user_id=self.user.id,
            vehicle_id=None,
            period_type='custom',
            date_after=date_after,
            date_before=date_before
        )
        
        # Должно быть 0 записей
        self.assertEqual(result['aggregates']['entry_count'], 0)
        # При отсутствии данных возвращается 0 (не None)
        self.assertEqual(result['aggregates']['total_cost'], 0)
        self.assertEqual(result['aggregates']['total_fuel'], 0)

