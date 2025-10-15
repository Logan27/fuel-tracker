# Fuel Tracker MVP Architecture (Django REST Framework)

## 🏗️ General Architecture

### Technology Stack

**Backend: Python + Django REST Framework (DRF)**
- **Reliability and development speed**: Django provides a powerful ORM, migration system, authentication, and an admin panel "out of the box".
- **DRF**: The de-facto standard for creating REST APIs in Django. It provides serialization, validation, authentication, and flexible view classes.
- **Ecosystem**: A huge number of time-tested libraries for any task.

**Database: PostgreSQL**
- Reliability, performance, and advanced features like JSONB and PostGIS. Integrates perfectly with Django.

**Caching: Redis**
- Used for caching database queries, serialization results, and sessions, which significantly speeds up API responses.

**Asynchronous Tasks: Celery + Redis/RabbitMQ**
- For performing background tasks, such as recalculating statistics after data updates or sending email notifications.

## 🏛️ Project Structure

The project will follow a standard Django application structure to ensure modularity and scalability.

```
fuel_tracker/
├── manage.py
├── fuel_tracker/      # Main project application
│   ├── __init__.py
│   ├── settings.py    # Settings
│   ├── urls.py        # Root URL config
│   └── wsgi.py
├── api/               # Application for the REST API
│   ├── __init__.py
│   ├── models.py      # Data models (User, Vehicle, FuelEntry)
│   ├── serializers.py # DRF serializers
│   ├── views.py       # ViewSets and API Views
│   ├── urls.py        # URL config for the API
│   ├── permissions.py # Custom permission classes
│   ├── services.py    # Business logic layer
│   └── tests/         # Tests for the API
├── core/              # Common utilities, custom fields, etc.
└── docs/              # Documentation
```

## 🧩 Key Django Components

- **Models (`models.py`)**: Define the data structure using the Django ORM. They are the single source of truth about fields, their types, and relationships.
- **Serializers (`serializers.py`)**: Convert complex data types, such as QuerySets and model instances, into native Python types that can then be easily rendered into JSON. They are also responsible for validating incoming data.
- **Views (`views.py`)**: Handle HTTP requests and return HTTP responses. We will use `ModelViewSet` from DRF for standard CRUD operations, which avoids writing repetitive code.
- **Services (`services.py`)**: A layer for encapsulating business logic. Views should not contain complex logic; they call methods from the service layer, which in turn works with models (ORM). This makes the code cleaner, more testable, and reusable.

## 📊 Data Schema (Django Models)

The database schema remains conceptually the same but is implemented through the Django ORM.

```python
# api/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    preferred_currency = models.CharField(max_length=3, default='USD')
    preferred_distance_unit = models.CharField(max_length=2, default='km') # 'km' or 'mi'
    preferred_volume_unit = models.CharField(max_length=3, default='L') # 'L' or 'gal'
    timezone = models.CharField(max_length=50, default='UTC')

class Vehicle(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    name = models.CharField(max_length=100)
    make = models.CharField(max_length=50, blank=True)
    model = models.CharField(max_length=50, blank=True)
    year = models.PositiveIntegerField(null=True, blank=True)
    fuel_type = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'name')

class FuelEntry(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_entries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fuel_entries')
    entry_date = models.DateField()
    odometer = models.PositiveIntegerField()
    station_name = models.CharField(max_length=100)
    fuel_brand = models.CharField(max_length=50)
    fuel_grade = models.CharField(max_length=20)
    liters = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(max_length=500, blank=True)

    # Cached/calculated fields
    unit_price = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    distance_since_last = models.IntegerField(null=True, blank=True)
    consumption_l_100km = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True)
    cost_per_km = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('vehicle', 'entry_date', 'odometer')
        ordering = ['-entry_date', '-created_at']
```

## ⚡ Performance Optimization (< 500ms)

### 1. DB Query Optimization
- **`select_related` and `prefetch_related`**: To reduce the number of SQL queries when fetching related objects (N+1 problem). `select_related` is used for `ForeignKey` and `OneToOneField` (performs a `JOIN`), while `prefetch_related` is for `ManyToManyField` and reverse `ForeignKey` (performs a separate `IN` query).

```python
# api/views.py
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer

    def get_queryset(self):
        # Optimization: get the user along with the vehicle in one query
        return self.queryset.filter(user=self.request.user).select_related('user')
```

- **`defer()` and `only()`**: To load only the necessary fields from the database.
- **Indexes**: Creating indexes in the `Meta` class of models for fields that are frequently used for filtering and sorting.

```python
# api/models.py
class FuelEntry(models.Model):
    # ... fields ...
    class Meta:
        indexes = [
            models.Index(fields=['vehicle', '-entry_date']),
            models.Index(fields=['user', '-entry_date']),
        ]
```

### 2. Caching
- **View-level Caching**: Using `@cache_page` decorators from Django to cache responses of entire pages/endpoints.
- **Granular Caching**: Caching the results of "heavy" computations or database queries using Django's low-level cache API.

