from django.db import models
from django.conf import settings


class Vehicle(models.Model):
    """
    Модель автомобиля пользователя
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vehicles')
    name = models.CharField(max_length=100, help_text="Название/идентификатор автомобиля")
    make = models.CharField(max_length=50, blank=True, help_text="Производитель")
    model = models.CharField(max_length=50, blank=True, help_text="Модель")
    year = models.PositiveIntegerField(null=True, blank=True, help_text="Год выпуска")
    fuel_type = models.CharField(max_length=20, blank=True, help_text="Тип топлива")
    is_active = models.BooleanField(default=True, help_text="Активен ли автомобиль")
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
    Модель записи о заправке
    Хранит данные в метрических единицах (км, литры)
    """
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_entries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fuel_entries')
    
    # Основные данные о заправке
    entry_date = models.DateField(help_text="Дата заправки")
    odometer = models.PositiveIntegerField(help_text="Показания одометра в км")
    station_name = models.CharField(max_length=100, help_text="Название АЗС")
    fuel_brand = models.CharField(max_length=50, help_text="Бренд топлива")
    fuel_grade = models.CharField(max_length=20, help_text="Марка/октановое число топлива")
    liters = models.DecimalField(max_digits=10, decimal_places=2, help_text="Количество литров")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Общая стоимость")
    notes = models.TextField(max_length=500, blank=True, help_text="Заметки")

    # Вычисляемые поля (заполняются автоматически)
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=3, 
        null=True, 
        blank=True,
        help_text="Цена за литр"
    )
    distance_since_last = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Расстояние с предыдущей заправки (км)"
    )
    consumption_l_100km = models.DecimalField(
        max_digits=5, 
        decimal_places=1, 
        null=True, 
        blank=True,
        help_text="Расход л/100км"
    )
    cost_per_km = models.DecimalField(
        max_digits=10, 
        decimal_places=4, 
        null=True, 
        blank=True,
        help_text="Стоимость за км"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-entry_date', '-created_at']
        unique_together = ('vehicle', 'entry_date', 'odometer')
        indexes = [
            # Для фильтрации по пользователю и сортировки по дате
            models.Index(fields=['user', '-entry_date']),
            # Для фильтрации по автомобилю и сортировки по дате
            models.Index(fields=['vehicle', '-entry_date']),
            # Для проверки монотонности одометра
            models.Index(fields=['vehicle', 'odometer']),
            # Для статистических запросов (фильтрация по пользователю и диапазону дат)
            models.Index(fields=['user', 'entry_date']),
            # Для статистических запросов (фильтрация по автомобилю и диапазону дат)
            models.Index(fields=['vehicle', 'entry_date']),
            # Для агрегатов по метрикам (исключение NULL значений)
            models.Index(fields=['user', 'entry_date', 'consumption_l_100km']),
            # Для статистики по брендам (пользователь + бренд + метрики)
            models.Index(fields=['user', 'fuel_brand', 'consumption_l_100km']),
            # Для статистики по маркам (пользователь + марка + метрики)
            models.Index(fields=['user', 'fuel_grade', 'consumption_l_100km']),
            # Для статистики по брендам для конкретного автомобиля
            models.Index(fields=['vehicle', 'fuel_brand', 'consumption_l_100km']),
            # Для статистики по маркам для конкретного автомобиля
            models.Index(fields=['vehicle', 'fuel_grade', 'consumption_l_100km']),
        ]

    def __str__(self):
        return f"{self.vehicle.name} - {self.entry_date} ({self.odometer} km)"
