from django.db import models
from django.conf import settings


class Vehicle(models.Model):
    """
    User's vehicle model
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vehicles')
    name = models.CharField(max_length=100, help_text="Name/identifier of the vehicle")
    make = models.CharField(max_length=50, blank=True, help_text="Manufacturer")
    model = models.CharField(max_length=50, blank=True, help_text="Model")
    year = models.PositiveIntegerField(null=True, blank=True, help_text="Year of manufacture")
    initial_odometer = models.PositiveIntegerField(default=0, help_text="Initial odometer reading in km")
    fuel_type = models.CharField(max_length=20, blank=True, help_text="Fuel type")
    is_active = models.BooleanField(default=True, help_text="Is the vehicle active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'name')
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.email})"


class FuelEntry(models.Model):
    """
    Fuel entry model
    Stores data in metric units (km, liters)
    """
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_entries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fuel_entries')
    
    # Basic refueling data
    entry_date = models.DateField(help_text="Date of refueling")
    odometer = models.PositiveIntegerField(help_text="Odometer reading in km")
    station_name = models.CharField(max_length=100, help_text="Gas station name")
    fuel_brand = models.CharField(max_length=50, help_text="Fuel brand")
    fuel_grade = models.CharField(max_length=20, help_text="Fuel grade/octane rating")
    liters = models.DecimalField(max_digits=10, decimal_places=2, help_text="Number of liters")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total cost")
    notes = models.TextField(max_length=500, blank=True, help_text="Notes")

    # Calculated fields (filled in automatically)
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=3, 
        null=True, 
        blank=True,
        help_text="Price per liter"
    )
    distance_since_last = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Distance since last refueling (km)"
    )
    consumption_l_100km = models.DecimalField(
        max_digits=5, 
        decimal_places=1, 
        null=True, 
        blank=True,
        help_text="Consumption L/100km"
    )
    cost_per_km = models.DecimalField(
        max_digits=10, 
        decimal_places=4, 
        null=True, 
        blank=True,
        help_text="Cost per km"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-entry_date', '-created_at']
        unique_together = ('vehicle', 'entry_date', 'odometer')
        indexes = [
            # For filtering by user and sorting by date
            models.Index(fields=['user', '-entry_date']),
            # For filtering by vehicle and sorting by date
            models.Index(fields=['vehicle', '-entry_date']),
            # For checking the monotonicity of the odometer
            models.Index(fields=['vehicle', 'odometer']),
            # For statistical queries (filtering by user and date range)
            models.Index(fields=['user', 'entry_date']),
            # For statistical queries (filtering by vehicle and date range)
            models.Index(fields=['vehicle', 'entry_date']),
            # For metric aggregates (excluding NULL values)
            models.Index(fields=['user', 'entry_date', 'consumption_l_100km']),
            # For statistics by brand (user + brand + metrics)
            models.Index(fields=['user', 'fuel_brand', 'consumption_l_100km']),
            # For statistics by grade (user + grade + metrics)
            models.Index(fields=['user', 'fuel_grade', 'consumption_l_100km']),
            # For statistics by brand for a specific vehicle
            models.Index(fields=['vehicle', 'fuel_brand', 'consumption_l_100km']),
            # For statistics by grade for a specific vehicle
            models.Index(fields=['vehicle', 'fuel_grade', 'consumption_l_100km']),
        ]

    def __str__(self):
        return f"{self.vehicle.name} - {self.entry_date} ({self.odometer} km)"
