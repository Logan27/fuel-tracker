#!/usr/bin/env python
"""
Script for clearing user data for anton@mail.ru
"""

import os
import sys
import django

# Django setup
import sys
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_tracker.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Vehicle, FuelEntry

User = get_user_model()

def clear_user_data():
    """Clear user data for anton@mail.ru"""
    try:
        user = User.objects.get(email='anton@mail.ru')
        
        # Delete fuel entries
        fuel_entries_count = FuelEntry.objects.filter(user=user).count()
        FuelEntry.objects.filter(user=user).delete()
        
        # Delete vehicles
        vehicles_count = Vehicle.objects.filter(user=user).count()
        Vehicle.objects.filter(user=user).delete()
        
        print(f"✅ Cleared:")
        print(f"   - Fuel entries: {fuel_entries_count}")
        print(f"   - Vehicles: {vehicles_count}")
        print(f"   - User: {user.email}")
        
    except User.DoesNotExist:
        print("❌ User anton@mail.ru not found")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    clear_user_data()
