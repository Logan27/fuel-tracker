"""
Tests for CRUD operations with fuel entries
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, timedelta
from decimal import Decimal
from .models import Vehicle, FuelEntry

User = get_user_model()


class FuelEntryCRUDTestCase(APITestCase):
    """
    Tests for CRUD operations with fuel entries (FUEL-001 to FUEL-007)
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
        
        self.client.force_authenticate(user=self.user)
    
    def test_create_baseline_entry(self):
        """FUEL-001: Creating first (baseline) fuel entry"""
        data = {
            'vehicle': self.vehicle.id,
            'entry_date': date.today().strftime('%Y-%m-%d'),
            'odometer': 10000,
            'station_name': 'Shell',
            'fuel_brand': 'Shell',
            'fuel_grade': '95',
            'liters': '50.00',
            'total_amount': '2750.00',
            'notes': 'First fill-up'
        }
        
        response = self.client.post('/api/v1/fuel-entries', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['odometer'], 10000)
        
        # Calculated fields should be null for baseline
        self.assertIsNone(response.data['distance_since_last'])
        self.assertIsNone(response.data['consumption_l_100km'])
        
        # unit_price should be calculated
        self.assertIsNotNone(response.data['unit_price'])
        self.assertEqual(float(response.data['unit_price']), 55.0)  # 2750/50
    
    def test_create_second_entry_with_metrics(self):
        """FUEL-002: Creating second fuel entry with calculated metrics"""
        # Create baseline entry
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
        
        # Create second entry
        data = {
            'vehicle': self.vehicle.id,
            'entry_date': date.today().strftime('%Y-%m-%d'),
            'odometer': 10500,  # +500 km
            'station_name': 'BP',
            'fuel_brand': 'BP',
            'fuel_grade': '95',
            'liters': '42.00',
            'total_amount': '2310.00'
        }
        
        response = self.client.post('/api/v1/fuel-entries', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check calculated metrics
        self.assertEqual(response.data['distance_since_last'], 500)
        self.assertIsNotNone(response.data['consumption_l_100km'])
        self.assertIsNotNone(response.data['cost_per_km'])
        
        # Check consumption: 42L / 500km * 100 = 8.4 L/100km
        consumption = float(response.data['consumption_l_100km'])
        self.assertAlmostEqual(consumption, 8.4, places=1)
    
    def test_create_entry_with_lower_odometer(self):
        """FUEL-003: Creating entry with odometer less than previous (should be rejected)"""
        # Create first entry with odometer=10000
        FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today() - timedelta(days=7),
            odometer=10200,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('2750.00')
        )
        
        # Try to create entry with smaller odometer
        data = {
            'vehicle': self.vehicle.id,
            'entry_date': date.today().strftime('%Y-%m-%d'),
            'odometer': 10100,  # Less than 10200!
            'station_name': 'BP',
            'fuel_brand': 'BP',
            'fuel_grade': '95',
            'liters': '42.00',
            'total_amount': '2310.00'
        }
        
        response = self.client.post('/api/v1/fuel-entries', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('odometer', str(response.data).lower())
    
    def test_create_entry_with_future_date(self):
        """FUEL-004: Creating entry with future date (should be rejected)"""
        future_date = (date.today() + timedelta(days=10)).strftime('%Y-%m-%d')
        
        data = {
            'vehicle': self.vehicle.id,
            'entry_date': future_date,
            'odometer': 10000,
            'station_name': 'Shell',
            'fuel_brand': 'Shell',
            'fuel_grade': '95',
            'liters': '50.00',
            'total_amount': '2750.00'
        }
        
        response = self.client.post('/api/v1/fuel-entries', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date', str(response.data).lower())
    
    def test_update_fuel_entry(self):
        """FUEL-005: Editing fuel entry"""
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
        
        # Update second entry (change liters amount)
        data = {
            'liters': '45.00',
            'total_amount': '2475.00'
        }
        
        response = self.client.patch(f'/api/v1/fuel-entries/{entry2.id}', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['liters']), 45.0)
        
        # Check that metrics were recalculated
        entry2.refresh_from_db()
        entry3.refresh_from_db()
        
        # Entry3 metrics should be recalculated based on updated entry2
        self.assertIsNotNone(entry3.distance_since_last)
        self.assertIsNotNone(entry3.consumption_l_100km)
    
    def test_delete_fuel_entry(self):
        """FUEL-006: Deleting fuel entry with metrics recalculation"""
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
        
        entry2_id = entry2.id
        
        # Delete second entry
        response = self.client.delete(f'/api/v1/fuel-entries/{entry2_id}')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that entry is deleted
        entry_exists = FuelEntry.objects.filter(id=entry2_id).exists()
        self.assertFalse(entry_exists)
        
        # Check that entry3 metrics were recalculated
        # Now entry3 should reference entry1
        entry3.refresh_from_db()
        self.assertEqual(entry3.distance_since_last, 1000)  # 11000 - 10000
    
    def test_list_fuel_entries_with_pagination(self):
        """FUEL-007: Getting entries list with pagination"""
        # Create 30 entries
        for i in range(30):
            FuelEntry.objects.create(
                vehicle=self.vehicle,
                user=self.user,
                entry_date=date.today() - timedelta(days=i),
                odometer=10000 + (i * 100),
                station_name='Shell',
                fuel_brand='Shell',
                fuel_grade='95',
                liters=Decimal('50.00'),
                total_amount=Decimal('2750.00')
            )
        
        response = self.client.get('/api/v1/fuel-entries')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('next', response.data)
        
        # By default should return 25 entries
        self.assertEqual(len(response.data['results']), 25)
    
    def test_list_fuel_entries_with_filters(self):
        """Getting list with filters by vehicle and date"""
        # Create second vehicle
        vehicle2 = Vehicle.objects.create(
            user=self.user,
            name='Second Car',
            make='Honda',
            model='Accord',
            year=2021,
            fuel_type='Gasoline'
        )
        
        # Create entries for both vehicles
        FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today() - timedelta(days=5),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('2750.00')
        )
        
        FuelEntry.objects.create(
            vehicle=vehicle2,
            user=self.user,
            entry_date=date.today(),
            odometer=20000,
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('45.00'),
            total_amount=Decimal('2475.00')
        )
        
        # Filter by vehicle
        response = self.client.get(f'/api/v1/fuel-entries?vehicle={self.vehicle.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Filter by date
        date_after = (date.today() - timedelta(days=3)).strftime('%Y-%m-%d')
        response = self.client.get(f'/api/v1/fuel-entries?date_after={date_after}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class FuelEntryIsolationTestCase(APITestCase):
    """
    Data isolation tests for fuel entries (SEC-002)
    """
    
    def setUp(self):
        """Create two users with data"""
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='TestPass123'
        )
        
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='TestPass123'
        )
        
        # Vehicle and entry for user1
        self.vehicle1 = Vehicle.objects.create(
            user=self.user1,
            name='User1 Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
        
        self.entry1 = FuelEntry.objects.create(
            vehicle=self.vehicle1,
            user=self.user1,
            entry_date=date.today(),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('2750.00')
        )
        
        # Vehicle and entry for user2
        self.vehicle2 = Vehicle.objects.create(
            user=self.user2,
            name='User2 Car',
            make='Honda',
            model='Accord',
            year=2021,
            fuel_type='Gasoline'
        )
        
        self.entry2 = FuelEntry.objects.create(
            vehicle=self.vehicle2,
            user=self.user2,
            entry_date=date.today(),
            odometer=20000,
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('45.00'),
            total_amount=Decimal('2475.00')
        )
    
    def test_cannot_retrieve_other_user_entry(self):
        """Attempt to get another user's entry"""
        self.client.force_authenticate(user=self.user1)
        
        # user1 tries to get user2's entry
        response = self.client.get(f'/api/v1/fuel-entries/{self.entry2.id}')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_cannot_update_other_user_entry(self):
        """SEC-002: Attempt to update another user's Fuel entry"""
        self.client.force_authenticate(user=self.user1)
        
        data = {'liters': '100.00'}
        
        # user1 tries to update user2's entry
        response = self.client.patch(f'/api/v1/fuel-entries/{self.entry2.id}', data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Check that data did not change
        self.entry2.refresh_from_db()
        self.assertEqual(self.entry2.liters, Decimal('45.00'))
    
    def test_cannot_delete_other_user_entry(self):
        """Attempt to delete another user's entry"""
        self.client.force_authenticate(user=self.user1)
        
        # user1 tries to delete user2's entry
        response = self.client.delete(f'/api/v1/fuel-entries/{self.entry2.id}')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Check that entry is NOT deleted
        entry_exists = FuelEntry.objects.filter(id=self.entry2.id).exists()
        self.assertTrue(entry_exists)
    
    def test_list_only_own_entries(self):
        """List contains only own entries"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/api/v1/fuel-entries')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.entry1.id)
    
    def test_unauthenticated_access(self):
        """SEC-004: Access to endpoints without authorization"""
        response = self.client.get('/api/v1/fuel-entries')
        
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

