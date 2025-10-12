# REST API Documentation – Fuel Tracker Backend (v1)

## Общие сведения

**Базовый URL:** `/api/v1/`

**Формат данных:** JSON

**Аутентификация:** Сессионная (`HttpOnly` cookie с CSRF-токеном)

**Кодировка:** UTF-8

**Временные зоны:** Все даты и времена передаются и хранятся в UTC.

---

## Аутентификация

Для аутентифицированных запросов клиент должен отправлять cookie сессии, полученные при логине. Для `POST/PATCH/DELETE` запросов также требуется `X-CSRFToken` заголовок.

---

## Формат ошибок

Все ошибки (4xx, 5xx) возвращаются в стандартизированном формате для обеспечения консистентности.

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
*   **status**: HTTP-статус код.
*   **code**: Машиночитаемый код ошибки.
*   **detail**: Человекочитаемое описание ошибки.

---

## 1. Authentication

### 1.1. Sign Up (Регистрация)

**Endpoint:** `POST /api/v1/auth/signup`

**Аутентификация:** Не требуется

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (201 Created):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com"
}
```

### 1.2. Sign In (Вход)

**Endpoint:** `POST /api/v1/auth/signin`

**Аутентификация:** Не требуется

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200 OK):** Профиль пользователя (см. 2.1). Устанавливает `sessionid` cookie.

### 1.3. Sign Out (Выход)

**Endpoint:** `POST /api/v1/auth/signout`

**Аутентификация:** Требуется

**Success Response (204 No Content):** Тело ответа пустое. Сессия завершается.

---

## 2. User Profile & GDPR

### 2.1. Get User Profile (Получить профиль)

**Endpoint:** `GET /api/v1/users/me`

**Аутентификация:** Требуется

**Success Response (200 OK):**
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "preferred_currency": "USD",
  "preferred_distance_unit": "km",
  "preferred_volume_unit": "L",
  "timezone": "America/New_York"
}
```

### 2.2. Update User Profile (Обновить профиль)

**Endpoint:** `PATCH /api/v1/users/me`

**Аутентификация:** Требуется

**Request Body:** (Все поля опциональны)
```json
{
  "preferred_currency": "EUR",
  "preferred_distance_unit": "mi"
}
```

**Success Response (200 OK):** Обновленный профиль пользователя.

### 2.3. **(GDPR)** Export User Data (Экспорт данных)

**Endpoint:** `GET /api/v1/users/me/export`

**Аутентификация:** Требуется

