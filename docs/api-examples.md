# API Examples - curl и httpie

Примеры запросов к Fuel Tracker API используя curl и httpie.

## Базовые параметры

```bash
BASE_URL="http://localhost:8000/api/v1"
```

## 1. Authentication

### Регистрация нового пользователя

**curl:**
```bash
curl -X POST "${BASE_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**httpie:**
```bash
http POST "${BASE_URL}/auth/signup" \
  email=user@example.com \
  password=SecurePass123
```

### Вход в систему

**curl:**
```bash
curl -X POST "${BASE_URL}/auth/signin" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**httpie:**
```bash
http --session=./session.json POST "${BASE_URL}/auth/signin" \
  email=user@example.com \
  password=SecurePass123
```

### Выход из системы

**curl:**
```bash
curl -X POST "${BASE_URL}/auth/signout" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json POST "${BASE_URL}/auth/signout"
```

## 2. User Profile

### Получить профиль пользователя

**curl:**
```bash
curl -X GET "${BASE_URL}/users/me" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json GET "${BASE_URL}/users/me"
```

### Обновить профиль пользователя

**curl:**
```bash
curl -X PATCH "${BASE_URL}/users/me" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "preferred_currency": "EUR",
    "preferred_distance_unit": "mi",
    "preferred_volume_unit": "gal"
  }'
```

**httpie:**
```bash
http --session=./session.json PATCH "${BASE_URL}/users/me" \
  preferred_currency=EUR \
  preferred_distance_unit=mi \
  preferred_volume_unit=gal
```

### Экспорт данных (GDPR)

**curl:**
```bash
curl -X GET "${BASE_URL}/users/me/export" \
  -b cookies.txt \
  -o user_data_export.csv
```

**httpie:**
```bash
http --session=./session.json --download GET "${BASE_URL}/users/me/export"
```

### Удаление аккаунта (GDPR)

**curl:**
```bash
curl -X DELETE "${BASE_URL}/users/me" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json DELETE "${BASE_URL}/users/me"
```

## 3. Vehicles

### Список автомобилей

**curl:**
```bash
curl -X GET "${BASE_URL}/vehicles" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json GET "${BASE_URL}/vehicles"
```

### Создать автомобиль

**curl:**
```bash
curl -X POST "${BASE_URL}/vehicles" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "My Toyota Camry",
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "fuel_type": "Gasoline"
  }'
```

**httpie:**
```bash
http --session=./session.json POST "${BASE_URL}/vehicles" \
  name="My Toyota Camry" \
  make=Toyota \
  model=Camry \
  year:=2020 \
  fuel_type=Gasoline
```

### Получить детали автомобиля

**curl:**
```bash
curl -X GET "${BASE_URL}/vehicles/1" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json GET "${BASE_URL}/vehicles/1"
```

### Обновить автомобиль

**curl:**
```bash
curl -X PATCH "${BASE_URL}/vehicles/1" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Updated name",
    "year": 2021
  }'
```

**httpie:**
```bash
http --session=./session.json PATCH "${BASE_URL}/vehicles/1" \
  name="Updated name" \
  year:=2021
```

### Удалить автомобиль

**curl:**
```bash
curl -X DELETE "${BASE_URL}/vehicles/1" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json DELETE "${BASE_URL}/vehicles/1"
```

## 4. Fuel Entries

### Список заправок (с фильтрами)

**curl:**
```bash
# Все заправки
curl -X GET "${BASE_URL}/fuel-entries" \
  -b cookies.txt

# С фильтром по автомобилю
curl -X GET "${BASE_URL}/fuel-entries?vehicle=1" \
  -b cookies.txt

# С фильтром по датам
curl -X GET "${BASE_URL}/fuel-entries?date_after=2024-01-01&date_before=2024-12-31" \
  -b cookies.txt
```

**httpie:**
```bash
# Все заправки
http --session=./session.json GET "${BASE_URL}/fuel-entries"

# С фильтром по автомобилю
http --session=./session.json GET "${BASE_URL}/fuel-entries" vehicle==1

# С фильтром по датам
http --session=./session.json GET "${BASE_URL}/fuel-entries" \
  date_after==2024-01-01 \
  date_before==2024-12-31
```

### Создать запись о заправке

**curl:**
```bash
curl -X POST "${BASE_URL}/fuel-entries" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "vehicle": 1,
    "entry_date": "2025-01-15",
    "odometer": 50000,
    "station_name": "Shell",
    "fuel_brand": "Shell",
    "fuel_grade": "95",
    "liters": 45.50,
    "total_amount": 2500.00,
    "notes": "Full tank"
  }'
```

**httpie:**
```bash
http --session=./session.json POST "${BASE_URL}/fuel-entries" \
  vehicle:=1 \
  entry_date=2025-01-15 \
  odometer:=50000 \
  station_name=Shell \
  fuel_brand=Shell \
  fuel_grade=95 \
  liters:=45.50 \
  total_amount:=2500.00 \
  notes="Full tank"
```

