#!/usr/bin/env python
"""
Script for checking user statistics.
Run: python manage.py shell < scripts/check_stats.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_tracker.settings')
django.setup()

from users.models import User
from api.models import Vehicle, FuelEntry
from api.services import StatisticsService

# Get user
try:
    user = User.objects.get(email='anton@mail.ru')
    print(f"User found: {user.email} (ID: {user.id})")
except User.DoesNotExist:
    print("User anton@mail.ru not found")
    sys.exit(1)

# Get user vehicles
vehicles = Vehicle.objects.filter(user=user)
print(f"\nUser vehicles: {vehicles.count()}")
for vehicle in vehicles:
    print(f"  - {vehicle.name} (ID: {vehicle.id}, initial_odometer: {vehicle.initial_odometer} km)")

# Get fuel entries
entries = FuelEntry.objects.filter(user=user).order_by('entry_date', 'created_at')
print(f"\nFuel entries: {entries.count()}")
for entry in entries:
    print(f"  - {entry.entry_date}: {entry.odometer} km, {entry.liters} L, ${entry.total_amount}")

# Calculate statistics for 30 days
stats = StatisticsService.calculate_dashboard_statistics(user.id, period_type='30d')

print("\n" + "="*50)
print("STATISTICS FOR 30 DAYS")
print("="*50)

aggregates = stats['aggregates']

print(f"\nTotal Distance: {aggregates['total_distance']} km")
print(f"Total Spent: ${aggregates['total_spent']}")
print(f"Total Liters: {aggregates['total_liters']} L")
print(f"Average Cost per km: ${aggregates['average_cost_per_km']}/km")
print(f"Average Distance/Day: {aggregates['average_distance_per_day']} km/day")
print(f"Average Consumption: {aggregates['average_consumption']} L/100km")
print(f"Fill Up Count: {aggregates['fill_up_count']}")

# Manual calculation check
print("\n" + "="*50)
print("MANUAL CALCULATION CHECK")
print("="*50)

# For each vehicle Calculate distance
total_distance_manual = 0
for vehicle in vehicles:
    vehicle_entries = entries.filter(vehicle=vehicle)
    if vehicle_entries.exists():
        max_odometer = max(e.odometer for e in vehicle_entries)
        distance = max_odometer - vehicle.initial_odometer
        total_distance_manual += distance
        print(f"\n{vehicle.name}:")
        print(f"  - initial_odometer: {vehicle.initial_odometer} km")
        print(f"  - max_odometer: {max_odometer} km")
        print(f"  - distance: {distance} km")

print(f"\nTotal Distance (manual): {total_distance_manual} km")

# Total cost and liters
total_cost = sum(e.total_amount for e in entries)
total_liters = sum(e.liters for e in entries)
print(f"Total Cost (manual): ${total_cost}")
print(f"Total Liters (manual): {total_liters} L")

# Average cost per km
if total_distance_manual > 0:
    avg_cost_per_km = total_cost / total_distance_manual
    print(f"Average Cost per km (manual): ${avg_cost_per_km:.4f}/km")

# Average distance per day (30 day period)
avg_distance_per_day = total_distance_manual / 30 if total_distance_manual > 0 else 0
print(f"Average Distance/Day (manual, 30d): {avg_distance_per_day:.1f} km/day")

# For average consumption calculation we need entries with metrics
entries_with_metrics = [e for e in entries if e.distance_since_last is not None and e.consumption_l_100km is not None]
if entries_with_metrics:
    total_fuel_for_consumption = sum(e.liters for e in entries_with_metrics)
    total_distance_for_consumption = sum(e.distance_since_last for e in entries_with_metrics)
    avg_consumption = (total_fuel_for_consumption / total_distance_for_consumption * 100) if total_distance_for_consumption > 0 else 0
    print(f"Average Consumption (manual): {avg_consumption:.1f} L/100km")

print("\n" + "="*50)
print("EXPECTED VALUES (from task)")
print("="*50)
print("Total Distance: 350 km")
print("Average Distance/Day: 32 km/day (350/11)")
print("Average Cost per km: $0.21/km")
