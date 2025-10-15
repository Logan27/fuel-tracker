from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, timedelta
from decimal import Decimal
from .models import Vehicle, FuelEntry

User = get_user_model()


class StatisticsAPITestCase(APITestCase):
    """
    Tests for dashboard statistics endpoint
    """
    
    def setUp(self):
        """Create test data"""
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create vehicle
        self.vehicle = Vehicle.objects.create(
            user=self.user,
            name='Test Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
        
        # Create several fuel entries
        today = date.today()
        
        # Entry 1 (baseline, 40 days ago)
        self.entry1 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=40),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('75.00')
        )
        
        # Entry 2 (20 days ago, within 30d period)
        self.entry2 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=20),
            odometer=10500,
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('45.00'),
            total_amount=Decimal('70.00')
        )
        
        # Entry 3 (10 days ago, within 30d period)
        self.entry3 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=10),
            odometer=11000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('48.00'),
            total_amount=Decimal('73.00')
        )
        
        # Calculate metrics for all entries
        from .services import FuelEntryMetricsService
        for entry in [self.entry1, self.entry2, self.entry3]:
            FuelEntryMetricsService.calculate_metrics(entry)
            entry.save()
    
    def test_dashboard_statistics_30d(self):
        """Test statistics for 30 days"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/v1/statistics/dashboard', {'period': '30d'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('period', response.data)
        self.assertIn('aggregates', response.data)
        self.assertIn('time_series', response.data)
        
        # Check period
        self.assertEqual(response.data['period']['type'], '30d')
        
        # Check Aggregates
        aggregates = response.data['aggregates']
        self.assertIn('average_consumption', aggregates)
        self.assertIn('total_distance', aggregates)
        self.assertEqual(aggregates['entry_count'], 2)  # 2 entries in 30d period
    
    def test_dashboard_statistics_unauthenticated(self):
        """Test access without authentication"""
        response = self.client.get('/api/v1/statistics/dashboard')
        # DRF may return 401 or 403 depending on settings
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_dashboard_statistics_invalid_period(self):
        """Test with invalid period"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/v1/statistics/dashboard', {'period': 'invalid'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_dashboard_statistics_vehicle_filter(self):
        """Test filtering by vehicle"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/v1/statistics/dashboard', {
            'period': '30d',
            'vehicle': self.vehicle.id
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['aggregates']['entry_count'], 2)
    
    def test_dashboard_statistics_custom_period(self):
        """Test with custom period"""
        self.client.force_authenticate(user=self.user)

        today = date.today()
        date_after = (today - timedelta(days=15)).strftime('%Y-%m-%d')
        date_before = today.strftime('%Y-%m-%d')

        response = self.client.get('/api/v1/statistics/dashboard', {
            'period': 'custom',
            'date_after': date_after,
            'date_before': date_before
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['period']['type'], 'custom')
        self.assertEqual(response.data['aggregates']['entry_count'], 1)  # only entry3

    def test_dashboard_statistics_metrics_calculation(self):
        """Test correct calculation of all metrics including initial_odometer"""
        self.client.force_authenticate(user=self.user)

        # Update vehicle initial_odometer
        self.vehicle.initial_odometer = 10000
        self.vehicle.save()

        # Get statistics for 30d period (entry2 and entry3)
        response = self.client.get('/api/v1/statistics/dashboard', {'period': '30d'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        aggregates = response.data['aggregates']

        # Total distance = max_odometer - initial_odometer
        # max_odometer = 11000 (entry3), initial_odometer = 10000
        # total_distance = 11000 - 10000 = 1000 km
        self.assertEqual(aggregates['total_distance'], 1000)

        # Total fuel in period = entry2 (45L) + entry3 (48L) = 93L
        self.assertEqual(float(aggregates['total_liters']), 93.0)

        # Average consumption = total_fuel / total_distance * 100
        # = 93 / 1000 * 100 = 9.3 L/100km
        self.assertAlmostEqual(float(aggregates['average_consumption']), 9.3, places=1)

        # Total cost = entry2 (70) + entry3 (73) = 143
        self.assertEqual(float(aggregates['total_spent']), 143.0)

        # Average cost per km = total_cost / total_distance
        # = 143 / 1000 = 0.143
        self.assertAlmostEqual(float(aggregates['average_cost_per_km']), 0.143, places=3)

        # Average distance per day = total_distance / actual_period_days
        # actual_period = from entry2 (20 days ago) to entry3 (10 days ago) = 10 days + 1 = 11 days
        # = 1000 / 11 = 90.9 km/day
        self.assertAlmostEqual(float(aggregates['average_distance_per_day']), 90.9, places=1)

        # Entry count in 30d period
        self.assertEqual(aggregates['entry_count'], 2)


class MetricsCalculationTestCase(TestCase):
    """
    Tests for metrics calculation correctness
    """

    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123'
        )

        self.vehicle = Vehicle.objects.create(
            user=self.user,
            name='Test Vehicle',
            make='Honda',
            model='Civic',
            year=2021,
            fuel_type='Gasoline',
            initial_odometer=100  # Starting at 100 km
        )

    def test_average_consumption_includes_baseline_fuel(self):
        """
        Test that average consumption calculation includes fuel from baseline entry.
        Regression test for bug where only fuel from entries with metrics was counted.
        """
        from .services import FuelEntryMetricsService, StatisticsService

        today = date.today()

        # Baseline entry (no metrics)
        entry1 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=3),
            odometer=150,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('20.00'),
            total_amount=Decimal('30.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry1)
        entry1.save()

        # Second entry (has metrics)
        entry2 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=2),
            odometer=250,
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('30.00'),
            total_amount=Decimal('45.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry2)
        entry2.save()

        # Third entry (has metrics)
        entry3 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=1),
            odometer=400,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('25.00'),
            total_amount=Decimal('37.50')
        )
        FuelEntryMetricsService.calculate_metrics(entry3)
        entry3.save()

        # Get statistics
        stats = StatisticsService.calculate_dashboard_statistics(
            user_id=self.user.id,
            period_type='30d'
        )

        aggregates = stats['aggregates']

        # Total distance = max_odometer - initial_odometer
        # = 400 - 100 = 300 km
        self.assertEqual(aggregates['total_distance'], 300)

        # Total fuel = ALL entries including baseline
        # = 20 + 30 + 25 = 75 L
        self.assertEqual(float(aggregates['total_liters']), 75.0)

        # Average consumption = total_fuel / total_distance * 100
        # = 75 / 300 * 100 = 25.0 L/100km
        # NOT 55 / 300 * 100 = 18.3 (if we incorrectly exclude baseline fuel)
        self.assertAlmostEqual(float(aggregates['average_consumption']), 25.0, places=1)

    def test_total_distance_uses_initial_odometer(self):
        """
        Test that total_distance is calculated as max_odometer - initial_odometer,
        not as sum of distance_since_last (which would exclude baseline).
        """
        from .services import FuelEntryMetricsService, StatisticsService

        today = date.today()

        # Single entry
        entry = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today,
            odometer=500,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('40.00'),
            total_amount=Decimal('60.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry)
        entry.save()

        # Get statistics
        stats = StatisticsService.calculate_dashboard_statistics(
            user_id=self.user.id,
            period_type='30d',
            vehicle_id=self.vehicle.id
        )

        aggregates = stats['aggregates']

        # Total distance should be from initial_odometer to current odometer
        # = 500 - 100 = 400 km
        # NOT 0 (if we incorrectly sum distance_since_last, which is None for baseline)
        self.assertEqual(aggregates['total_distance'], 400)

        # Average consumption = 40 / 400 * 100 = 10.0 L/100km
        self.assertAlmostEqual(float(aggregates['average_consumption']), 10.0, places=1)

    def test_average_distance_per_day_uses_actual_period(self):
        """
        Test that average_distance_per_day uses the smaller of:
        - requested period (e.g., 30 days)
        - actual period (days between first and last entry)
        """
        from .services import FuelEntryMetricsService, StatisticsService

        today = date.today()

        # Entry 1 (5 days ago)
        entry1 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=5),
            odometer=200,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('30.00'),
            total_amount=Decimal('45.00')
        )
        FuelEntryMetricsService.calculate_metrics(entry1)
        entry1.save()

        # Entry 2 (2 days ago)
        entry2 = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=today - timedelta(days=2),
            odometer=500,
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('35.00'),
            total_amount=Decimal('52.50')
        )
        FuelEntryMetricsService.calculate_metrics(entry2)
        entry2.save()

        # Get statistics for 30d period
        stats = StatisticsService.calculate_dashboard_statistics(
            user_id=self.user.id,
            period_type='30d',
            vehicle_id=self.vehicle.id
        )

        aggregates = stats['aggregates']

        # Total distance = 500 - 100 = 400 km
        self.assertEqual(aggregates['total_distance'], 400)

        # Actual period = from entry1 to entry2 = 5 - 2 = 3 days + 1 = 4 days
        # (not 30 days, because we only have data for 4 days)
        # Average distance per day = 400 / 4 = 100 km/day
        # NOT 400 / 30 = 13.3 km/day
        self.assertAlmostEqual(float(aggregates['average_distance_per_day']), 100.0, places=1)
