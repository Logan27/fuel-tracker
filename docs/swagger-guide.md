# OpenAPI (Swagger) Documentation Guide

## Accessing the API Documentation

After starting the project (`docker-compose up` or locally), the documentation is available at the following addresses:

### Swagger UI (interactive documentation)
```
http://localhost:8000/api/v1/schema/swagger-ui/
```

Swagger UI provides:
- An interactive interface for testing the API
- A complete description of all endpoints
- The ability to execute requests directly from the browser
- Examples of requests and responses

### ReDoc (alternative view)
```
http://localhost:8000/api/v1/schema/redoc/
```

ReDoc provides:
- A more compact display of the documentation
- Convenient navigation through sections
- Search within the documentation

### OpenAPI Schema (YAML)
```
http://localhost:8000/api/v1/schema/
```

Returns the raw OpenAPI 3.0 schema in YAML format, which can be:
- Imported into Postman
- Used to generate client code
- Integrated with other tools

## Generating the schema to a file

To generate the OpenAPI schema to a file:

```bash
python manage.py spectacular --color --file schema.yml
```

Or from a virtual environment:

```bash
.\venv\Scripts\python.exe manage.py spectacular --color --file schema.yml
```

## API Documentation Structure

The API is divided into the following groups (tags):

### 1. Authentication
- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/signin` - Sign in
- `POST /api/v1/auth/signout` - Sign out

### 2. Users
- `GET /api/v1/users/me` - Get user profile
- `PATCH /api/v1/users/me` - Update user profile
- `GET /api/v1/users/me/export` - Export data (GDPR)
- `DELETE /api/v1/users/me` - Delete account (GDPR)

### 3. Vehicles
- `GET /api/v1/vehicles` - List vehicles
- `POST /api/v1/vehicles` - Create a vehicle
- `GET /api/v1/vehicles/{id}` - Get vehicle details
- `PATCH /api/v1/vehicles/{id}` - Update a vehicle
- `DELETE /api/v1/vehicles/{id}` - Delete a vehicle

### 4. Fuel Entries
- `GET /api/v1/fuel-entries` - List fuel entries (with pagination)
- `POST /api/v1/fuel-entries` - Create a fuel entry
- `GET /api/v1/fuel-entries/{id}` - Get fuel entry details
- `PATCH /api/v1/fuel-entries/{id}` - Update a fuel entry
- `DELETE /api/v1/fuel-entries/{id}` - Delete a fuel entry

### 5. Statistics
- `GET /api/v1/statistics/dashboard` - Dashboard statistics

## Using Swagger UI

### Authentication

The API uses session-based authentication. To test via Swagger UI:

1. Open Swagger UI: `http://localhost:8000/api/v1/schema/swagger-ui/`
2. Find the **Authentication → Sign in** endpoint
3. Click "Try it out"
4. Enter email and password
5. Click "Execute"
6. After a successful login, the session cookie will be saved in the browser
7. Now you can make requests to protected endpoints

### Testing Endpoints

1. Select the desired endpoint
2. Click "Try it out"
3. Fill in the request parameters (query, body)
4. Click "Execute"
5. View the response in the "Responses" section

### Usage Examples

#### Create a vehicle
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

#### Create a fuel entry
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

#### Get statistics
```
GET /api/v1/statistics/dashboard?period=30d&vehicle=1
```

## Importing into Postman

1. Download the schema: `http://localhost:8000/api/v1/schema/`
2. Open Postman
3. File → Import
4. Select the downloaded `schema.yml` file
5. Postman will automatically create a collection with all endpoints

## Configuring drf-spectacular

The settings are located in `fuel_tracker/settings.py`:

```python
SPECTACULAR_SETTINGS = {
    'TITLE': 'Fuel Tracker API',
    'DESCRIPTION': '...',
    'VERSION': '1.0.0',
    'TAGS': [...],
    # Other settings
}
```

## Adding documentation to new endpoints

### For ViewSets

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

### For function-based views

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

## Useful Links

- [drf-spectacular documentation](https://drf-spectacular.readthedocs.io/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/) - for editing the schema