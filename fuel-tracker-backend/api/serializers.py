from rest_framework import serializers
from django.utils import timezone
import bleach
from .models import Vehicle, FuelEntry
from .services import FuelEntryMetricsService


def sanitize_text_input(value):
    """
    Sanitize text input for XSS protection.
    Removes all HTML tags and scripts.
    """
    if not value:
        return value
    # Remove all HTML tags, keep only text
    cleaned = bleach.clean(value, tags=[], strip=True)
    return cleaned.strip()


# Serializers for Statistics API responses
class TimeSeriesPointSerializer(serializers.Serializer):
    """Serializer for a single time series point"""
    date = serializers.DateField()
    value = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)


class TimeSeriesDataSerializer(serializers.Serializer):
    """Serializer for time series data (consumption, unit_price)"""
    consumption = TimeSeriesPointSerializer(many=True, required=False)
    unit_price = TimeSeriesPointSerializer(many=True, required=False)


class PeriodSerializer(serializers.Serializer):
    """Serializer for statistics period description"""
    type = serializers.CharField()
    date_after = serializers.DateField()
    date_before = serializers.DateField()


class DashboardAggregatesSerializer(serializers.Serializer):
    """Serializer for dashboard aggregated metrics"""
    average_consumption = serializers.DecimalField(max_digits=5, decimal_places=1, allow_null=True)
    average_unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    total_distance = serializers.IntegerField(allow_null=True)
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    average_cost_per_km = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True)
    total_liters = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    fill_up_count = serializers.IntegerField(allow_null=True)
    average_distance_per_day = serializers.DecimalField(max_digits=10, decimal_places=1, allow_null=True)


class DashboardStatisticsResponseSerializer(serializers.Serializer):
    """Serializer for dashboard statistics endpoint response"""
    period = PeriodSerializer()
    aggregates = DashboardAggregatesSerializer()
    time_series = TimeSeriesDataSerializer()


class BrandStatisticsSerializer(serializers.Serializer):
    """Serializer for fuel brand statistics"""
    brand = serializers.CharField()
    average_consumption = serializers.DecimalField(max_digits=5, decimal_places=1, allow_null=True)
    average_unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    average_cost_per_km = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True)
    fill_count = serializers.IntegerField()


class GradeStatisticsSerializer(serializers.Serializer):
    """Serializer for fuel grade statistics"""
    grade = serializers.CharField()
    average_consumption = serializers.DecimalField(max_digits=5, decimal_places=1, allow_null=True)
    average_unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    average_cost_per_km = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True)
    fill_count = serializers.IntegerField()


