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
    Тесты для эндпоинта статистики дашборда
    """
    
    def setUp(self):
        """Создаем тестовые данные"""
        # Создаем пользователя
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Создаем автомобиль
        self.vehicle = Vehicle.objects.create(
            user=self.user,
            name='Test Car',
            make='Toyota',
            model='Camry',
            year=2020,
            fuel_type='Gasoline'
        )
        
        # Создаем несколько записей о заправках
        today = date.today()
        
        # Запись 1 (baseline, 40 дней назад)
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
        
        # Запись 2 (20 дней назад, внутри периода 30d)
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
        
        # Запись 3 (10 дней назад, внутри периода 30d)
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
        
        # Вычисляем метрики для всех записей
        from .services import FuelEntryMetricsService
        for entry in [self.entry1, self.entry2, self.entry3]:
            FuelEntryMetricsService.calculate_metrics(entry)
            entry.save()
    
    def test_dashboard_statistics_30d(self):
        """Тест статистики за 30 дней"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/v1/statistics/dashboard', {'period': '30d'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('period', response.data)
        self.assertIn('aggregates', response.data)
        self.assertIn('time_series', response.data)
        
        # Проверяем период
        self.assertEqual(response.data['period']['type'], '30d')
        
        # Проверяем агрегаты
        aggregates = response.data['aggregates']
        self.assertIn('average_consumption', aggregates)
        self.assertIn('total_distance', aggregates)
        self.assertEqual(aggregates['entry_count'], 2)  # 2 записи в периоде 30d
    
    def test_dashboard_statistics_unauthenticated(self):
        """Тест доступа без аутентификации"""
        response = self.client.get('/api/v1/statistics/dashboard')
        # DRF может вернуть 401 или 403 в зависимости от настроек
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_dashboard_statistics_invalid_period(self):
        """Тест с невалидным периодом"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/v1/statistics/dashboard', {'period': 'invalid'})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_dashboard_statistics_vehicle_filter(self):
        """Тест фильтрации по автомобилю"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/api/v1/statistics/dashboard', {
            'period': '30d',
            'vehicle': self.vehicle.id
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['aggregates']['entry_count'], 2)
    
    def test_dashboard_statistics_custom_period(self):
        """Тест с custom периодом"""
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
        self.assertEqual(response.data['aggregates']['entry_count'], 1)  # только entry3
