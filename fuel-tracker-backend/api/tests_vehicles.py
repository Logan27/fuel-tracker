"""
Tests for CRUD operations with vehicles
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Vehicle

User = get_user_model()


class VehicleCRUDTestCase(APITestCase):
    """
    Tests for CRUD operations with vehicles (VEH-001 to VEH-006)
    """
    
    def setUp(self):
        """Create test users"""
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
        
        # Create vehicle for user1
        self.vehicle1 = Vehicle.objects.create(
            user=self.user1,
            name='User1 Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
        
        # Create vehicle for user2
        self.vehicle2 = Vehicle.objects.create(
            user=self.user2,
            name='User2 Car',
            make='Honda',
            model='Accord',
            year=2021,
            fuel_type='Gasoline'
        )
    
    def test_create_vehicle_successful(self):
        """VEH-001: Create new vehicle"""
        self.client.force_authenticate(user=self.user1)
        
        data = {
            'name': 'My New Car',
            'make': 'BMW',
            'model': 'X5',
            'year': 2022,
            'fuel_type': 'Diesel'
        }
        
        response = self.client.post('/api/v1/vehicles', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['name'], 'My New Car')
        self.assertEqual(response.data['make'], 'BMW')
        self.assertEqual(response.data['model'], 'X5')
        self.assertEqual(response.data['year'], 2022)
        
        # Check that vehicle is created in DB
        vehicle_exists = Vehicle.objects.filter(
            user=self.user1,
            name='My New Car'
        ).exists()
        self.assertTrue(vehicle_exists)
    
    def test_create_vehicle_without_name(self):
        """VEH-002: Create vehicle without required name field"""
        self.client.force_authenticate(user=self.user1)
        
        data = {
            'make': 'BMW',
            'model': 'X5',
            'year': 2022
        }
        
        response = self.client.post('/api/v1/vehicles', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', str(response.data).lower())
    
    def test_list_vehicles(self):
        """VEH-003: Get user vehicles list"""
        self.client.force_authenticate(user=self.user1)
        
        # Create another vehicle for user1
        Vehicle.objects.create(
            user=self.user1,
            name='Second Car',
            make='Mazda',
            model='CX-5',
            year=2019,
            fuel_type='Gasoline'
        )
        
        response = self.client.get('/api/v1/vehicles')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # For pagination response.data is a dict {'count', 'next', 'previous', 'results'}
        # Check results count correctly
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2, f"Expected 2 vehicles, got {len(results)}")

        # Check that only user1 vehicles are returned
        vehicle_names = [v['name'] for v in results]
        self.assertIn('User1 Car', vehicle_names)
        self.assertIn('Second Car', vehicle_names)
        self.assertNotIn('User2 Car', vehicle_names)
    
    def test_retrieve_vehicle(self):
        """VEH-004: Get specific vehicle by ID"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(f'/api/v1/vehicles/{self.vehicle1.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.vehicle1.id)
        self.assertEqual(response.data['name'], 'User1 Car')
    
    def test_update_vehicle(self):
        """VEH-005: Update vehicle data"""
        self.client.force_authenticate(user=self.user1)
        
        data = {
            'name': 'Updated Car Name',
            'year': 2021
        }
        
        response = self.client.patch(f'/api/v1/vehicles/{self.vehicle1.id}', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Car Name')
        self.assertEqual(response.data['year'], 2021)
        
        # Check that data is updated in DB
        self.vehicle1.refresh_from_db()
        self.assertEqual(self.vehicle1.name, 'Updated Car Name')
        self.assertEqual(self.vehicle1.year, 2021)

    def test_update_initial_odometer_recalculates_metrics(self):
        """Test: updating initial_odometer recalculates FuelEntry metrics"""
        from .models import FuelEntry
        from decimal import Decimal
        from datetime import date, timedelta

        self.client.force_authenticate(user=self.user1)

        # Set initial odometer to 0
        self.vehicle1.initial_odometer = 0
        self.vehicle1.save()

        # Create two fuel entries
        entry1 = FuelEntry.objects.create(
            vehicle=self.vehicle1,
            user=self.user1,
            entry_date=date.today() - timedelta(days=10),
            odometer=500,
            station_name='Shell', fuel_brand='Shell', fuel_grade='95',
            liters=Decimal('40.00'), total_amount=Decimal('2000.00')
        )

        entry2 = FuelEntry.objects.create(
            vehicle=self.vehicle1,
            user=self.user1,
            entry_date=date.today() - timedelta(days=5),
            odometer=1000,
            station_name='BP', fuel_brand='BP', fuel_grade='95',
            liters=Decimal('45.00'), total_amount=Decimal('2250.00')
        )

        # Perform full recalculation as it would be during creation
        from .services import FuelEntryMetricsService
        FuelEntryMetricsService.recalculate_all_metrics_for_vehicle(self.vehicle1.id)

        # NEW LOGIC: First entry calculates metrics from initial_odometer
        # According to updated requirements: first entry should calculate from initial_odometer, not be baseline
        entry1.refresh_from_db()
        self.assertEqual(entry1.distance_since_last, 500)  # 500 - 0 (initial_odometer)

        # Second entry should have metrics relative to entry1
        entry2.refresh_from_db()
        self.assertEqual(entry2.distance_since_last, 500)  # 1000 - 500

        # Update initial_odometer via API
        data = {'initial_odometer': 100}
        response = self.client.patch(f'/api/v1/vehicles/{self.vehicle1.id}', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['initial_odometer'], 100)

        # Check that metrics were recalculated
        # entry1 is now calculated from new initial_odometer
        entry1.refresh_from_db()
        self.assertEqual(entry1.distance_since_last, 400)  # 500 - 100 (new initial_odometer)

        # entry2 is recalculated relative to entry1 (unchanged)
        entry2.refresh_from_db()
        self.assertEqual(entry2.distance_since_last, 500)  # 1000 - 500 (unchanged)
    
    def test_delete_vehicle(self):
        """VEH-006: Deleting vehicle"""
        self.client.force_authenticate(user=self.user1)
        
        vehicle_id = self.vehicle1.id
        
        response = self.client.delete(f'/api/v1/vehicles/{vehicle_id}')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that vehicle is deleted from DB
        vehicle_exists = Vehicle.objects.filter(id=vehicle_id).exists()
        self.assertFalse(vehicle_exists)
    
    def test_delete_vehicle_cascades_to_fuel_entries(self):
        """VEH-007: Deleting vehicle leads to cascade deletion of all related FuelEntry"""
        from .models import FuelEntry
        from decimal import Decimal
        from datetime import date, timedelta
        
        self.client.force_authenticate(user=self.user1)
        
        # Create several FuelEntry for vehicle1
        entry1 = FuelEntry.objects.create(
            vehicle=self.vehicle1,
            user=self.user1,
            entry_date=date.today() - timedelta(days=10),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('2750.00')
        )
        
        entry2 = FuelEntry.objects.create(
            vehicle=self.vehicle1,
            user=self.user1,
            entry_date=date.today() - timedelta(days=5),
            odometer=10500,
            station_name='BP',
            fuel_brand='BP',
            fuel_grade='95',
            liters=Decimal('45.00'),
            total_amount=Decimal('2475.00')
        )
        
        entry3 = FuelEntry.objects.create(
            vehicle=self.vehicle1,
            user=self.user1,
            entry_date=date.today(),
            odometer=11000,
            station_name='Esso',
            fuel_brand='Esso',
            fuel_grade='95',
            liters=Decimal('48.00'),
            total_amount=Decimal('2640.00')
        )
        
        vehicle_id = self.vehicle1.id
        entry_ids = [entry1.id, entry2.id, entry3.id]
        
        # Check that entries exist before deletion
        self.assertEqual(FuelEntry.objects.filter(vehicle_id=vehicle_id).count(), 3)
        
        # Delete vehicle
        response = self.client.delete(f'/api/v1/vehicles/{vehicle_id}')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that vehicle is deleted
        vehicle_exists = Vehicle.objects.filter(id=vehicle_id).exists()
        self.assertFalse(vehicle_exists)
        
        # Check that ALL related FuelEntry are also deleted (CASCADE)
        for entry_id in entry_ids:
            entry_exists = FuelEntry.objects.filter(id=entry_id).exists()
            self.assertFalse(entry_exists, f"FuelEntry {entry_id} should be deleted")
        
        # Check with general query
        remaining_entries = FuelEntry.objects.filter(vehicle_id=vehicle_id).count()
        self.assertEqual(remaining_entries, 0)
    
    def test_list_vehicles_unauthenticated(self):
        """Attempt to get vehicles list without authentication"""
        response = self.client.get('/api/v1/vehicles')
        
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class VehicleIsolationTestCase(APITestCase):
    """
    Data isolation tests between users for vehicles (SEC-001, SEC-003)
    """
    
    def setUp(self):
        """Create two users with vehicles"""
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
        
        # Vehicle for user1
        self.vehicle1 = Vehicle.objects.create(
            user=self.user1,
            name='User1 Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
        
        # Vehicle for user2
        self.vehicle2 = Vehicle.objects.create(
            user=self.user2,
            name='User2 Car',
            make='Honda',
            model='Accord',
            year=2021,
            fuel_type='Gasoline'
        )
    
    def test_cannot_retrieve_other_user_vehicle(self):
        """SEC-001: Attempt to get another user's vehicle"""
        self.client.force_authenticate(user=self.user1)
        
        # user1 tries to get user2's vehicle
        response = self.client.get(f'/api/v1/vehicles/{self.vehicle2.id}')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_cannot_update_other_user_vehicle(self):
        """Attempt to update another user's vehicle"""
        self.client.force_authenticate(user=self.user1)
        
        data = {'name': 'Hacked Name'}
        
        # user1 tries to update user2's vehicle
        response = self.client.patch(f'/api/v1/vehicles/{self.vehicle2.id}', data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Check that data did not change
        self.vehicle2.refresh_from_db()
        self.assertEqual(self.vehicle2.name, 'User2 Car')
    
    def test_cannot_delete_other_user_vehicle(self):
        """SEC-003: Attempt to delete another user's vehicle"""
        self.client.force_authenticate(user=self.user1)
        
        # user1 tries to delete user2's vehicle
        response = self.client.delete(f'/api/v1/vehicles/{self.vehicle2.id}')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Check that vehicle is NOT deleted
        vehicle_exists = Vehicle.objects.filter(id=self.vehicle2.id).exists()
        self.assertTrue(vehicle_exists)
    
    def test_list_only_own_vehicles(self):
        """List contains only own vehicles"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/api/v1/vehicles')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # With pagination response.data is a dict {'count', 'next', 'previous', 'results'}
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1, f"Expected 1 vehicle, got {len(results)}")
        self.assertEqual(results[0]['id'], self.vehicle1.id)
