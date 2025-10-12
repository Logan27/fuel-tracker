# OpenAPI (Swagger) Documentation Guide

## Доступ к документации API

После запуска проекта (`docker-compose up` или локально) документация доступна по следующим адресам:

### Swagger UI (интерактивная документация)
```
http://localhost:8000/api/v1/schema/swagger-ui/
```

Swagger UI предоставляет:
- Интерактивный интерфейс для тестирования API
- Полное описание всех эндпоинтов
- Возможность выполнять запросы прямо из браузера
- Примеры запросов и ответов

### ReDoc (альтернативный просмотр)
```
http://localhost:8000/api/v1/schema/redoc/
```

ReDoc предоставляет:
- Более компактное отображение документации
- Удобную навигацию по разделам
- Поиск по документации

### OpenAPI Schema (YAML)
```
http://localhost:8000/api/v1/schema/
```

Возвращает сырую OpenAPI 3.0 схему в YAML формате, которую можно:
- Импортировать в Postman
- Использовать для генерации клиентского кода
- Интегрировать с другими инструментами

## Генерация схемы в файл

Для генерации OpenAPI схемы в файл:

```bash
python manage.py spectacular --color --file schema.yml
```

Или из виртуального окружения:

```bash
.\venv\Scripts\python.exe manage.py spectacular --color --file schema.yml
```

## Структура API документации

API разделён на следующие группы (tags):

### 1. Authentication
- `POST /api/v1/auth/signup` - Регистрация нового пользователя
- `POST /api/v1/auth/signin` - Вход в систему
- `POST /api/v1/auth/signout` - Выход из системы

### 2. Users
- `GET /api/v1/users/me` - Получить профиль пользователя
- `PATCH /api/v1/users/me` - Обновить профиль пользователя
- `GET /api/v1/users/me/export` - Экспорт данных (GDPR)
- `DELETE /api/v1/users/me` - Удаление аккаунта (GDPR)

### 3. Vehicles
- `GET /api/v1/vehicles` - Список автомобилей
- `POST /api/v1/vehicles` - Создать автомобиль
- `GET /api/v1/vehicles/{id}` - Получить детали автомобиля
- `PATCH /api/v1/vehicles/{id}` - Обновить автомобиль
- `DELETE /api/v1/vehicles/{id}` - Удалить автомобиль

### 4. Fuel Entries
- `GET /api/v1/fuel-entries` - Список заправок (с пагинацией)
- `POST /api/v1/fuel-entries` - Создать запись о заправке
- `GET /api/v1/fuel-entries/{id}` - Получить детали заправки
- `PATCH /api/v1/fuel-entries/{id}` - Обновить заправку
- `DELETE /api/v1/fuel-entries/{id}` - Удалить заправку

### 5. Statistics
- `GET /api/v1/statistics/dashboard` - Статистика дашборда

## Использование Swagger UI

### Аутентификация

API использует сессионную аутентификацию. Для тестирования через Swagger UI:

1. Откройте Swagger UI: `http://localhost:8000/api/v1/schema/swagger-ui/`
2. Найдите эндпоинт **Authentication → Sign in**
3. Нажмите "Try it out"
4. Введите email и password
5. Нажмите "Execute"
6. После успешного входа cookie сессии будет сохранён в браузере
7. Теперь можно выполнять запросы к защищённым эндпоинтам

### Тестирование эндпоинтов

1. Выберите нужный эндпоинт
2. Нажмите "Try it out"
3. Заполните параметры запроса (query, body)
4. Нажмите "Execute"
5. Просмотрите ответ в разделе "Responses"

### Примеры использования

#### Создание автомобиля
```
POST /api/v1/vehicles
Content-Type: application/json

{
  "name": "My Car",
  "make": "Toyota",
  "model": "Camry",
  "year": 2020,
  "fuel_type": "Gasoline"
}
```

#### Создание записи о заправке
```
POST /api/v1/fuel-entries
Content-Type: application/json

{
  "vehicle": 1,
  "entry_date": "2025-01-15",
  "odometer": 50000,
  "station_name": "Shell",
  "fuel_brand": "Shell",
  "fuel_grade": "95",
  "liters": 45.5,
  "total_amount": 2500.00,
  "notes": "Full tank"
}
```

#### Получение статистики
```
GET /api/v1/statistics/dashboard?period=30d&vehicle=1
```

## Импорт в Postman

1. Скачайте схему: `http://localhost:8000/api/v1/schema/`
2. Откройте Postman
3. File → Import
4. Выберите скачанный файл `schema.yml`
5. Postman автоматически создаст коллекцию со всеми эндпоинтами

## Настройка drf-spectacular

Настройки находятся в `fuel_tracker/settings.py`:

```python
SPECTACULAR_SETTINGS = {
    'TITLE': 'Fuel Tracker API',
    'DESCRIPTION': '...',
    'VERSION': '1.0.0',
    'TAGS': [...],
    # Другие настройки
}
```

## Добавление документации к новым эндпоинтам

### Для ViewSets

```python
from drf_spectacular.utils import extend_schema, extend_schema_view

@extend_schema_view(
    list=extend_schema(
        summary="List items",
        description="Detailed description",
        tags=['MyTag'],
    ),
    create=extend_schema(
        summary="Create item",
        tags=['MyTag'],
    ),
)
class MyViewSet(viewsets.ModelViewSet):
    ...
```

### Для function-based views

```python
from drf_spectacular.utils import extend_schema, OpenApiParameter

@extend_schema(
    summary="My endpoint",
    description="Detailed description",
    tags=['MyTag'],
    parameters=[
        OpenApiParameter(
            name='param',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='Parameter description',
        ),
    ],
    responses={200: MySerializer},
)
@api_view(['GET'])
def my_view(request):
    ...
```

## Полезные ссылки

- [drf-spectacular документация](https://drf-spectacular.readthedocs.io/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/) - для редактирования схемы

