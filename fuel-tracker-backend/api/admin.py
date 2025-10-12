from django.contrib import admin
from .models import Vehicle, FuelEntry


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'make', 'model', 'year', 'is_active', 'created_at')
    list_filter = ('is_active', 'fuel_type', 'created_at')
    search_fields = ('name', 'make', 'model', 'user__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(FuelEntry)
class FuelEntryAdmin(admin.ModelAdmin):
    list_display = ('vehicle', 'entry_date', 'odometer', 'liters', 'total_amount', 'station_name')
    list_filter = ('entry_date', 'fuel_brand', 'fuel_grade')
    search_fields = ('vehicle__name', 'station_name', 'fuel_brand', 'user__email')
    readonly_fields = ('unit_price', 'distance_since_last', 'consumption_l_100km', 'cost_per_km', 'created_at', 'updated_at')
    date_hierarchy = 'entry_date'