**Success Response (200 OK):**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="export.csv"`
- Тело ответа: CSV файл со всеми данными пользователя (автомобили, записи о заправках).

### 2.4. **(GDPR)** Delete Account (Удаление аккаунта)

**Endpoint:** `DELETE /api/v1/users/me`

**Аутентификация:** Требуется

**Success Response (204 No Content):** Тело ответа пустое. Все данные пользователя и связанные с ними записи безвозвратно удаляются.

---

## 3. Vehicles

Реализует стандартные CRUD операции для автомобилей.

- `GET /api/v1/vehicles` - Список автомобилей
- `POST /api/v1/vehicles` - Создать автомобиль
- `GET /api/v1/vehicles/{id}` - Получить детали
- `PATCH /api/v1/vehicles/{id}` - Обновить
- `DELETE /api/v1/vehicles/{id}` - Удалить

---

## 4. Fuel Entries

### 4.1. List Fuel Entries (Список заправок)

**Endpoint:** `GET /api/v1/fuel-entries`

**Аутентификация:** Требуется

**Пагинация:** `CursorPagination`

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `limit` | integer | Количество записей (по умолчанию 25) |
| `cursor` | string | Курсор для следующей/предыдущей страницы |
| `vehicle`| integer | Фильтр по ID автомобиля |
| `date_after` | string (ISO date) | Начало диапазона дат |
| `date_before` | string (ISO date) | Конец диапазона дат |

**Success Response (200 OK):**
```json
{
  "next": "http://api.example.org/fuel-entries/?cursor=cD0yMDI1LTAxLTE1...",
  "previous": null,
  "results": [
    {
      "id": 1,
      "vehicle_id": 1,
      "user_id": "abc123",
      "entry_date": "2025-01-15",
      "odometer": 50000,
      "station_name": "Shell Station 94",
      "fuel_brand": "Shell",
      "fuel_grade": "95",
      "liters": 45.5,
      "total_amount": 65.50,
      "notes": "",
      "unit_price": 1.44,
      "distance_since_last": 450,
      "consumption_l_100km": 10.1,
      "cost_per_km": 0.15,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Важно:** При чтении (GET) API возвращает `vehicle_id` и `user_id` (read-only). При создании/обновлении (POST/PATCH) нужно передавать `vehicle` (write-only).

### 4.2. Create Fuel Entry (Создать заправку)

**Endpoint:** `POST /api/v1/fuel-entries`

**Аутентификация:** Требуется

**Request Body:**
```json
{
  "vehicle": 1,
  "entry_date": "2025-01-15",
  "odometer": 50000,
  "station_name": "Shell Station 94",
  "fuel_brand": "Shell",
  "fuel_grade": "95",
  "liters": 45.5,
  "total_amount": 65.50,
  "notes": "Full tank"
}
```

**Бизнес-логика:**
- Проверка на строгое возрастание одометра.
- Дата не может быть в будущем.
- При создании/обновлении/удалении запускается каскадный пересчет метрик.
- `vehicle` - ID автомобиля (write-only при создании).
- Вычисляемые поля (`unit_price`, `distance_since_last`, `consumption_l_100km`, `cost_per_km`) рассчитываются автоматически.

**Success Response (201 Created):** Созданная запись с вычисленными метриками и полями `vehicle_id`, `user_id` вместо `vehicle`.

### 4.3. Прочие эндпоинты Fuel Entries

- `GET /api/v1/fuel-entries/{id}` - Получить детали
- `PATCH /api/v1/fuel-entries/{id}` - Обновить
- `DELETE /api/v1/fuel-entries/{id}` - Удалить

---

## 5. Statistics

### 5.1. Get Dashboard Statistics (Статистика для дашборда)

**Endpoint:** `GET /api/v1/statistics/dashboard`

**Аутентификация:** Требуется

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `vehicle` | integer | ID автомобиля (если не указан — по всем) |
| `period` | string | "30d", "90d", "ytd", "custom" (по умолчанию "30d") |
| `date_after` | string (ISO date) | Начало периода (для `period=custom`) |
| `date_before` | string (ISO date) | Конец периода (для `period=custom`) |

**Success Response (200 OK):**
```json
{
  "period": {
    "type": "30d",
    "date_after": "2024-12-16",
    "date_before": "2025-01-15"
  },
  "aggregates": {
    "average_consumption": 8.5,
    "average_unit_price": 1.42,
    // ... другие агрегаты
  },
  "time_series": {
    "consumption": [
      {"date": "2024-12-20", "value": 9.2}
    ]
  }
}
```

### 5.2. Get Statistics by Brand (Статистика по брендам)

**Endpoint:** `GET /api/v1/statistics/by-brand`

**Аутентификация:** Требуется

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `vehicle` | integer | ID автомобиля (если не указан — по всем) |

**Success Response (200 OK):**
```json
[
  {
    "brand": "Shell",
    "average_consumption": 8.5,
    "average_unit_price": 1.42,
    "average_cost_per_km": 0.47,
    "fill_count": 15
  },
  {
    "brand": "BP",
    "average_consumption": 8.7,
    "average_unit_price": 1.38,
    "average_cost_per_km": 0.48,
    "fill_count": 12
  }
]
```

**Описание:**
Возвращает all-time статистику по каждому бренду топлива:
- `brand`: название бренда
- `average_consumption`: средний расход (л/100км)
- `average_unit_price`: средняя цена за литр
- `average_cost_per_km`: средняя стоимость за км
- `fill_count`: количество заправок этим брендом

Записи отсортированы по количеству заправок (больше первыми).

### 5.3. Get Statistics by Grade (Статистика по маркам)

**Endpoint:** `GET /api/v1/statistics/by-grade`

**Аутентификация:** Требуется

**Query Parameters:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `vehicle` | integer | ID автомобиля (если не указан — по всем) |

**Success Response (200 OK):**
```json
[
  {
    "grade": "95",
    "average_consumption": 8.5,
    "average_unit_price": 1.42,
    "average_cost_per_km": 0.47,
    "fill_count": 20
  },
  {
    "grade": "98",
    "average_consumption": 8.3,
    "average_unit_price": 1.52,
    "average_cost_per_km": 0.49,
    "fill_count": 7
  }
]
```

**Описание:**
Возвращает all-time статистику по каждой марке топлива (октановое число):
- `grade`: марка/октановое число
- `average_consumption`: средний расход (л/100км)
- `average_unit_price`: средняя цена за литр
- `average_cost_per_km`: средняя стоимость за км
- `fill_count`: количество заправок этой маркой

Записи отсортированы по количеству заправок (больше первыми).