### Получить детали заправки

**curl:**
```bash
curl -X GET "${BASE_URL}/fuel-entries/1" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json GET "${BASE_URL}/fuel-entries/1"
```

### Обновить заправку

**curl:**
```bash
curl -X PATCH "${BASE_URL}/fuel-entries/1" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "liters": 46.00,
    "total_amount": 2520.00
  }'
```

**httpie:**
```bash
http --session=./session.json PATCH "${BASE_URL}/fuel-entries/1" \
  liters:=46.00 \
  total_amount:=2520.00
```

### Удалить заправку

**curl:**
```bash
curl -X DELETE "${BASE_URL}/fuel-entries/1" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json DELETE "${BASE_URL}/fuel-entries/1"
```

## 5. Statistics

### Получить статистику дашборда

**curl:**
```bash
# Последние 30 дней (по умолчанию)
curl -X GET "${BASE_URL}/statistics/dashboard" \
  -b cookies.txt

# Последние 90 дней
curl -X GET "${BASE_URL}/statistics/dashboard?period=90d" \
  -b cookies.txt

# За год (year-to-date)
curl -X GET "${BASE_URL}/statistics/dashboard?period=ytd" \
  -b cookies.txt

# Кастомный период
curl -X GET "${BASE_URL}/statistics/dashboard?period=custom&date_after=2024-01-01&date_before=2024-12-31" \
  -b cookies.txt

# По конкретному автомобилю
curl -X GET "${BASE_URL}/statistics/dashboard?vehicle=1&period=30d" \
  -b cookies.txt
```

**httpie:**
```bash
# Последние 30 дней (по умолчанию)
http --session=./session.json GET "${BASE_URL}/statistics/dashboard"

# Последние 90 дней
http --session=./session.json GET "${BASE_URL}/statistics/dashboard" period==90d

# За год (year-to-date)
http --session=./session.json GET "${BASE_URL}/statistics/dashboard" period==ytd

# Кастомный период
http --session=./session.json GET "${BASE_URL}/statistics/dashboard" \
  period==custom \
  date_after==2024-01-01 \
  date_before==2024-12-31

# По конкретному автомобилю
http --session=./session.json GET "${BASE_URL}/statistics/dashboard" \
  vehicle==1 \
  period==30d
```

## Полный workflow (сценарий использования)

```bash
#!/bin/bash
BASE_URL="http://localhost:8000/api/v1"

# 1. Регистрация
echo "=== Регистрация ==="
curl -X POST "${BASE_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "test@example.com", "password": "TestPass123"}'

# 2. Создание автомобиля
echo -e "\n=== Создание автомобиля ==="
VEHICLE_ID=$(curl -s -X POST "${BASE_URL}/vehicles" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "My Car",
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "fuel_type": "Gasoline"
  }' | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

echo "Created vehicle ID: $VEHICLE_ID"

# 3. Создание первой заправки (baseline)
echo -e "\n=== Создание baseline заправки ==="
curl -X POST "${BASE_URL}/fuel-entries" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"vehicle\": $VEHICLE_ID,
    \"entry_date\": \"2025-01-01\",
    \"odometer\": 50000,
    \"station_name\": \"Shell\",
    \"fuel_brand\": \"Shell\",
    \"fuel_grade\": \"95\",
    \"liters\": 45.0,
    \"total_amount\": 2475.00
  }"

# 4. Создание второй заправки (с метриками)
echo -e "\n=== Создание второй заправки ==="
curl -X POST "${BASE_URL}/fuel-entries" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"vehicle\": $VEHICLE_ID,
    \"entry_date\": \"2025-01-15\",
    \"odometer\": 50500,
    \"station_name\": \"Shell\",
    \"fuel_brand\": \"Shell\",
    \"fuel_grade\": \"95\",
    \"liters\": 42.0,
    \"total_amount\": 2310.00
  }"

# 5. Получение статистики
echo -e "\n=== Статистика ==="
curl -X GET "${BASE_URL}/statistics/dashboard?vehicle=$VEHICLE_ID&period=30d" \
  -b cookies.txt | jq '.'

# 6. Список всех заправок
echo -e "\n=== Список заправок ==="
curl -X GET "${BASE_URL}/fuel-entries?vehicle=$VEHICLE_ID" \
  -b cookies.txt | jq '.'

echo -e "\n=== Готово! ==="
```

## Примечания

- **curl**: Используйте `-c cookies.txt` для сохранения cookies и `-b cookies.txt` для отправки
- **httpie**: Используйте `--session=./session.json` для автоматического управления сессией
- Для JSON-ответов можно использовать `| jq '.'` для красивого форматирования
- Замените `${BASE_URL}` на актуальный адрес вашего API
- Для CSRF-защиты при использовании curl может потребоваться дополнительный X-CSRFToken заголовок

