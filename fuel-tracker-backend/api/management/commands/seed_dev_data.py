"""
Django management command to seed development data
Usage: python manage.py seed_dev_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from decimal import Decimal
from datetime import date, timedelta
from api.models import Vehicle, FuelEntry
from api.services import FuelEntryMetricsService

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with development data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            FuelEntry.objects.all().delete()
            Vehicle.objects.all().delete()
            User.objects.filter(email__in=['demo@example.com', 'test@example.com']).delete()
            self.stdout.write(self.style.SUCCESS('✓ Data cleared'))

        self.stdout.write('Seeding development data...')

        with transaction.atomic():
            # Create demo users
            demo_user, created = User.objects.get_or_create(
                email='demo@example.com',
                defaults={
                    'username': 'demo@example.com',
                    'preferred_currency': 'USD',
                    'preferred_distance_unit': 'km',
                    'preferred_volume_unit': 'L',
                    'timezone': 'UTC'
                }
            )
            if created:
                demo_user.set_password('demo123')
                demo_user.save()
                self.stdout.write(self.style.SUCCESS('✓ Created demo user: demo@example.com / demo123'))
            else:
                self.stdout.write('  → Demo user already exists')

            test_user, created = User.objects.get_or_create(
                email='test@example.com',
                defaults={
                    'username': 'test@example.com',
                    'preferred_currency': 'EUR',
                    'preferred_distance_unit': 'mi',
                    'preferred_volume_unit': 'gal',
                    'timezone': 'Europe/London'
                }
            )
            if created:
                test_user.set_password('test123')
                test_user.save()
                self.stdout.write(self.style.SUCCESS('✓ Created test user: test@example.com / test123'))
            else:
                self.stdout.write('  → Test user already exists')

            # Create vehicles for demo user
            vehicles_data = [
                {
                    'name': 'Toyota Camry 2020',
                    'make': 'Toyota',
                    'model': 'Camry',
                    'year': 2020,
                    'fuel_type': 'Petrol 95',
                },
                {
                    'name': 'Honda Civic 2019',
                    'make': 'Honda',
                    'model': 'Civic',
                    'year': 2019,
                    'fuel_type': 'Petrol 95',
                },
            ]

            vehicles = []
            for veh_data in vehicles_data:
                vehicle, created = Vehicle.objects.get_or_create(
                    user=demo_user,
                    name=veh_data['name'],
                    defaults=veh_data
                )
                vehicles.append(vehicle)
                if created:
                    self.stdout.write(f'  ✓ Created vehicle: {vehicle.name}')
                else:
                    self.stdout.write(f'  → Vehicle already exists: {vehicle.name}')

            # Create fuel entries for first vehicle
            if vehicles:
                vehicle = vehicles[0]
                today = date.today()
                
                # Check if entries already exist
                if FuelEntry.objects.filter(vehicle=vehicle).count() > 0:
                    self.stdout.write(f'  → Fuel entries already exist for {vehicle.name}')
                else:
                    self.stdout.write(f'  🚗 Creating fuel entries for {vehicle.name}...')
                    
                    entries_data = [
                        # Entry 1 (baseline - 3 months ago)
                        {
                            'entry_date': today - timedelta(days=90),
                            'odometer': 10000,
                            'station_name': 'Shell',
                            'fuel_brand': 'Shell',
                            'fuel_grade': '95',
                            'liters': Decimal('45.00'),
                            'total_amount': Decimal('2475.00'),
                        },
                        # Entry 2 (2.5 months ago)
                        {
                            'entry_date': today - timedelta(days=75),
                            'odometer': 10600,
                            'station_name': 'BP',
                            'fuel_brand': 'BP',
                            'fuel_grade': '95',
                            'liters': Decimal('48.00'),
                            'total_amount': Decimal('2640.00'),
                        },
                        # Entry 3 (2 months ago)
                        {
                            'entry_date': today - timedelta(days=60),
                            'odometer': 11200,
                            'station_name': 'Shell',
                            'fuel_brand': 'Shell',
                            'fuel_grade': '95',
                            'liters': Decimal('46.50'),
                            'total_amount': Decimal('2557.50'),
                        },
                        # Entry 4 (1.5 months ago)
                        {
                            'entry_date': today - timedelta(days=45),
                            'odometer': 11750,
                            'station_name': 'Esso',
                            'fuel_brand': 'Esso',
                            'fuel_grade': '95',
                            'liters': Decimal('44.00'),
                            'total_amount': Decimal('2420.00'),
                        },
                        # Entry 5 (1 month ago)
                        {
                            'entry_date': today - timedelta(days=30),
                            'odometer': 12350,
                            'station_name': 'Shell',
                            'fuel_brand': 'Shell',
                            'fuel_grade': '95',
                            'liters': Decimal('47.00'),
                            'total_amount': Decimal('2585.00'),
                        },
                        # Entry 6 (2 weeks ago)
                        {
                            'entry_date': today - timedelta(days=14),
                            'odometer': 12900,
                            'station_name': 'BP',
                            'fuel_brand': 'BP',
                            'fuel_grade': '95',
                            'liters': Decimal('45.50'),
                            'total_amount': Decimal('2502.50'),
                        },
                        # Entry 7 (1 week ago)
                        {
                            'entry_date': today - timedelta(days=7),
                            'odometer': 13450,
                            'station_name': 'Shell',
                            'fuel_brand': 'Shell',
                            'fuel_grade': '95',
                            'liters': Decimal('46.00'),
                            'total_amount': Decimal('2530.00'),
                        },
                        # Entry 8 (today)
                        {
                            'entry_date': today,
                            'odometer': 14000,
                            'station_name': 'Esso',
                            'fuel_brand': 'Esso',
                            'fuel_grade': '95',
                            'liters': Decimal('44.50'),
                            'total_amount': Decimal('2447.50'),
                            'notes': 'Latest refuel',
                        },
                    ]

                    for entry_data in entries_data:
                        entry = FuelEntry.objects.create(
                            vehicle=vehicle,
                            user=demo_user,
                            **entry_data
                        )
                        # Calculate metrics
                        FuelEntryMetricsService.calculate_metrics(entry)
                        entry.save(update_fields=[
                            'unit_price',
                            'distance_since_last',
                            'consumption_l_100km',
                            'cost_per_km'
                        ])
                    
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(entries_data)} fuel entries'))

            # Create one vehicle for test user
            test_vehicle, created = Vehicle.objects.get_or_create(
                user=test_user,
                name='Ford Focus 2021',
                defaults={
                    'make': 'Ford',
                    'model': 'Focus',
                    'year': 2021,
                    'fuel_type': 'Diesel',
                }
            )
            if created:
                self.stdout.write(f'  ✓ Created vehicle for test user: {test_vehicle.name}')
            else:
                self.stdout.write(f'  → Vehicle already exists for test user')
            
            # Create fuel entries for test user's vehicle
            if FuelEntry.objects.filter(vehicle=test_vehicle).count() > 0:
                self.stdout.write(f'  → Fuel entries already exist for {test_vehicle.name}')
            else:
                self.stdout.write(f'  🚗 Creating fuel entries for {test_vehicle.name}...')
                
                test_entries_data = [
                    # Entry 1 (baseline - 60 days ago)
                    {
                        'entry_date': today - timedelta(days=60),
                        'odometer': 15000,
                        'station_name': 'Total',
                        'fuel_brand': 'Total',
                        'fuel_grade': 'Diesel',
                        'liters': Decimal('50.00'),
                        'total_amount': Decimal('2900.00'),
                    },
                    # Entry 2 (45 days ago)
                    {
                        'entry_date': today - timedelta(days=45),
                        'odometer': 15700,
                        'station_name': 'Shell',
                        'fuel_brand': 'Shell',
                        'fuel_grade': 'Diesel',
                        'liters': Decimal('52.00'),
                        'total_amount': Decimal('3016.00'),
                    },
                    # Entry 3 (30 days ago)
                    {
                        'entry_date': today - timedelta(days=30),
                        'odometer': 16350,
                        'station_name': 'BP',
                        'fuel_brand': 'BP',
                        'fuel_grade': 'Diesel',
                        'liters': Decimal('51.50'),
                        'total_amount': Decimal('2987.00'),
                    },
                    # Entry 4 (15 days ago)
                    {
                        'entry_date': today - timedelta(days=15),
                        'odometer': 17000,
                        'station_name': 'Total',
                        'fuel_brand': 'Total',
                        'fuel_grade': 'Diesel',
                        'liters': Decimal('49.00'),
                        'total_amount': Decimal('2842.00'),
                    },
                    # Entry 5 (today)
                    {
                        'entry_date': today,
                        'odometer': 17650,
                        'station_name': 'Shell',
                        'fuel_brand': 'Shell',
                        'fuel_grade': 'Diesel',
                        'liters': Decimal('50.50'),
                        'total_amount': Decimal('2929.00'),
                        'notes': 'Latest diesel refuel',
                    },
                ]

                for entry_data in test_entries_data:
                    entry = FuelEntry.objects.create(
                        vehicle=test_vehicle,
                        user=test_user,
                        **entry_data
                    )
                    # Calculate metrics
                    FuelEntryMetricsService.calculate_metrics(entry)
                    entry.save(update_fields=[
                        'unit_price',
                        'distance_since_last',
                        'consumption_l_100km',
                        'cost_per_km'
                    ])
                
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created {len(test_entries_data)} fuel entries for test user'))

        self.stdout.write(self.style.SUCCESS('\n✅ Development data seeded successfully!'))
        self.stdout.write('\n📝 Demo credentials:')
        self.stdout.write('   • demo@example.com / demo123')
        self.stdout.write('     └─ 2 vehicles (Toyota Camry, Honda Civic)')
        self.stdout.write('     └─ 8 fuel entries for Toyota Camry')
        self.stdout.write('\n   • test@example.com / test123')
        self.stdout.write('     └─ 1 vehicle (Ford Focus Diesel)')
        self.stdout.write('     └─ 5 fuel entries')
        self.stdout.write('\n💡 Note: For performance testing, use scripts/load_test.py')
        self.stdout.write('   (creates loadtest@example.com with 5000 entries)')

