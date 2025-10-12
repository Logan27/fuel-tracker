from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    display_name = models.CharField(max_length=100, blank=True, default='')
    preferred_currency = models.CharField(max_length=3, default='USD')
    preferred_distance_unit = models.CharField(max_length=2, default='km', choices=[('km', 'Kilometers'), ('mi', 'Miles')])
    preferred_volume_unit = models.CharField(max_length=3, default='L', choices=[('L', 'Liters'), ('gal', 'Gallons')])
    timezone = models.CharField(max_length=50, default='UTC')
    price_precision = models.IntegerField(default=2, choices=[(2, '2 decimals'), (3, '3 decimals')])
    
    # Security: Account lockout mechanism
    failed_login_attempts = models.IntegerField(default=0, help_text="Number of consecutive failed login attempts")
    locked_until = models.DateTimeField(null=True, blank=True, help_text="Account locked until this timestamp")

    def __str__(self):
        return self.email
    
    def get_display_name(self):
        """Return display_name if set, otherwise first_name + last_name, otherwise email"""
        if self.display_name:
            return self.display_name
        if self.first_name or self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.email