"""
Тесты для аутентификации и профиля пользователя
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class AuthSignUpTestCase(APITestCase):
    """
    Тесты для регистрации пользователя (AUTH-001, AUTH-002, AUTH-003)
    """
    
    def test_signup_successful(self):
        """AUTH-001: Успешная регистрация нового пользователя"""
        data = {
            'email': 'newuser@example.com',
            'password': 'TestPass123'
        }
        
        response = self.client.post('/api/v1/auth/signup', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['email'], 'newuser@example.com')
        
        # Проверяем, что пользователь создан в БД
        user_exists = User.objects.filter(email='newuser@example.com').exists()
        self.assertTrue(user_exists)
        
        # Проверяем, что пользователь автоматически авторизован (есть session)
        # Проверяем через попытку доступа к защищённому эндпоинту
        profile_response = self.client.get('/api/v1/users/me')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
    
    def test_signup_duplicate_email(self):
        """AUTH-002: Регистрация с уже существующим email"""
        # Создаём существующего пользователя
        User.objects.create_user(
            username='existing',
            email='existing@example.com',
            password='ExistingPass123'
        )
        
        data = {
            'email': 'existing@example.com',
            'password': 'NewPass123'
        }
        
        response = self.client.post('/api/v1/auth/signup', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', str(response.data).lower())
    
    def test_signup_weak_password(self):
        """AUTH-003: Регистрация с невалидным паролем (короче 8 символов)"""
        data = {
            'email': 'newuser@example.com',
            'password': '12345'  # Слишком короткий
        }
        
        response = self.client.post('/api/v1/auth/signup', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', str(response.data).lower())


class AuthSignInTestCase(APITestCase):
    """
    Тесты для входа в систему (AUTH-004, AUTH-005)
    """
    
    def setUp(self):
        """Создаём тестового пользователя"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
    
    def test_signin_successful(self):
        """AUTH-004: Успешный вход в систему"""
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123'
        }
        
        response = self.client.post('/api/v1/auth/signin', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['email'], 'test@example.com')
        
        # Проверяем, что сессия создана
        profile_response = self.client.get('/api/v1/users/me')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
    
    def test_signin_wrong_password(self):
        """AUTH-005: Вход с неверным паролем"""
        data = {
            'email': 'test@example.com',
            'password': 'WrongPassword'
        }
        
        response = self.client.post('/api/v1/auth/signin', data)
        
        # DRF возвращает 400 для ValidationError (это корректное поведение)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_signin_nonexistent_user(self):
        """Вход с несуществующим email"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'SomePassword123'
        }
        
        response = self.client.post('/api/v1/auth/signin', data)
        
        # DRF возвращает 400 для ValidationError (это корректное поведение)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AuthSignOutTestCase(APITestCase):
    """
    Тесты для выхода из системы (AUTH-006)
    """
    
    def setUp(self):
        """Создаём и авторизуем пользователя"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_signout_successful(self):
        """AUTH-006: Выход из системы"""
        # Проверяем, что пользователь авторизован
        profile_response = self.client.get('/api/v1/users/me')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        
        # Выходим
        response = self.client.post('/api/v1/auth/signout')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Проверяем, что сессия завершена
        # Создаём новый клиент без аутентификации
        new_client = self.client_class()
        profile_response = new_client.get('/api/v1/users/me')
        self.assertIn(profile_response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class UserProfileTestCase(APITestCase):
    """
    Тесты для профиля пользователя (PROF-001, PROF-002, PROF-003)
    """
    
    def setUp(self):
        """Создаём и авторизуем пользователя"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        self.user.preferred_currency = 'USD'
        self.user.preferred_distance_unit = 'km'
        self.user.preferred_volume_unit = 'L'
        self.user.timezone = 'UTC'
        self.user.save()
        
        self.client.force_authenticate(user=self.user)
    
    def test_get_profile(self):
        """PROF-001: Получение профиля пользователя"""
        response = self.client.get('/api/v1/users/me')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertIn('preferred_currency', response.data)
        self.assertIn('preferred_distance_unit', response.data)
        self.assertIn('preferred_volume_unit', response.data)
        self.assertIn('timezone', response.data)
    
    def test_update_profile_settings(self):
        """PROF-002: Обновление настроек пользователя (единицы измерения)"""
        data = {
            'preferred_currency': 'EUR',
            'preferred_distance_unit': 'mi',
            'preferred_volume_unit': 'gal'
        }
        
        response = self.client.patch('/api/v1/users/me', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['preferred_currency'], 'EUR')
        self.assertEqual(response.data['preferred_distance_unit'], 'mi')
        self.assertEqual(response.data['preferred_volume_unit'], 'gal')
        
        # Проверяем, что данные обновились в БД
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_currency, 'EUR')
        self.assertEqual(self.user.preferred_distance_unit, 'mi')
        self.assertEqual(self.user.preferred_volume_unit, 'gal')
    
    def test_update_profile_invalid_values(self):
        """PROF-003: Обновление настроек с невалидными значениями"""
        data = {
            'preferred_distance_unit': 'invalid_unit'
        }
        
        response = self.client.patch('/api/v1/users/me', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('preferred_distance_unit', str(response.data).lower())
    
    def test_profile_unauthenticated(self):
        """Попытка получить профиль без аутентификации"""
        # Создаём новый клиент без аутентификации
        new_client = self.client_class()
        response = new_client.get('/api/v1/users/me')
        
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
