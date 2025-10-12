"""
Тесты для GDPR эндпоинтов (экспорт и удаление данных)
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, timedelta
from decimal import Decimal
from api.models import Vehicle, FuelEntry

User = get_user_model()


class GDPRExportTestCase(APITestCase):
    """
    Тесты для эндпоинта экспорта данных пользователя
    """
    
    def setUp(self):
        """Создаём тестовые данные"""
        # Создаём пользователя
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Создаём автомобиль
        self.vehicle = Vehicle.objects.create(
            user=self.user,
            name='Test Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
        
        # Создаём запись о заправке
        self.entry = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today(),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('75.00')
        )
    
    def test_export_authenticated_user(self):
        """Тест экспорта данных для авторизованного пользователя"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/v1/users/me/export')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv; charset=utf-8')
        self.assertIn('attachment', response['Content-Disposition'])
        self.assertIn('.csv', response['Content-Disposition'])
        
        # Проверяем, что CSV содержит данные пользователя
        content = response.content.decode('utf-8')
        self.assertIn('USER PROFILE', content)
        self.assertIn(self.user.email, content)
        self.assertIn('VEHICLES', content)
        self.assertIn('Test Car', content)
        self.assertIn('FUEL ENTRIES', content)
        self.assertIn('Shell', content)
    
    def test_export_unauthenticated_user(self):
        """Тест экспорта данных без авторизации"""
        response = self.client.get('/api/v1/users/me/export')
        
        # Должен вернуть 403 или 401
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_export_empty_data(self):
        """Тест экспорта для пользователя без данных"""
        # Создаём нового пользователя без данных
        empty_user = User.objects.create_user(
            username='emptyuser',
            email='empty@example.com',
            password='testpass123'
        )
        
        self.client.force_authenticate(user=empty_user)
        
        response = self.client.get('/api/v1/users/me/export')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        content = response.content.decode('utf-8')
        self.assertIn('USER PROFILE', content)
        self.assertIn('No vehicles', content)
        self.assertIn('No fuel entries', content)


class GDPRDeleteAccountTestCase(APITestCase):
    """
    Тесты для эндпоинта удаления аккаунта
    """
    
    def setUp(self):
        """Создаём тестовые данные"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.vehicle = Vehicle.objects.create(
            user=self.user,
            name='Test Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
        
        self.entry = FuelEntry.objects.create(
            vehicle=self.vehicle,
            user=self.user,
            entry_date=date.today(),
            odometer=10000,
            station_name='Shell',
            fuel_brand='Shell',
            fuel_grade='95',
            liters=Decimal('50.00'),
            total_amount=Decimal('75.00')
        )
    
    def test_delete_account_authenticated(self):
        """Тест удаления аккаунта для авторизованного пользователя"""
        self.client.force_authenticate(user=self.user)
        
        user_id = self.user.id
        
        response = self.client.delete('/api/v1/users/me/delete')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Проверяем, что пользователь удалён
        self.assertFalse(User.objects.filter(id=user_id).exists())
        
        # Проверяем, что автомобиль удалён (каскадное удаление)
        self.assertFalse(Vehicle.objects.filter(user_id=user_id).exists())
        
        # Проверяем, что записи о заправках удалены (каскадное удаление)
        self.assertFalse(FuelEntry.objects.filter(user_id=user_id).exists())
    
    def test_delete_account_unauthenticated(self):
        """Тест удаления аккаунта без авторизации"""
        response = self.client.delete('/api/v1/users/me/delete')
        
        # Должен вернуть 403 или 401
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
        
        # Проверяем, что пользователь НЕ удалён
        self.assertTrue(User.objects.filter(id=self.user.id).exists())
    
    def test_delete_account_multiple_vehicles(self):
        """Тест удаления аккаунта с несколькими автомобилями и записями"""
        # Создаём ещё один автомобиль
        vehicle2 = Vehicle.objects.create(
            user=self.user,
            name='Second Car',
            make='Honda',
            model='Accord',
            year=2021,
            fuel_type='Gasoline'
        )
        
        # Создаём ещё несколько записей
        for i in range(5):
            FuelEntry.objects.create(
                vehicle=vehicle2,
                user=self.user,
                entry_date=date.today() - timedelta(days=i),
                odometer=10000 + (i * 100),
                station_name='BP',
                fuel_brand='BP',
                fuel_grade='95',
                liters=Decimal('45.00'),
                total_amount=Decimal('70.00')
            )
        
        self.client.force_authenticate(user=self.user)
        
        user_id = self.user.id
        
        # Подсчитываем данные до удаления
        vehicles_count = Vehicle.objects.filter(user=self.user).count()
        entries_count = FuelEntry.objects.filter(user=self.user).count()
        
        self.assertEqual(vehicles_count, 2)
        self.assertEqual(entries_count, 6)  # 1 из setUp + 5 новых
        
        # Удаляем аккаунт
        response = self.client.delete('/api/v1/users/me/delete')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Проверяем, что всё удалено
        self.assertFalse(User.objects.filter(id=user_id).exists())
        self.assertEqual(Vehicle.objects.filter(user_id=user_id).count(), 0)
        self.assertEqual(FuelEntry.objects.filter(user_id=user_id).count(), 0)

