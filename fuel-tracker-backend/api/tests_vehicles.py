"""
Тесты для CRUD операций с автомобилями
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Vehicle

User = get_user_model()


class VehicleCRUDTestCase(APITestCase):
    """
    Тесты для CRUD операций с автомобилями (VEH-001 до VEH-006)
    """
    
    def setUp(self):
        """Создаём тестовых пользователей"""
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
        
        # Создаём автомобиль для user1
        self.vehicle1 = Vehicle.objects.create(
            user=self.user1,
            name='User1 Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
        
        # Создаём автомобиль для user2
        self.vehicle2 = Vehicle.objects.create(
            user=self.user2,
            name='User2 Car',
            make='Honda',
            model='Accord',
            year=2021,
            fuel_type='Gasoline'
        )
    
    def test_create_vehicle_successful(self):
        """VEH-001: Создание нового транспортного средства"""
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
        
        # Проверяем, что автомобиль создан в БД
        vehicle_exists = Vehicle.objects.filter(
            user=self.user1,
            name='My New Car'
        ).exists()
        self.assertTrue(vehicle_exists)
    
    def test_create_vehicle_without_name(self):
        """VEH-002: Создание ТС без обязательного поля name"""
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
        """VEH-003: Получение списка ТС пользователя"""
        self.client.force_authenticate(user=self.user1)
        
        # Создаём ещё один автомобиль для user1
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
        # У user1 должно быть 2 автомобиля
        self.assertEqual(len(response.data), 2)
        
        # Проверяем, что возвращаются только автомобили user1
        vehicle_names = [v['name'] for v in response.data]
        self.assertIn('User1 Car', vehicle_names)
        self.assertIn('Second Car', vehicle_names)
        self.assertNotIn('User2 Car', vehicle_names)
    
    def test_retrieve_vehicle(self):
        """VEH-004: Получение конкретного ТС по ID"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(f'/api/v1/vehicles/{self.vehicle1.id}')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.vehicle1.id)
        self.assertEqual(response.data['name'], 'User1 Car')
    
    def test_update_vehicle(self):
        """VEH-005: Обновление данных ТС"""
        self.client.force_authenticate(user=self.user1)
        
        data = {
            'name': 'Updated Car Name',
            'year': 2021
        }
        
        response = self.client.patch(f'/api/v1/vehicles/{self.vehicle1.id}', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Car Name')
        self.assertEqual(response.data['year'], 2021)
        
        # Проверяем, что данные обновились в БД
        self.vehicle1.refresh_from_db()
        self.assertEqual(self.vehicle1.name, 'Updated Car Name')
        self.assertEqual(self.vehicle1.year, 2021)
    
    def test_delete_vehicle(self):
        """VEH-006: Удаление ТС"""
        self.client.force_authenticate(user=self.user1)
        
        vehicle_id = self.vehicle1.id
        
        response = self.client.delete(f'/api/v1/vehicles/{vehicle_id}')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Проверяем, что автомобиль удалён из БД
        vehicle_exists = Vehicle.objects.filter(id=vehicle_id).exists()
        self.assertFalse(vehicle_exists)
    
    def test_delete_vehicle_cascades_to_fuel_entries(self):
        """VEH-007: Удаление ТС приводит к каскадному удалению всех связанных FuelEntry"""
        from .models import FuelEntry
        from decimal import Decimal
        from datetime import date, timedelta
        
        self.client.force_authenticate(user=self.user1)
        
        # Создаём несколько FuelEntry для vehicle1
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
        
        # Проверяем, что записи существуют до удаления
        self.assertEqual(FuelEntry.objects.filter(vehicle_id=vehicle_id).count(), 3)
        
        # Удаляем автомобиль
        response = self.client.delete(f'/api/v1/vehicles/{vehicle_id}')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Проверяем, что автомобиль удалён
        vehicle_exists = Vehicle.objects.filter(id=vehicle_id).exists()
        self.assertFalse(vehicle_exists)
        
        # Проверяем, что ВСЕ связанные FuelEntry также удалены (CASCADE)
        for entry_id in entry_ids:
            entry_exists = FuelEntry.objects.filter(id=entry_id).exists()
            self.assertFalse(entry_exists, f"FuelEntry {entry_id} должна быть удалена")
        
        # Проверяем общим запросом
        remaining_entries = FuelEntry.objects.filter(vehicle_id=vehicle_id).count()
        self.assertEqual(remaining_entries, 0)
    
    def test_list_vehicles_unauthenticated(self):
        """Попытка получить список ТС без аутентификации"""
        response = self.client.get('/api/v1/vehicles')
        
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class VehicleIsolationTestCase(APITestCase):
    """
    Тесты изоляции данных между пользователями для автомобилей (SEC-001, SEC-003)
    """
    
    def setUp(self):
        """Создаём двух пользователей с автомобилями"""
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
        
        # Автомобиль user1
        self.vehicle1 = Vehicle.objects.create(
            user=self.user1,
            name='User1 Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
        
        # Автомобиль user2
        self.vehicle2 = Vehicle.objects.create(
            user=self.user2,
            name='User2 Car',
            make='Honda',
            model='Accord',
            year=2021,
            fuel_type='Gasoline'
        )
    
    def test_cannot_retrieve_other_user_vehicle(self):
        """SEC-001: Попытка получить ТС другого пользователя"""
        self.client.force_authenticate(user=self.user1)
        
        # user1 пытается получить автомобиль user2
        response = self.client.get(f'/api/v1/vehicles/{self.vehicle2.id}')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_cannot_update_other_user_vehicle(self):
        """Попытка обновить ТС другого пользователя"""
        self.client.force_authenticate(user=self.user1)
        
        data = {'name': 'Hacked Name'}
        
        # user1 пытается обновить автомобиль user2
        response = self.client.patch(f'/api/v1/vehicles/{self.vehicle2.id}', data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Проверяем, что данные не изменились
        self.vehicle2.refresh_from_db()
        self.assertEqual(self.vehicle2.name, 'User2 Car')
    
    def test_cannot_delete_other_user_vehicle(self):
        """SEC-003: Попытка удалить ТС другого пользователя"""
        self.client.force_authenticate(user=self.user1)
        
        # user1 пытается удалить автомобиль user2
        response = self.client.delete(f'/api/v1/vehicles/{self.vehicle2.id}')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Проверяем, что автомобиль НЕ удалён
        vehicle_exists = Vehicle.objects.filter(id=self.vehicle2.id).exists()
        self.assertTrue(vehicle_exists)
    
    def test_list_only_own_vehicles(self):
        """Список содержит только собственные автомобили"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/api/v1/vehicles')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.vehicle1.id)

