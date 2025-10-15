#!/usr/bin/env python
"""
Authentication test.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_tracker.settings')
django.setup()

from django.test import RequestFactory
from rest_framework.authentication import SessionAuthentication
from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.auth import login
from users.models import User

# Create request factory
factory = RequestFactory()

# Get user
user = User.objects.get(email='anton@mail.ru')
print(f"User: {user.email} (ID: {user.id})")

# Create GET request to /api/v1/vehicles
request = factory.get('/api/v1/vehicles')

# Add session middleware
middleware = SessionMiddleware(lambda req: None)
middleware.process_request(request)
request.session.save()

# Login user
login(request, user, backend='users.backends.EmailBackend')
request.session.save()

print(f"Session key: {request.session.session_key}")
print(f"Session data: {dict(request.session)}")

# Try to authenticate
auth = SessionAuthentication()
try:
    authenticated_user = auth.authenticate(request)
    if authenticated_user:
        print(f"✓ Authentication successful: {authenticated_user[0].email}")
    else:
        print("✗ Authentication failed: returned None")
except Exception as e:
    print(f"✗ Authentication error: {e}")
