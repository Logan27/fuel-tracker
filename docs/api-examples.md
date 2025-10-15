# API Examples - curl and httpie

Examples of requests to the Fuel Tracker API using curl and httpie.

## Base Parameters

```bash
BASE_URL="http://localhost:8000/api/v1"
```

## 1. Authentication

### Register a new user

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

### Sign In

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

### Sign Out

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

### Get user profile

**curl:**
```bash
curl -X GET "${BASE_URL}/users/me" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json GET "${BASE_URL}/users/me"
```

### Update user profile

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

### Export data (GDPR)

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

### Delete account (GDPR)

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

### List vehicles

**curl:**
```bash
curl -X GET "${BASE_URL}/vehicles" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json GET "${BASE_URL}/vehicles"
```

### Create vehicle

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

### Get vehicle details

**curl:**
```bash
curl -X GET "${BASE_URL}/vehicles/1" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json GET "${BASE_URL}/vehicles/1"
```

### Update vehicle

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

### Delete vehicle

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

### List fuel entries (with filters)

**curl:**
```bash
# All fuel entries
curl -X GET "${BASE_URL}/fuel-entries" \
  -b cookies.txt

# Filter by vehicle
curl -X GET "${BASE_URL}/fuel-entries?vehicle=1" \
  -b cookies.txt

# Filter by date
curl -X GET "${BASE_URL}/fuel-entries?date_after=2024-01-01&date_before=2024-12-31" \
  -b cookies.txt
```

**httpie:**
```bash
# All fuel entries
http --session=./session.json GET "${BASE_URL}/fuel-entries"

# Filter by vehicle
http --session=./session.json GET "${BASE_URL}/fuel-entries" vehicle==1

# Filter by date
http --session=./session.json GET "${BASE_URL}/fuel-entries" \
  date_after==2024-01-01 \
  date_before==2024-12-31
```

### Create a fuel entry

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

### Get fuel entry details

**curl:**
```bash
curl -X GET "${BASE_URL}/fuel-entries/1" \
  -b cookies.txt
```

**httpie:**
```bash
http --session=./session.json GET "${BASE_URL}/fuel-entries/1"
```

### Update a fuel entry

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

### Delete a fuel entry

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

### Get dashboard statistics

**curl:**
```bash
# Last 30 days (default)
curl -X GET "${BASE_URL}/statistics/dashboard" \
  -b cookies.txt

# Last 90 days
curl -X GET "${BASE_URL}/statistics/dashboard?period=90d" \
  -b cookies.txt

# Year-to-date
curl -X GET "${BASE_URL}/statistics/dashboard?period=ytd" \
  -b cookies.txt

# Custom period
curl -X GET "${BASE_URL}/statistics/dashboard?period=custom&date_after=2024-01-01&date_before=2024-12-31" \
  -b cookies.txt

# For a specific vehicle
curl -X GET "${BASE_URL}/statistics/dashboard?vehicle=1&period=30d" \
  -b cookies.txt
```

**httpie:**
```bash
# Last 30 days (default)
http --session=./session.json GET "${BASE_URL}/statistics/dashboard"

# Last 90 days
http --session=./session.json GET "${BASE_URL}/statistics/dashboard" period==90d

# Year-to-date
http --session=./session.json GET "${BASE_URL}/statistics/dashboard" period==ytd

# Custom period
http --session=./session.json GET "${BASE_URL}/statistics/dashboard" \
  period==custom \
  date_after==2024-01-01 \
  date_before==2024-12-31

# For a specific vehicle
http --session=./session.json GET "${BASE_URL}/statistics/dashboard" \
  vehicle==1 \
  period==30d
```

## Full workflow (use case scenario)

```bash
#!/bin/bash
BASE_URL="http://localhost:8000/api/v1"

# 1. Registration
echo "=== Registration ==="
curl -X POST "${BASE_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "test@example.com", "password": "TestPass123"}'

# 2. Create a vehicle
echo -e "\n=== Create a vehicle ==="
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

# 3. Create the first fuel entry (baseline)
echo -e "\n=== Create baseline fuel entry ==="
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

# 4. Create a second fuel entry (with metrics)
echo -e "\n=== Create second fuel entry ==="
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

# 5. Get statistics
echo -e "\n=== Statistics ==="
curl -X GET "${BASE_URL}/statistics/dashboard?vehicle=$VEHICLE_ID&period=30d" \
  -b cookies.txt | jq '.'

# 6. List all fuel entries
echo -e "\n=== List of fuel entries ==="
curl -X GET "${BASE_URL}/fuel-entries?vehicle=$VEHICLE_ID" \
  -b cookies.txt | jq '.'

echo -e "\n=== Done! ==="
```

## Notes

- **curl**: Use `-c cookies.txt` to save cookies and `-b cookies.txt` to send them
- **httpie**: Use `--session=./session.json` for automatic session management
- For JSON responses, you can use `| jq '.'` for pretty formatting
- Replace `${BASE_URL}` with the actual address of your API
- For CSRF protection when using curl, an additional X-CSRFToken header may be required