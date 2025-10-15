#!/usr/bin/env python
"""
Script for adding test data for user anton@mail.ru
- 2 vehicles
- 5000 fuel entry records for each vehicle
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random
from decimal import Decimal

# Django setup
import sys
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_tracker.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Vehicle, FuelEntry
from api.services import FuelEntryMetricsService

User = get_user_model()

def create_test_user():
    """Create or get test user"""
    user, created = User.objects.get_or_create(
        email='anton@mail.ru',
        defaults={
            'first_name': 'Anton',
            'last_name': 'Test',
            'is_active': True,
        }
    )
    if created:
        user.set_password('test123')
        user.save()
        print(f"✅ Created user: {user.email}")
    else:
        print(f"✅ Found user: {user.email}")
    return user

def create_vehicles(user):
    """Create 2 vehicles"""
    vehicles_data = [
        {
            'name': 'BMW X5',
            'make': 'BMW',
            'model': 'X5',
            'year': 2020,
            'fuel_type': 'gasoline'
        },
        {
            'name': 'Toyota Camry',
            'make': 'Toyota', 
            'model': 'Camry',
            'year': 2019,
            'fuel_type': 'gasoline'
        }
    ]
    
    vehicles = []
    for data in vehicles_data:
        vehicle, created = Vehicle.objects.get_or_create(
            user=user,
            name=data['name'],
            defaults=data
        )
        if created:
            print(f"✅ Created vehicle: {vehicle.name}")
        else:
            print(f"✅ Found vehicle: {vehicle.name}")
        vehicles.append(vehicle)
    
    return vehicles

def generate_fuel_entries(vehicle, count=5000):
    """Generate 5000 fuel entry records for the vehicle"""
    print(f"🔄 Generating {count} records for {vehicle.name}...")
    
    # Initial values
    current_odometer = 10000  # Initial mileage
    current_date = datetime.now() - timedelta(days=365)  # Start from a year ago
    
    # Create first entry (baseline)
    first_entry = FuelEntry.objects.create(
        user=vehicle.user,
        vehicle=vehicle,
        entry_date=current_date.date(),
        odometer=current_odometer,
        liters=Decimal('50.0'),
        total_amount=Decimal('2275.0'),  # 50 * 45.50
        station_name='Shell',
        fuel_brand='Shell V-Power',
        fuel_grade='95',
        notes='First refuel'
    )
    
    # Recalculate metrics for first entry
    FuelEntryMetricsService.calculate_metrics(first_entry)
    first_entry.save()
    
    print(f"✅ Created first entry: {first_entry.id}")
    
    # Generate remaining entries
    entries_to_create = []
    batch_size = 100
    
    for i in range(1, count):
        # Random interval between refuels (3-15 days)
        days_interval = random.randint(3, 15)
        current_date += timedelta(days=days_interval)
        
        # Random mileage (200-800 km)
        distance = random.randint(200, 800)
        current_odometer += distance
        
        # Random refuel parameters
        liters = Decimal(str(round(random.uniform(30.0, 80.0), 2)))
        price_per_liter = Decimal(str(round(random.uniform(40.0, 50.0), 2)))
        total_amount = liters * price_per_liter
        
        stations = ['Shell', 'Lukoil', 'Rosneft', 'Gazprom', 'Tatneft', 'BP']
        brands = ['Shell V-Power', 'Lukoil Euro', 'Rosneft Premium', 'Gazprom Neft', 'BP Ultimate', 'Tatneft Premium']
        grades = ['92', '95', '98', 'Diesel']
        
        entry = FuelEntry(
            user=vehicle.user,
            vehicle=vehicle,
            entry_date=current_date.date(),
            odometer=current_odometer,
            liters=liters,
            total_amount=total_amount,
            station_name=random.choice(stations),
            fuel_brand=random.choice(brands),
            fuel_grade=random.choice(grades),
            notes=f'Refuel #{i+1}' if i % 100 == 0 else ''
        )
        
        entries_to_create.append(entry)
        
        # Create in batches for performance
        if len(entries_to_create) >= batch_size:
            FuelEntry.objects.bulk_create(entries_to_create, batch_size)
            print(f"✅ Created {len(entries_to_create)} entries (total: {i+1})")
            entries_to_create = []
    
    # Create remaining entries
    if entries_to_create:
        FuelEntry.objects.bulk_create(entries_to_create, batch_size)
        print(f"✅ Created {len(entries_to_create)} entries (total: {count})")
    
    # Recalculate metrics for all entries
    print(f"🔄 Recalculating metrics for {vehicle.name}...")
    entries = FuelEntry.objects.filter(vehicle=vehicle).order_by('entry_date')
    
    for entry in entries:
        FuelEntryMetricsService.calculate_metrics(entry)
        entry.save()
    
    print(f"✅ Completed for {vehicle.name}")

def main():
    """Main function"""
    print("🚀 Starting test data creation...")
    
    try:
        # Create user
        user = create_test_user()
        
        # Create vehicles
        vehicles = create_vehicles(user)
        
        # Generate entries for each vehicle
        for vehicle in vehicles:
            generate_fuel_entries(vehicle, 5000)
        
        # Statistics
        total_vehicles = Vehicle.objects.filter(user=user).count()
        total_entries = FuelEntry.objects.filter(user=user).count()
        
        print("\n" + "="*50)
        print("📊 STATISTICS:")
        print(f"👤 User: {user.email}")
        print(f"🚗 Vehicles: {total_vehicles}")
        print(f"⛽ Fuel entries: {total_entries}")
        print("="*50)
        print("✅ Test data successfully created!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