```python
# api/services.py
from django.core.cache import cache

class DashboardService:
    def get_stats(self, user_id: int, vehicle_id: int, days: int):
        cache_key = f'dashboard:{user_id}:{vehicle_id}:{days}'
        stats = cache.get(cache_key)

        if stats is None:
            # "Heavy" DB query
            stats = FuelEntry.objects.filter(
                user_id=user_id,
                vehicle_id=vehicle_id,
                entry_date__gte=timezone.now() - timedelta(days=days)
            ).aggregate(
                total_spent=Sum('total_amount'),
                avg_consumption=Avg('consumption_l_100km')
                # ... other aggregates
            )
            cache.set(cache_key, stats, timeout=300) # Cache for 5 minutes

        return stats
```

### 3. Pagination
DRF provides powerful and flexible pagination classes. We will use `CursorPagination` for endpoints with infinite scrolling (refueling history), as it provides the best performance for large datasets.

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.CursorPagination',
    'PAGE_SIZE': 25
}
```

## 🔐 Security

### 1. Authentication and Authorization
- **Authentication**: `SessionAuthentication` with `HttpOnly` cookies will be used for protection against XSS and `CSRF` tokens, which is the recommended Django approach for web clients. `TokenAuthentication` can be easily added for mobile clients.
- **Authorization (Permissions)**: DRF provides permission classes. We will create a custom permission that checks if a user can only access their own objects (vehicles, records).

```python
# api/permissions.py
from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Allows access only to the owner of the object.
    """
    def has_object_permission(self, request, view, obj):
        # obj can be Vehicle, FuelEntry, etc.
        # All these models have a `user` field.
        return obj.user == request.user
```

### 2. Data Isolation (Row-Level Security)
This is a key security requirement. It will be implemented at the base `QuerySet` level in the `ViewSet`, ensuring that no query can retrieve another user's data.

```python
# api/views.py
class FuelEntryViewSet(viewsets.ModelViewSet):
    serializer_class = FuelEntrySerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        """
        This method ensures that the user sees only their own records.
        """
        return FuelEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        When creating a new record, it is automatically linked to the current user.
        """
        serializer.save(user=self.request.user)
```

### 3. Validation
DRF serializers are a powerful tool for validating incoming data. They automatically handle type checking, required fields, and can be extended for complex business rules.

```python
# api/serializers.py
class FuelEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelEntry
        fields = '__all__'
        read_only_fields = ('user', 'unit_price', 'distance_since_last', ...)

    def validate_odometer(self, value):
        """
        Checks that the odometer value is greater than the previous one for the given vehicle.
        """
        vehicle = self.context['view'].get_object().vehicle if self.instance else self.context['request'].data.get('vehicle')
        last_entry = FuelEntry.objects.filter(vehicle=vehicle).order_by('-entry_date').first()
        if last_entry and value <= last_entry.odometer:
            raise serializers.ValidationError("Odometer reading must be greater than the previous entry.")
        return value
```

### 4. Compliance and Data Management

To meet GDPR requirements and give users control over their data, the following features will be implemented:

- **Account Deletion**: An endpoint `DELETE /api/users/me/` will be created to perform a full (hard-delete) of the user and all associated data (vehicles, fuel entries).
- **Data Export**: An endpoint `GET /api/users/me/export/` will allow the user to download all their data in CSV format.

## 🚦 Error Handling

To ensure reliability and provide consistent responses to clients, a centralized error handling system will be implemented.

- **Hiding Stack Traces**: In production mode (`DEBUG=False`), Django automatically hides detailed stack traces.
- **Custom Exception Handler**: A custom exception handler will be configured in DRF. This will allow all error responses to be formatted in a unified style, for example:
  ```json
  {
    "errors": [
      {
        "status": "400",
        "code": "validation_error",
        "detail": "Odometer reading must be greater than the previous entry."
      }
    ]
  }
  ```
  This will be done by setting `EXCEPTION_HANDLER` in the `REST_FRAMEWORK` settings.

## 📜 Logging and Monitoring

To meet observability and security requirements, a detailed logging system will be configured.

- **Correlation ID**: A special middleware will be created that generates a unique `correlation_id` for each incoming request. This ID will be available throughout the request lifecycle and will be automatically added to all logs.
- **Logger Configuration**: The standard Python logger will be configured to include `correlation_id` and `user.id` (if the user is authenticated) in each entry. This will make it easy to trace the chain of events for a specific request or user.
- **Security Event Logging**: Key events such as successful login, failed login attempts, and password reset requests will be explicitly logged with an `INFO` or `WARNING` level for subsequent auditing.

## 🐳 Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: fuel_tracker
      POSTGRES_USER: fuel_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeMe123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fuel_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    command: >
      sh -c "python manage.py migrate &&
             python manage.py runserver 0.0.0.0:8000"
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=postgres
      - DB_NAME=fuel_tracker
      - DB_USER=fuel_user
      - DB_PASS=${DB_PASSWORD:-changeMe123}
      - REDIS_HOST=redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
```

### Dockerfile
```dockerfile
# Specify the base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the project code
COPY . /app/

# Expose the port
EXPOSE 8000
```
This architecture based on Django REST Framework provides a reliable, secure, and scalable foundation for the MVP, following Django's best practices and principles.