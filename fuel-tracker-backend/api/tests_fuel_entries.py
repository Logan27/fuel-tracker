"""
Тесты для CRUD операций с записями о заправках
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
    Тесты для CRUD операций с записями о заправках (FUEL-001 до FUEL-007)
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
        
        self.client.force_authenticate(user=self.user)
    
    def test_create_baseline_entry(self):
        """FUEL-001: Создание первой (базовой) записи о заправке"""
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
        
        # Вычисляемые поля должны быть null для baseline
        self.assertIsNone(response.data['distance_since_last'])
        self.assertIsNone(response.data['consumption_l_100km'])
        
        # unit_price должен быть вычислен
        self.assertIsNotNone(response.data['unit_price'])
        self.assertEqual(float(response.data['unit_price']), 55.0)  # 2750/50
    
    def test_create_second_entry_with_metrics(self):
        """FUEL-002: Создание второй записи о заправке с вычисленными метриками"""
        # Создаём baseline запись
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
        
        # Создаём вторую запись
        data = {
            'vehicle': self.vehicle.id,
            'entry_date': date.today().strftime('%Y-%m-%d'),
            'odometer': 10500,  # +500 км
            'station_name': 'BP',
            'fuel_brand': 'BP',
            'fuel_grade': '95',
            'liters': '42.00',
            'total_amount': '2310.00'
        }
        
        response = self.client.post('/api/v1/fuel-entries', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Проверяем вычисленные метрики
        self.assertEqual(response.data['distance_since_last'], 500)
        self.assertIsNotNone(response.data['consumption_l_100km'])
        self.assertIsNotNone(response.data['cost_per_km'])
        
        # Проверяем расход: 42L / 500km * 100 = 8.4 L/100km
        consumption = float(response.data['consumption_l_100km'])
        self.assertAlmostEqual(consumption, 8.4, places=1)
    
    def test_create_entry_with_lower_odometer(self):
        """FUEL-003: Создание записи с одометром меньше предыдущего (должно быть отклонено)"""
        # Создаём первую запись с odometer=10000
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
        
        # Пытаемся создать запись с меньшим одометром
        data = {
            'vehicle': self.vehicle.id,
            'entry_date': date.today().strftime('%Y-%m-%d'),
            'odometer': 10100,  # Меньше чем 10200!
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
        """FUEL-004: Создание записи с датой в будущем (должно быть отклонено)"""
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
        """FUEL-005: Редактирование записи о заправке"""
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
        
        # Обновляем вторую запись (изменяем количество литров)
        data = {
            'liters': '45.00',
            'total_amount': '2475.00'
        }
        
        response = self.client.patch(f'/api/v1/fuel-entries/{entry2.id}', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['liters']), 45.0)
        
        # Проверяем, что метрики пересчитались
        entry2.refresh_from_db()
        entry3.refresh_from_db()
        
        # Метрики entry3 должны быть пересчитаны на основе обновлённого entry2
        self.assertIsNotNone(entry3.distance_since_last)
        self.assertIsNotNone(entry3.consumption_l_100km)
    
    def test_delete_fuel_entry(self):
        """FUEL-006: Удаление записи о заправке с пересчётом метрик"""
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
        
        # Удаляем вторую запись
        response = self.client.delete(f'/api/v1/fuel-entries/{entry2_id}')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Проверяем, что запись удалена
        entry_exists = FuelEntry.objects.filter(id=entry2_id).exists()
        self.assertFalse(entry_exists)
        
        # Проверяем, что метрики entry3 пересчитались
        # Теперь entry3 должен ссылаться на entry1
        entry3.refresh_from_db()
        self.assertEqual(entry3.distance_since_last, 1000)  # 11000 - 10000
    
    def test_list_fuel_entries_with_pagination(self):
        """FUEL-007: Получение списка записей с пагинацией"""
        # Создаём 30 записей
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
        
        # По умолчанию должно возвращаться 25 записей
        self.assertEqual(len(response.data['results']), 25)
    
    def test_list_fuel_entries_with_filters(self):
        """Получение списка с фильтрами по vehicle и date"""
        # Создаём второй автомобиль
        vehicle2 = Vehicle.objects.create(
            user=self.user,
            name='Second Car',
            make='Honda',
            model='Accord',
            year=2021,
            fuel_type='Gasoline'
        )
        
        # Создаём записи для обоих автомобилей
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
        
        # Фильтр по vehicle
        response = self.client.get(f'/api/v1/fuel-entries?vehicle={self.vehicle.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Фильтр по дате
        date_after = (date.today() - timedelta(days=3)).strftime('%Y-%m-%d')
        response = self.client.get(f'/api/v1/fuel-entries?date_after={date_after}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class FuelEntryIsolationTestCase(APITestCase):
    """
    Тесты изоляции данных для записей о заправках (SEC-002)
    """
    
    def setUp(self):
        """Создаём двух пользователей с данными"""
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
        
        # Автомобиль и запись user1
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
        
        # Автомобиль и запись user2
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
        """Попытка получить запись другого пользователя"""
        self.client.force_authenticate(user=self.user1)
        
        # user1 пытается получить запись user2
        response = self.client.get(f'/api/v1/fuel-entries/{self.entry2.id}')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_cannot_update_other_user_entry(self):
        """SEC-002: Попытка обновить запись о заправке другого пользователя"""
        self.client.force_authenticate(user=self.user1)
        
        data = {'liters': '100.00'}
        
        # user1 пытается обновить запись user2
        response = self.client.patch(f'/api/v1/fuel-entries/{self.entry2.id}', data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Проверяем, что данные не изменились
        self.entry2.refresh_from_db()
        self.assertEqual(self.entry2.liters, Decimal('45.00'))
    
    def test_cannot_delete_other_user_entry(self):
        """Попытка удалить запись другого пользователя"""
        self.client.force_authenticate(user=self.user1)
        
        # user1 пытается удалить запись user2
        response = self.client.delete(f'/api/v1/fuel-entries/{self.entry2.id}')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Проверяем, что запись НЕ удалена
        entry_exists = FuelEntry.objects.filter(id=self.entry2.id).exists()
        self.assertTrue(entry_exists)
    
    def test_list_only_own_entries(self):
        """Список содержит только собственные записи"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get('/api/v1/fuel-entries')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.entry1.id)
    
    def test_unauthenticated_access(self):
        """SEC-004: Доступ к эндпоинтам без авторизации"""
        response = self.client.get('/api/v1/fuel-entries')
        
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

