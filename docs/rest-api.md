# REST API Documentation – Fuel Tracker Backend (v1)

## General Information

**Base URL:** `/api/v1/`

**Data Format:** JSON

**Authentication:** Session-based (`HttpOnly` cookie with CSRF token)

**Encoding:** UTF-8

**Timezones:** All dates and times are transmitted and stored in UTC.

---

## Authentication

For authenticated requests, the client must send the session cookie obtained upon login. For `POST/PATCH/DELETE` requests, an `X-CSRFToken` header is also required.

---

## Error Format

All errors (4xx, 5xx) are returned in a standardized format for consistency.

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
*   **status**: HTTP status code.
*   **code**: Machine-readable error code.
*   **detail**: Human-readable error description.

---

## 1. Authentication

### 1.1. Sign Up

**Endpoint:** `POST /api/v1/auth/signup`

**Authentication:** Not required

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

### 1.2. Sign In

**Endpoint:** `POST /api/v1/auth/signin`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200 OK):** User profile (see 2.1). Sets `sessionid` cookie.

### 1.3. Sign Out

**Endpoint:** `POST /api/v1/auth/signout`

**Authentication:** Required

**Success Response (204 No Content):** Empty response body. The session is terminated.

---

## 2. User Profile & GDPR

### 2.1. Get User Profile

**Endpoint:** `GET /api/v1/users/me`

**Authentication:** Required

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

### 2.2. Update User Profile

**Endpoint:** `PATCH /api/v1/users/me`

**Authentication:** Required

**Request Body:** (All fields are optional)
```json
{
  "preferred_currency": "EUR",
  "preferred_distance_unit": "mi"
}
```

**Success Response (200 OK):** Updated user profile.

### 2.3. **(GDPR)** Export User Data

**Endpoint:** `GET /api/v1/users/me/export`

**Authentication:** Required

**Success Response (200 OK):**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="export.csv"`
- Response body: CSV file with all user data (vehicles, fuel entries).

### 2.4. **(GDPR)** Delete Account

**Endpoint:** `DELETE /api/v1/users/me`

**Authentication:** Required

**Success Response (204 No Content):** Empty response body. All user data and associated records are permanently deleted.

---

## 3. Vehicles

Implements standard CRUD operations for vehicles.

- `GET /api/v1/vehicles` - List vehicles
- `POST /api/v1/vehicles` - Create vehicle
- `GET /api/v1/vehicles/{id}` - Get details
- `PATCH /api/v1/vehicles/{id}` - Update
- `DELETE /api/v1/vehicles/{id}` - Delete

---

## 4. Fuel Entries

### 4.1. List Fuel Entries

**Endpoint:** `GET /api/v1/fuel-entries`

**Authentication:** Required

**Pagination:** `CursorPagination`

**Query Parameters:**
| Parameter | Type | Description |
|----------|-----|----------|
| `limit` | integer | Number of records (default 25) |
| `cursor` | string | Cursor for the next/previous page |
| `vehicle`| integer | Filter by vehicle ID |
| `date_after` | string (ISO date) | Start of the date range |
| `date_before` | string (ISO date) | End of the date range |

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

**Important:** When reading (GET), the API returns `vehicle_id` and `user_id` (read-only). When creating/updating (POST/PATCH), you need to pass `vehicle` (write-only).

### 4.2. Create Fuel Entry

**Endpoint:** `POST /api/v1/fuel-entries`

**Authentication:** Required

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

**Business Logic:**
- Check for strictly increasing odometer.
- Date cannot be in the future.
- Cascade recalculation of metrics on create/update/delete.
- `vehicle` - Vehicle ID (write-only on creation).
- Calculated fields (`unit_price`, `distance_since_last`, `consumption_l_100km`, `cost_per_km`) are calculated automatically.

**Success Response (201 Created):** Created record with calculated metrics and `vehicle_id`, `user_id` fields instead of `vehicle`.

### 4.3. Other Fuel Entries Endpoints

- `GET /api/v1/fuel-entries/{id}` - Get details
- `PATCH /api/v1/fuel-entries/{id}` - Update
- `DELETE /api/v1/fuel-entries/{id}` - Delete

---

## 5. Statistics

### 5.1. Get Dashboard Statistics

**Endpoint:** `GET /api/v1/statistics/dashboard`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description |
|----------|-----|----------|
| `vehicle` | integer | Vehicle ID (if not specified - for all) |
| `period` | string | "30d", "90d", "ytd", "custom" (default "30d") |
| `date_after` | string (ISO date) | Start of period (for `period=custom`) |
| `date_before` | string (ISO date) | End of period (for `period=custom`) |

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
    // ... other aggregates
  },
  "time_series": {
    "consumption": [
      {"date": "2024-12-20", "value": 9.2}
    ]
  }
}
```

### 5.2. Get Statistics by Brand

**Endpoint:** `GET /api/v1/statistics/by-brand`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description |
|----------|-----|----------|
| `vehicle` | integer | Vehicle ID (if not specified - for all) |

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

**Description:**
Returns all-time statistics for each fuel brand:
- `brand`: brand name
- `average_consumption`: average consumption (L/100km)
- `average_unit_price`: average price per liter
- `average_cost_per_km`: average cost per km
- `fill_count`: number of fill-ups with this brand

Records are sorted by the number of fill-ups (most first).

### 5.3. Get Statistics by Grade

**Endpoint:** `GET /api/v1/statistics/by-grade`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description |
|----------|-----|----------|
| `vehicle` | integer | Vehicle ID (if not specified - for all) |

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

**Description:**
Returns all-time statistics for each fuel grade (octane number):
- `grade`: grade/octane number
- `average_consumption`: average consumption (L/100km)
- `average_unit_price`: average price per liter
- `average_cost_per_km`: average cost per km
- `fill_count`: number of fill-ups with this grade

Records are sorted by the number of fill-ups (most first).