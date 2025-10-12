from rest_framework import serializers
from django.utils import timezone
import bleach
from .models import Vehicle, FuelEntry
from .services import FuelEntryMetricsService


def sanitize_text_input(value):
    """
    Санитизация текстового input для защиты от XSS.
    Удаляет все HTML теги и scripts.
    """
    if not value:
        return value
    # Удаляем все HTML теги, оставляем только текст
    cleaned = bleach.clean(value, tags=[], strip=True)
    return cleaned.strip()


# Serializers for Statistics API responses
class TimeSeriesPointSerializer(serializers.Serializer):
    """Сериализатор для одной точки временного ряда"""
    date = serializers.DateField()
    value = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)


class TimeSeriesDataSerializer(serializers.Serializer):
    """Сериализатор для временных рядов (consumption, unit_price)"""
    consumption = TimeSeriesPointSerializer(many=True, required=False)
    unit_price = TimeSeriesPointSerializer(many=True, required=False)


class PeriodSerializer(serializers.Serializer):
    """Сериализатор для описания периода статистики"""
    type = serializers.CharField()
    date_after = serializers.DateField()
    date_before = serializers.DateField()


class DashboardAggregatesSerializer(serializers.Serializer):
    """Сериализатор для агрегированных метрик дашборда"""
    average_consumption = serializers.DecimalField(max_digits=5, decimal_places=1, allow_null=True)
    average_unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    total_distance = serializers.IntegerField(allow_null=True)
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    average_cost_per_km = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True)
    total_liters = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    fill_up_count = serializers.IntegerField(allow_null=True)
    average_distance_per_day = serializers.DecimalField(max_digits=10, decimal_places=1, allow_null=True)


class DashboardStatisticsResponseSerializer(serializers.Serializer):
    """Сериализатор для ответа эндпоинта dashboard statistics"""
    period = PeriodSerializer()
    aggregates = DashboardAggregatesSerializer()
    time_series = TimeSeriesDataSerializer()


class BrandStatisticsSerializer(serializers.Serializer):
    """Сериализатор для статистики по бренду топлива"""
    brand = serializers.CharField()
    average_consumption = serializers.DecimalField(max_digits=5, decimal_places=1, allow_null=True)
    average_unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    average_cost_per_km = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True)
    fill_count = serializers.IntegerField()


class GradeStatisticsSerializer(serializers.Serializer):
    """Сериализатор для статистики по марке топлива"""
    grade = serializers.CharField()
    average_consumption = serializers.DecimalField(max_digits=5, decimal_places=1, allow_null=True)
    average_unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    average_cost_per_km = serializers.DecimalField(max_digits=10, decimal_places=4, allow_null=True)
    fill_count = serializers.IntegerField()


class VehicleSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Vehicle"""
    
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
            'fuel_type', 
            'is_active', 
            'created_at', 
            'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate_name(self, value):
        """XSS Protection: санитизация имени автомобиля"""
        return sanitize_text_input(value)
    
    def validate_make(self, value):
        """XSS Protection: санитизация производителя"""
        return sanitize_text_input(value)
    
    def validate_model(self, value):
        """XSS Protection: санитизация модели"""
        return sanitize_text_input(value)
    
    def validate_fuel_type(self, value):
        """XSS Protection: санитизация типа топлива"""
        return sanitize_text_input(value)


class FuelEntrySerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели FuelEntry.
    
    Валидация:
    - Одометр должен строго возрастать для каждого автомобиля
    - Дата не может быть в будущем
    - Liters и total_amount должны быть > 0
    - XSS санитизация всех текстовых полей
    """
    vehicle_id = serializers.IntegerField(source='vehicle.id', read_only=True)
    vehicle = serializers.PrimaryKeyRelatedField(
        queryset=Vehicle.objects.all(),
        write_only=True
    )
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    # Явная валидация текстовых полей
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
            # Вычисляемые поля (read-only)
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
        """Дата не может быть в будущем"""
        if value > timezone.now().date():
            raise serializers.ValidationError(
                "Entry date cannot be in the future."
            )
        return value
    
    def validate_liters(self, value):
        """Количество литров должно быть > 0"""
        if value <= 0:
            raise serializers.ValidationError(
                "Liters must be greater than zero."
            )
        return value
    
    def validate_total_amount(self, value):
        """Сумма должна быть > 0"""
        if value <= 0:
            raise serializers.ValidationError(
                "Total amount must be greater than zero."
            )
        return value
    
    def validate_odometer(self, value):
        """Одометр должен быть > 0"""
        if value <= 0:
            raise serializers.ValidationError(
                "Odometer reading must be greater than zero."
            )
        return value
    
    def validate_station_name(self, value):
        """XSS Protection: санитизация названия станции"""
        return sanitize_text_input(value)
    
    def validate_fuel_brand(self, value):
        """XSS Protection: санитизация бренда топлива"""
        return sanitize_text_input(value)
    
    def validate_fuel_grade(self, value):
        """XSS Protection: санитизация марки топлива"""
        return sanitize_text_input(value)
    
    def validate_notes(self, value):
        """XSS Protection: санитизация заметок"""
        return sanitize_text_input(value)
    
    def validate(self, data):
        """
        Валидация одометра: должен строго возрастать для автомобиля.
        """
        # Получаем vehicle - либо из данных, либо из существующей записи
        vehicle = data.get('vehicle') or (self.instance.vehicle if self.instance else None)
        # Получаем odometer - либо из данных, либо из существующей записи
        odometer = data.get('odometer') or (self.instance.odometer if self.instance else None)
        # Получаем entry_date - либо из данных, либо из существующей записи
        entry_date = data.get('entry_date') or (self.instance.entry_date if self.instance else None)
        
        # Если это обновление существующей записи
        if self.instance:
            # Проверяем одометр только если он или vehicle изменились
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
            # Для новой записи всегда проверяем
            self._validate_odometer_monotonicity(vehicle, odometer, entry_date)
        
        return data
    
    def _validate_odometer_monotonicity(self, vehicle, odometer, entry_date, exclude_id=None):
        """
        Проверка монотонности одометра.
        Одометр должен быть больше всех предыдущих и меньше всех последующих записей.
        """
        # Проверка предыдущих записей (одометр должен быть больше)
        previous_entry = FuelEntryMetricsService.get_previous_entry(
            vehicle.id, 
            entry_date,
            before_id=exclude_id
        )
        
        if previous_entry and odometer <= previous_entry.odometer:
            raise serializers.ValidationError({
                'odometer': f"Odometer reading must be greater than the previous entry ({previous_entry.odometer} km on {previous_entry.entry_date})."
            })
        
        # Проверка последующих записей (одометр должен быть меньше)
        next_entry = FuelEntryMetricsService.get_next_entry(
            vehicle.id,
            entry_date,
            after_id=exclude_id
        )
        
        if next_entry and odometer >= next_entry.odometer:
            raise serializers.ValidationError({
                'odometer': f"Odometer reading must be less than the next entry ({next_entry.odometer} km on {next_entry.entry_date})."
            })

