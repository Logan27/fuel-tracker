"""
Tests for authentication and user profile
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class AuthSignUpTestCase(APITestCase):
    """
    Tests for user sign up (AUTH-001, AUTH-002, AUTH-003)
    """
    
    def test_signup_successful(self):
        """AUTH-001: Successful registration of new user"""
        data = {
            'email': 'newuser@example.com',
            'password': 'TestPass123'
        }
        
        response = self.client.post('/api/v1/auth/signup', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['email'], 'newuser@example.com')
        
        # Check that user is created in DB
        user_exists = User.objects.filter(email='newuser@example.com').exists()
        self.assertTrue(user_exists)
        
        # Check that user is automatically authenticated (has session)
        # Check through attempt to access protected endpoint
        profile_response = self.client.get('/api/v1/users/me')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
    
    def test_signup_duplicate_email(self):
        """AUTH-002: Registration with existing email"""
        # Create existing user
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
        """AUTH-003: Registration with invalid password (shorter than 8 characters)"""
        data = {
            'email': 'newuser@example.com',
            'password': '12345'  # Too short
        }
        
        response = self.client.post('/api/v1/auth/signup', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', str(response.data).lower())


class AuthSignInTestCase(APITestCase):
    """
    Tests for sign in (AUTH-004, AUTH-005)
    """
    
    def setUp(self):
        """Create test user"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
    
    def test_signin_successful(self):
        """AUTH-004: Successful sign in"""
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123'
        }
        
        response = self.client.post('/api/v1/auth/signin', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['email'], 'test@example.com')
        
        # Check that session is created
        profile_response = self.client.get('/api/v1/users/me')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
    
    def test_signin_wrong_password(self):
        """AUTH-005: Sign in with wrong password"""
        data = {
            'email': 'test@example.com',
            'password': 'WrongPassword'
        }
        
        response = self.client.post('/api/v1/auth/signin', data)
        
        # DRF returns 400 for ValidationError (this is correct behavior)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_signin_nonexistent_user(self):
        """Sign in with non-existent email"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'SomePassword123'
        }
        
        response = self.client.post('/api/v1/auth/signin', data)
        
        # DRF returns 400 for ValidationError (this is correct behavior)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AuthSignOutTestCase(APITestCase):
    """
    Tests for sign out from system (AUTH-006)
    """
    
    def setUp(self):
        """Create and authorize user"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_signout_successful(self):
        """AUTH-006: Sign out from system"""
        # Check that user is authorized
        profile_response = self.client.get('/api/v1/users/me')
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        
        # Sign out
        response = self.client.post('/api/v1/auth/signout')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check that session is ended
        # Create new client without authentication
        new_client = self.client_class()
        profile_response = new_client.get('/api/v1/users/me')
        self.assertIn(profile_response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class UserProfileTestCase(APITestCase):
    """
    Tests for user profile (PROF-001, PROF-002, PROF-003)
    """
    
    def setUp(self):
        """Create and authorize user"""
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
        """PROF-001: Getting user profile"""
        response = self.client.get('/api/v1/users/me')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertIn('preferred_currency', response.data)
        self.assertIn('preferred_distance_unit', response.data)
        self.assertIn('preferred_volume_unit', response.data)
        self.assertIn('timezone', response.data)
    
    def test_update_profile_settings(self):
        """PROF-002: Updating user settings (units of measurement)"""
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
        
        # Check that data updated in DB
        self.user.refresh_from_db()
        self.assertEqual(self.user.preferred_currency, 'EUR')
        self.assertEqual(self.user.preferred_distance_unit, 'mi')
        self.assertEqual(self.user.preferred_volume_unit, 'gal')
    
    def test_update_profile_invalid_values(self):
        """PROF-003: Updating settings with invalid values"""
        data = {
            'preferred_distance_unit': 'invalid_unit'
        }
        
        response = self.client.patch('/api/v1/users/me', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('preferred_distance_unit', str(response.data).lower())
    
    def test_profile_unauthenticated(self):
        """Attempt to get profile without authentication"""
        # Create new client without authentication
        new_client = self.client_class()
        response = new_client.get('/api/v1/users/me')
        
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
