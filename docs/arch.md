# Архитектура Fuel Tracker MVP (Django REST Framework)

## 🏗️ Общая архитектура

### Стек технологий

**Backend: Python + Django REST Framework (DRF)**
- **Надежность и скорость разработки**: Django предоставляет мощную ORM, систему миграций, аутентификацию и админ-панель "из коробки".
- **DRF**: Стандарт де-факто для создания REST API на Django. Обеспечивает сериализацию, валидацию, аутентификацию и гибкие классы представлений (Views).
- **Экосистема**: Огромное количество проверенных временем библиотек для любых задач.

**База данных: PostgreSQL**
- Надежность, производительность и расширенные возможности, такие как JSONB и PostGIS. Отлично интегрируется с Django.

**Кэширование: Redis**
- Используется для кэширования запросов к базе данных, результатов сериализации и сессий, что значительно ускоряет ответы API.

**Асинхронные задачи: Celery + Redis/RabbitMQ**
- Для выполнения фоновых задач, таких как пересчет статистики после обновления данных или отправка email-уведомлений.

## 🏛️ Структура проекта

Проект будет следовать общепринятой структуре Django-приложений для обеспечения модульности и масштабируемости.

```
fuel_tracker/
├── manage.py
├── fuel_tracker/      # Основное приложение проекта
│   ├── __init__.py
│   ├── settings.py    # Настройки
│   ├── urls.py        # Корневой URL-конфиг
│   └── wsgi.py
├── api/               # Приложение для REST API
│   ├── __init__.py
│   ├── models.py      # Модели данных (User, Vehicle, FuelEntry)
│   ├── serializers.py # Сериализаторы DRF
│   ├── views.py       # ViewSets и API Views
│   ├── urls.py        # URL-конфиг для API
│   ├── permissions.py # Кастомные классы прав доступа
│   ├── services.py    # Слой бизнес-логики
│   └── tests/         # Тесты для API
├── core/              # Общие утилиты, кастомные поля и т.д.
└── docs/              # Документация
```

## 🧩 Ключевые компоненты Django

- **Models (`models.py`)**: Определяют структуру данных с помощью Django ORM. Являются единственным источником правды о полях, их типах и связях.
- **Serializers (`serializers.py`)**: Преобразуют сложные типы данных, такие как QuerySets и экземпляры моделей, в нативные типы Python, которые затем легко рендерятся в JSON. Также отвечают за валидацию входящих данных.
- **Views (`views.py`)**: Обрабатывают HTTP-запросы и возвращают HTTP-ответы. Мы будем использовать `ModelViewSet` из DRF для стандартных CRUD-операций, что позволяет избежать написания повторяющегося кода.
- **Services (`services.py`)**: Слой для инкапсуляции бизнес-логики. View не должны содержать сложную логику; они вызывают методы из сервисного слоя, который, в свою очередь, работает с моделями (ORM). Это делает код более чистым, тестируемым и переиспользуемым.

## 📊 Схема данных (Django Models)

Схема базы данных остается концептуально той же, но реализуется через Django ORM.

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

    # Кэшируемые/вычисляемые поля
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

## ⚡ Оптимизация производительности (< 500ms)

### 1. Оптимизация запросов к БД
- **`select_related` и `prefetch_related`**: Для уменьшения количества SQL-запросов при выборке связанных объектов (N+1 проблема). `select_related` используется для `ForeignKey` и `OneToOneField` (делает `JOIN`), а `prefetch_related` — для `ManyToManyField` и обратных `ForeignKey` (делает отдельный `IN` запрос).

```python
# api/views.py
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer

    def get_queryset(self):
        # Оптимизация: получаем пользователя вместе с автомобилем одним запросом
        return self.queryset.filter(user=self.request.user).select_related('user')
```

- **`defer()` и `only()`**: Для загрузки только необходимых полей из базы данных.
- **Индексы**: Создание индексов в `Meta` классе моделей для полей, которые часто используются для фильтрации и сортировки.

```python
# api/models.py
class FuelEntry(models.Model):
    # ... поля ...
    class Meta:
        indexes = [
            models.Index(fields=['vehicle', '-entry_date']),
            models.Index(fields=['user', '-entry_date']),
        ]
```

### 2. Кэширование
- **Кэширование на уровне View**: Использование декораторов `@cache_page` от Django для кэширования ответов целых страниц/эндпоинтов.
- **Гранулярное кэширование**: Кэширование результатов "тяжелых" вычислений или запросов к БД с помощью низкоуровневого API кэша Django.

```python
# api/services.py
from django.core.cache import cache

class DashboardService:
    def get_stats(self, user_id: int, vehicle_id: int, days: int):
        cache_key = f'dashboard:{user_id}:{vehicle_id}:{days}'
        stats = cache.get(cache_key)

        if stats is None:
            # "Тяжелый" запрос к БД
            stats = FuelEntry.objects.filter(
                user_id=user_id,
                vehicle_id=vehicle_id,
                entry_date__gte=timezone.now() - timedelta(days=days)
            ).aggregate(
                total_spent=Sum('total_amount'),
                avg_consumption=Avg('consumption_l_100km')
                # ... другие агрегаты
            )
            cache.set(cache_key, stats, timeout=300) # Кэш на 5 минут

        return stats
```