class VehicleSerializer(serializers.ModelSerializer):
    """Serializer for Vehicle model"""
    
    name = serializers.CharField(max_length=100, trim_whitespace=True)
    make = serializers.CharField(max_length=50, required=False, allow_blank=True, trim_whitespace=True)
    model = serializers.CharField(max_length=50, required=False, allow_blank=True, trim_whitespace=True)
    fuel_type = serializers.CharField(max_length=20, required=False, allow_blank=True, trim_whitespace=True)
    
    class Meta:
        model = Vehicle
        fields = (
            'id', 
            'name', 
            'make', 
            'model', 
            'year', 
            'initial_odometer',
            'fuel_type', 
            'is_active', 
            'created_at', 
            'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate_name(self, value):
        """XSS Protection: sanitize vehicle name"""
        return sanitize_text_input(value)
    
    def validate_make(self, value):
        """XSS Protection: sanitize manufacturer"""
        return sanitize_text_input(value)
    
    def validate_model(self, value):
        """XSS Protection: sanitize model"""
        return sanitize_text_input(value)
    
    def validate_fuel_type(self, value):
        """XSS Protection: sanitize fuel type"""
        return sanitize_text_input(value)

    def validate_initial_odometer(self, value):
        """Validate that initial odometer is not greater than minimum in entries"""
        if self.instance:
            min_odometer_entry = self.instance.fuel_entries.order_by('odometer').first()
            if min_odometer_entry and value > min_odometer_entry.odometer:
                raise serializers.ValidationError(
                    f"Initial odometer cannot be greater than the smallest existing fuel entry odometer reading ({min_odometer_entry.odometer} km)."
                )
        return value

    def update(self, instance, validated_data):
        """
        Override update to recalculate metrics when initial_odometer changes.
        """
        initial_odometer_before_update = instance.initial_odometer

        # Standard instance update
        instance = super().update(instance, validated_data)

        # If initial_odometer changed, run full metrics recalculation
        if 'initial_odometer' in validated_data and instance.initial_odometer != initial_odometer_before_update:
            # Pass the updated instance to the service to ensure the new
            # initial_odometer is used, avoiding potential transaction isolation issues.
            FuelEntryMetricsService.recalculate_all_metrics_for_vehicle(
                vehicle_id=instance.id, 
                vehicle_instance=instance
            )

            # Invalidate statistics cache for this user
            # This ensures dashboard shows updated data
            from django.core.cache import cache
            from django.utils import timezone
            cache.set(f'stats_version_user_{instance.user_id}', timezone.now().timestamp())

        return instance


class FuelEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for FuelEntry model.
    
    Validation:
    - Odometer must strictly increase for each vehicle
    - Date cannot be in the future
    - Liters and total_amount must be > 0
    - XSS sanitization of all text fields
    """
    vehicle_id = serializers.IntegerField(source='vehicle.id', read_only=True)
    vehicle = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(),
        write_only=True
    )
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    # Explicit validation of text fields
    station_name = serializers.CharField(max_length=100, trim_whitespace=True)
    fuel_brand = serializers.CharField(max_length=50, trim_whitespace=True)
    fuel_grade = serializers.CharField(max_length=20, trim_whitespace=True)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True, trim_whitespace=True)
    
    class Meta:
        model = FuelEntry
        fields = (
            'id',
            'vehicle',
            'vehicle_id',
            'user_id',
            'entry_date',
            'odometer',
            'station_name',
            'fuel_brand',
            'fuel_grade',
            'liters',
            'total_amount',
            'notes',
            # Calculated fields (read-only)
            'unit_price',
            'distance_since_last',
            'consumption_l_100km',
            'cost_per_km',
            'created_at',
            'updated_at'
        )
        read_only_fields = (
            'id',
            'vehicle_id',
            'user_id',
            'unit_price', 
            'distance_since_last', 
            'consumption_l_100km', 
            'cost_per_km', 
            'created_at', 
            'updated_at'
        )
    
    def validate_entry_date(self, value):
        """Date cannot be in the future"""
        if value > timezone.localdate():
            raise serializers.ValidationError(
                "Entry date cannot be in the future."
            )
        return value
    
    def validate_liters(self, value):
        """Liters must be > 0"""
        if value <= 0:
            raise serializers.ValidationError(
                "Liters must be greater than zero."
            )
        return value
    
    def validate_total_amount(self, value):
        """Total amount must be > 0"""
        if value <= 0:
            raise serializers.ValidationError(
                "Total amount must be greater than zero."
            )
        return value
    
    def validate_odometer(self, value):
        """Odometer must be > 0"""
        if value <= 0:
            raise serializers.ValidationError(
                "Odometer reading must be greater than zero."
            )
        return value
    
    def validate_station_name(self, value):
        """XSS Protection: sanitize station name"""
        return sanitize_text_input(value)
    
    def validate_fuel_brand(self, value):
        """XSS Protection: sanitize fuel brand"""
        return sanitize_text_input(value)
    
    def validate_fuel_grade(self, value):
        """XSS Protection: sanitize fuel grade"""
        return sanitize_text_input(value)
    
    def validate_notes(self, value):
        """XSS Protection: sanitize notes"""
        return sanitize_text_input(value)
    
    def validate(self, data):
        """
        Odometer validation: must strictly increase for vehicle.
        """
        # Get vehicle - either from data or existing record
        vehicle = data.get('vehicle') or (self.instance.vehicle if self.instance else None)
        # Get odometer - either from data or existing record
        odometer = data.get('odometer') or (self.instance.odometer if self.instance else None)
        # Get entry_date - either from data or existing record
        entry_date = data.get('entry_date') or (self.instance.entry_date if self.instance else None)
        
        # If this is updating existing record
        if self.instance:
            # Check odometer only if it or vehicle changed
            odometer_changed = 'odometer' in data and data['odometer'] != self.instance.odometer
            vehicle_changed = 'vehicle' in data and data['vehicle'] != self.instance.vehicle
            
            if odometer_changed or vehicle_changed:
                self._validate_odometer_monotonicity(
                    vehicle, 
                    odometer, 
                    entry_date,
                    exclude_id=self.instance.id
                )
        else:
            # For new record always check
            self._validate_odometer_monotonicity(vehicle, odometer, entry_date)
        
        return data
    
    def _validate_odometer_monotonicity(self, vehicle, odometer, entry_date, exclude_id=None):
        """
        Odometer monotonicity check.
        Odometer must be greater than all previous and less than all subsequent entries.
        """
        # Check that odometer is not less than initial value for vehicle
        if odometer <= vehicle.initial_odometer:
            raise serializers.ValidationError({
                'odometer': {
                    "code": "odometer_le_initial",
                    "message": f"Odometer reading must be greater than the vehicle's initial odometer ({vehicle.initial_odometer} km).",
                    "initial_odometer": vehicle.initial_odometer
                }
            })

        # Check previous entries (odometer must be greater)
        previous_entry = FuelEntryMetricsService.get_previous_entry(
            vehicle.id, 
            entry_date,
            entry_id=exclude_id
        )
        
        if previous_entry and odometer <= previous_entry.odometer:
            raise serializers.ValidationError({
                'odometer': {
                    "code": "odometer_le_previous",
                    "message": f"Odometer reading must be greater than the previous entry ({previous_entry.odometer} km on {previous_entry.entry_date}).",
                    "previous_odometer": previous_entry.odometer,
                    "previous_date": previous_entry.entry_date
                }
            })
        
        # Check subsequent entries (odometer must be less)
        next_entry = FuelEntryMetricsService.get_next_entry(
            vehicle.id,
            entry_date,
            entry_id=exclude_id
        )
        
        if next_entry and odometer >= next_entry.odometer:
            raise serializers.ValidationError({
                'odometer': {
                    "code": "odometer_ge_next",
                    "message": f"Odometer reading must be less than the next entry ({next_entry.odometer} km on {next_entry.entry_date}).",
                    "next_odometer": next_entry.odometer,
                    "next_date": next_entry.entry_date
                }
            })
