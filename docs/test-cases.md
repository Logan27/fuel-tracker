# Test Plan - Fuel Tracker API

## 1. Introduction

This document describes the strategy, scope, resources, and schedule of planned testing activities for the REST API of the "Fuel Tracker" project. The goal of testing is to ensure that the API meets the functional and non-functional requirements outlined in `docs/brd.md` and is ready for deployment in a production environment.

## 2. Scope of Testing

### 2.1. In Scope

- **API Testing:** The main focus will be on testing the REST API.
- **Functional Testing:**
    - Authentication and authorization (user creation, login, logout).
    - User profile management (unit of measurement, currency settings).
    - CRUD operations for Vehicles.
    - CRUD operations for Fuel Entries.
    - Correctness of calculated metrics (consumption, cost, etc.).
    - Data validation and error handling.
- **Security Testing:**
    - User data isolation (tenant isolation). A user cannot access another user's data.
    - Checking access rights to endpoints.
- **Load Testing (basic):**
    - Checking the response time of key endpoints under load (according to NFR 4.2).

### 2.2. Out of Scope

- **UI/Frontend Testing:** User interface testing is not conducted, as only the backend is being developed in the current task.
- **Integration testing with third-party services:** There are no external integrations in the MVP.
- **Usability testing.**
- **Compatibility testing (browsers, OS):** Not applicable for an API.

## 3. Testing Strategy

Testing will be carried out mainly at the API level using tools for sending HTTP requests (e.g., Postman, or writing integration tests in Python/Pytest).

- **Positive Testing:** Verifying that the system works correctly with valid data.
- **Negative Testing:** Verifying the system's behavior with invalid data (incorrect format, empty fields, violation of business logic).
- **Boundary Value Analysis:** Testing boundary values (e.g., maximum length of string fields, zero values for numbers).
- **Security Testing:** Attempts to access others' data by substituting IDs in requests.

## 4. Acceptance Criteria

- 100% of test scenarios with **High** priority must be passed.
- 95% of test scenarios with **Medium** priority must be passed.
- No blocking or critical defects.
- API response time meets non-functional requirements.

---

# Test Cases

## 1. Authentication and Account Management (FR 3.1)

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| **AUTH-001** | Successful registration of a new user | High | A user with `test@example.com` does not exist. | 1. Send a POST request to `/api/register` with valid `email` and `password`. | 1. Status code `201 Created`. <br> 2. The response contains a session token. <br> 3. The user is created in the DB. |
| **AUTH-002** | Registration with an existing email | High | A user with `test@example.com` already exists. | 1. Send a POST request to `/api/register` with `email="test@example.com"`. | 1. Status code `400 Bad Request`. <br> 2. The response contains an error message that the email is already in use. |
| **AUTH-003** | Registration with an invalid password (less than 8 characters) | Medium | - | 1. Send a POST request to `/api/register` with the password "12345". | 1. Status code `400 Bad Request`. <br> 2. The response contains a message that the password does not meet the security policy. |
| **AUTH-004** | Successful login | High | The user `test@example.com` exists and has the password `password123`. | 1. Send a POST request to `/api/login` with a valid `email` and `password`. | 1. Status code `200 OK`. <br> 2. The response contains a session token. |
| **AUTH-005** | Login with an incorrect password | High | The user `test@example.com` exists. | 1. Send a POST request to `/api/login` with the correct `email` and an incorrect `password`. | 1. Status code `401 Unauthorized`. |
| **AUTH-006** | Logout | High | The user is authenticated. | 1. Send a POST request to `/api/logout` with a valid session token. | 1. Status code `200 OK`. <br> 2. The user's session is terminated. Subsequent requests with this token should be rejected. |

## 2. User Profile and Settings (FR 3.2)

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| **PROF-001** | Get user profile | High | The user is authenticated. | 1. Send a GET request to `/api/profile`. | 1. Status code `200 OK`. <br> 2. The response contains profile data: `displayName`, `currency`, `distanceUnit`, `volumeUnit`, `timeZone`. |
| **PROF-002** | Update user settings (units of measurement) | High | The user is authenticated. | 1. Send a PUT/PATCH request to `/api/profile` with `distanceUnit="mi"` and `volumeUnit="gal"`. | 1. Status code `200 OK`. <br> 2. The response contains the updated profile data. <br> 3. A subsequent GET request to `/api/profile` returns the new values. |
| **PROF-003** | Update settings with invalid values | Medium | The user is authenticated. | 1. Send a PUT/PATCH request to `/api/profile` with `distanceUnit="invalid_unit"`. | 1. Status code `400 Bad Request`. <br> 2. The response contains a validation error message. |