### 3. Пагинация
DRF предоставляет мощные и гибкие классы пагинации. Мы будем использовать `CursorPagination` для эндпоинтов с бесконечной прокруткой (история заправок), так как он обеспечивает наилучшую производительность для больших наборов данных.

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.CursorPagination',
    'PAGE_SIZE': 25
}
```

## 🔐 Безопасность

### 1. Аутентификация и авторизация
- **Аутентификация**: Будет использоваться `SessionAuthentication` с `HttpOnly` cookies для защиты от XSS и `CSRF` токенами, что является рекомендуемым Django подходом для веб-клиентов. Для мобильных клиентов можно легко добавить `TokenAuthentication`.
- **Авторизация (Permissions)**: DRF предоставляет классы прав доступа. Мы создадим кастомный permission, который будет проверять, что пользователь может получить доступ только к своим собственным объектам (автомобилям, записям).

```python
# api/permissions.py
from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Разрешает доступ только владельцу объекта.
    """
    def has_object_permission(self, request, view, obj):
        # obj может быть Vehicle, FuelEntry и т.д.
        # У всех этих моделей есть поле `user`.
        return obj.user == request.user
```

### 2. Изоляция данных (Row-Level Security)
Это ключевое требование безопасности. Оно будет реализовано на уровне базовых `QuerySet` в `ViewSet`, гарантируя, что ни один запрос не сможет получить данные другого пользователя.

```python
# api/views.py
class FuelEntryViewSet(viewsets.ModelViewSet):
    serializer_class = FuelEntrySerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        """
        Этот метод гарантирует, что пользователь видит только свои записи.
        """
        return FuelEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        При создании новой записи, она автоматически привязывается к текущему пользователю.
        """
        serializer.save(user=self.request.user)
```

### 3. Валидация
Сериализаторы DRF являются мощным инструментом для валидации входящих данных. Они автоматически обрабатывают проверку типов, обязательных полей и могут быть расширены для сложных бизнес-правил.

```python
# api/serializers.py
class FuelEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelEntry
        fields = '__all__'
        read_only_fields = ('user', 'unit_price', 'distance_since_last', ...)

    def validate_odometer(self, value):
        """
        Проверяет, что значение одометра больше предыдущего для данного автомобиля.
        """
        vehicle = self.context['view'].get_object().vehicle if self.instance else self.context['request'].data.get('vehicle')
        last_entry = FuelEntry.objects.filter(vehicle=vehicle).order_by('-entry_date').first()
        if last_entry and value <= last_entry.odometer:
            raise serializers.ValidationError("Odometer reading must be greater than the previous entry.")
        return value
```

### 4. Соответствие требованиям (Compliance) и управление данными

Для выполнения требований GDPR и предоставления пользователям контроля над своими данными будут реализованы следующие функции:

- **Удаление аккаунта**: Будет создан эндпоинт `DELETE /api/users/me/`, который выполнит полное (hard-delete) удаление пользователя и всех связанных с ним данных (автомобили, записи о заправках).
- **Экспорт данных**: Эндпоинт `GET /api/users/me/export/` позволит пользователю скачать все свои данные в формате CSV.

## 🚦 Обработка ошибок

Для обеспечения надежности и предоставления клиентам консистентных ответов будет реализована централизованная обработка ошибок.

- **Сокрытие стектрейсов**: В продакшн-режиме (`DEBUG=False`) Django автоматически скрывает детальные стектрейсы.
- **Кастомный обработчик исключений**: Будет настроен кастомный обработчик исключений в DRF. Это позволит форматировать все ответы об ошибках в едином стиле, например:
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
  Это будет сделано путем установки `EXCEPTION_HANDLER` в настройках `REST_FRAMEWORK`.

## 📜 Логирование и Мониторинг

Для соответствия требованиям по наблюдаемости (observability) и безопасности будет настроена детальная система логирования.

- **Correlation ID**: Будет создано специальное middleware, которое генерирует уникальный `correlation_id` для каждого входящего запроса. Этот ID будет доступен на протяжении всего жизненного цикла запроса и будет автоматически добавляться во все логи.
- **Конфигурация логгера**: Стандартный логгер Python будет настроен так, чтобы включать в каждую запись `correlation_id` и `user.id` (если пользователь аутентифицирован). Это позволит легко отслеживать цепочку событий для конкретного запроса или пользователя.
- **Логирование событий безопасности**: Ключевые события, такие как успешный вход, неудачная попытка входа и запрос на сброс пароля, будут явно логироваться с уровнем `INFO` или `WARNING` для последующего аудита.

## 🐳 Docker конфигурация

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
# Указываем базовый образ
FROM python:3.11-slim

# Устанавливаем переменные окружения
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем зависимости
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код проекта
COPY . /app/

# Открываем порт
EXPOSE 8000
```
Эта архитектура на базе Django REST Framework обеспечивает надежную, безопасную и масштабируемую основу для MVP, следуя лучшим практикам и принципам Django.