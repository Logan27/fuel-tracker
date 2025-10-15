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