## 3. Vehicle Management (FR 3.3)

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| **VEH-001** | Create a new vehicle | High | The user is authenticated. | 1. Send a POST request to `/api/vehicles` with valid data (required field `name`). | 1. Status code `201 Created`. <br> 2. The response contains the data of the created vehicle with an assigned ID. |
| **VEH-002** | Create a vehicle without the required `name` field | High | The user is authenticated. | 1. Send a POST request to `/api/vehicles` without the `name` field. | 1. Status code `400 Bad Request`. <br> 2. Validation error message. |
| **VEH-003** | Get a list of user's vehicles | High | The user is authenticated and has 2 created vehicles. | 1. Send a GET request to `/api/vehicles`. | 1. Status code `200 OK`. <br> 2. The response is an array of 2 vehicle objects. |
| **VEH-004** | Get a specific vehicle by ID | High | The user is authenticated. Vehicle with ID=1 belongs to them. | 1. Send a GET request to `/api/vehicles/1`. | 1. Status code `200 OK`. <br> 2. The response contains the data of the vehicle with ID=1. |
| **VEH-005** | Update vehicle data | High | The user is authenticated. Vehicle with ID=1 belongs to them. | 1. Send a PUT/PATCH request to `/api/vehicles/1` with a new `name` value. | 1. Status code `200 OK`. <br> 2. The response contains the updated vehicle data. |
| **VEH-006** | Delete a vehicle | High | The user is authenticated. Vehicle with ID=1 belongs to them. | 1. Send a DELETE request to `/api/vehicles/1`. | 1. Status code `204 No Content`. <br> 2. The vehicle is deleted from the DB. |

## 4. Fuel Entry Management (FR 3.4)

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| **FUEL-001** | Create the first (baseline) fuel entry | High | The user is authenticated. A vehicle with ID=1 exists. | 1. Send a POST request to `/api/fuel-entries` with valid data (vehicleId=1, odometer=10000, date, etc.). | 1. Status code `201 Created`. <br> 2. The entry is created. Calculated fields (distance, consumption) should be `null`. |
| **FUEL-002** | Create a second fuel entry | High | The first entry with odometer=10000 exists. | 1. Send a POST request to `/api/fuel-entries` with odometer=10200. | 1. Status code `201 Created`. <br> 2. The entry is created. Calculated fields are correctly calculated. |
| **FUEL-003** | Create an entry with an odometer reading lower than the previous one | High | An entry with odometer=10200 exists. | 1. Send a POST request to `/api/fuel-entries` with odometer=10100. | 1. Status code `400 Bad Request`. <br> 2. Error message "Odometer value must be greater than the previous entry". |
| **FUEL-004** | Create an entry with a future date | Medium | - | 1. Send a POST request with a date later than the current date. | 1. Status code `400 Bad Request`. <br> 2. Date validation error message. |
| **FUEL-005** | Edit a fuel entry | High | An entry with ID=1 exists. | 1. Send a PUT/PATCH request to `/api/fuel-entries/1` with modified data. | 1. Status code `200 OK`. <br> 2. The entry is updated. Related metrics (for this and the next entry) are recalculated. |
| **FUEL-006** | Delete a fuel entry | High | 3 entries exist (ID 1, 2, 3). | 1. Send a DELETE request to `/api/fuel-entries/2`. | 1. Status code `204 No Content`. <br> 2. The entry is deleted. Metrics for entry ID=3 are recalculated using data from entry ID=1. |
| **FUEL-007** | Get a list of entries with pagination | Medium | 30 fuel entries have been created. | 1. Send a GET request to `/api/fuel-entries?page=1&size=25`. | 1. Status code `200 OK`. <br> 2. The response is an array of 25 entries, sorted by date (desc). |

## 5. Security and Data Isolation (NFR 4.1)

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| **SEC-001** | Attempt to get another user's vehicle | Critical | User A (ID=1) is authenticated. <br> Vehicle with ID=10 belongs to user B (ID=2). | 1. Send a GET request to `/api/vehicles/10` on behalf of user A. | 1. Status code `404 Not Found`. |
| **SEC-002** | Attempt to update another user's fuel entry | Critical | User A is authenticated. <br> Entry with ID=20 belongs to user B. | 1. Send a PUT/PATCH request to `/api/fuel-entries/20` on behalf of user A. | 1. Status code `404 Not Found`. |
| **SEC-003** | Attempt to delete another user's vehicle | Critical | User A is authenticated. <br> Vehicle with ID=10 belongs to user B. | 1. Send a DELETE request to `/api/vehicles/10` on behalf of user A. | 1. Status code `404 Not Found`. |
| **SEC-004** | Access to endpoints without authentication | High | The user is not authenticated. | 1. Send a GET request to `/api/vehicles`. | 1. Status code `401 Unauthorized`. |