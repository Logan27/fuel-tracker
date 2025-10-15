"""
Unit tests for business logic services
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
    Unit tests for FuelEntryMetricsService
    """
    
    def setUp(self):
        """Create test data"""
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
        """Test metrics calculation for baseline entry (first)"""
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
        
        # unit_price should be calculated
        self.assertIsNotNone(entry.unit_price)
        self.assertEqual(entry.unit_price, Decimal('55.00'))  # 2750 / 50
        
        # Other metrics should be None for baseline
        self.assertIsNone(entry.distance_since_last)
        self.assertIsNone(entry.consumption_l_100km)
        self.assertIsNone(entry.cost_per_km)
    
    def test_calculate_metrics_second_entry(self):
        """Test metrics calculation for second entry"""
        # Create baseline
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
        
        # Create second entry
        entry = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today(),
            odometer=10500,  # +500 km
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
        """Test metrics calculation when distance = 0 (same odometer)"""
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
        
        # Second entry with same odometer (theoretical case)
        entry = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today(),
            odometer=10000,  # Same odometer
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('42.00'),
            total_amount=Decimal('2310.00')
        )
        
        FuelEntryMetricsService.calculate_metrics(entry)
        
        # distance = 0
        self.assertEqual(entry.distance_since_last, 0)
        
        # consumption and cost_per_km should be None when distance = 0
        self.assertIsNone(entry.consumption_l_100km)
        self.assertIsNone(entry.cost_per_km)
    
    def test_recalculate_metrics_after_entry(self):
        """Test recalculation of subsequent entries metrics"""
        # Create three entries
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
        
        # Change entry2 (odometer)
        entry2.odometer = 10600
        entry2.save()
        
        # Recalculate metrics for subsequent entries
        FuelEntryMetricsService.recalculate_metrics_after_entry(entry2)
        
        # Check that entry3 metrics were recalculated
        entry3.refresh_from_db()
        self.assertEqual(entry3.distance_since_last, 400)  # 11000 - 10600
    
    def test_insert_entry_with_earlier_date(self):
        """Test inserting entry with earlier date"""
        # Create two entries
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
        
        # Check that entry2 has metrics based on entry1
        entry2.refresh_from_db()
        self.assertEqual(entry2.distance_since_last, 800)  # 10800 - 10000
        
        # Insert new entry between entry1 and entry2
        entry_middle = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today() - timedelta(days=12),  # Between -20 and -5
            odometer=10400,
            station_name='Lukoil',
            fuel_brand='Lukoil',
            fuel_grade='95',
            liters=Decimal('40.00'),
            total_amount=Decimal('2200.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry_middle)
        entry_middle.save()
        
        # Recalculate metrics for subsequent entries
        FuelEntryMetricsService.recalculate_metrics_after_entry(entry_middle)
        
        # Check that entry_middle calculated metrics based on entry1
        entry_middle.refresh_from_db()
        self.assertEqual(entry_middle.distance_since_last, 400)  # 10400 - 10000
        
        # Check that entry2 RECALCULATED metrics based on entry_middle
        entry2.refresh_from_db()
        self.assertEqual(entry2.distance_since_last, 400)  # 10800 - 10400 (NOT 800!)
    
    def test_recalculate_all_metrics_for_vehicle(self):
        """Test full recalculation of all metrics for vehicle"""
        # Create several entries
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
        
        # Recalculate all metrics
        FuelEntryMetricsService.recalculate_all_metrics_for_vehicle(self.vehicle.id)
        
        # Check that metrics are calculated correctly
        entries = FuelEntry.objects.filter(vehicle=self.vehicle).order_by('entry_date', 'odometer')
        
        # First entry is baseline
        self.assertIsNone(entries[0].distance_since_last)
        
        # Others should have calculated metrics
        for i in range(1, len(entries)):
            self.assertIsNotNone(entries[i].distance_since_last)
            self.assertGreater(entries[i].distance_since_last, 0)


class StatisticsServiceTestCase(TestCase):
    """
    Unit tests for StatisticsService
    """
    
    def setUp(self):
        """Create test data"""
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
        
        # Create entries for different periods
        today = date.today()
        
        # Entry 1: 40 days ago (outside 30d)
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
        
        # Entry 2: 20 days ago (inside 30d)
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
        
        # Entry 3: 10 days ago (inside 30d)
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
        
        # Calculate metrics
        from .services import FuelEntryMetricsService
        for entry in [self.entry1, self.entry2, self.entry3]:
            FuelEntryMetricsService.calculate_metrics(entry)
            entry.save()
    
    def test_calculate_dashboard_statistics_30d(self):
        """Test statistics calculation for 30 days"""
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
        
        # Check period
        self.assertEqual(result['period']['type'], '30d')
        
        # Check aggregates
        # Should be 2 entries in 30d period (entry2 and entry3)
        self.assertEqual(result['aggregates']['entry_count'], 2)
        
        # Check total_fuel = 42 + 48 = 90
        self.assertEqual(float(result['aggregates']['total_fuel']), 90.0)
        
        # Check total_cost = 2310 + 2640 = 4950
        self.assertEqual(float(result['aggregates']['total_cost']), 4950.0)
    
    def test_calculate_dashboard_statistics_vehicle_filter(self):
        """Test statistics with vehicle filter"""
        # Create second vehicle
        vehicle2 = Vehicle.objects.create(
            user=self.user,
            name='Second Car',
            make='Honda',
            model='Accord',
            year=2021,
            fuel_type='Gasoline'
        )
        
        # Create entry for second vehicle
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
        
        # Get statistics only for first vehicle
        result = StatisticsService.calculate_dashboard_statistics(
            user_id=self.user.id,
            vehicle_id=self.vehicle.id,
            period_type='30d',
            date_after=None,
            date_before=None
        )
        
        # Should be only 2 entries (entry2 and entry3), without vehicle2 entry
        self.assertEqual(result['aggregates']['entry_count'], 2)
    
    def test_calculate_dashboard_statistics_custom_period(self):
        """Test statistics with custom period"""
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
        
        # Should be only 1 entry (entry3) in period
        self.assertEqual(result['aggregates']['entry_count'], 1)
        self.assertEqual(result['period']['type'], 'custom')
    
    def test_calculate_dashboard_statistics_empty_period(self):
        """Test statistics for period without data"""
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
        
        # Should be 0 entries
        self.assertEqual(result['aggregates']['entry_count'], 0)
        # When no data, returns 0 (not None)
        self.assertEqual(result['aggregates']['total_cost'], 0)
        self.assertEqual(result['aggregates']['total_fuel'], 0)

