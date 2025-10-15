# Fuel Tracker Development Roadmap

This document describes the step-by-step development plan for the Fuel Tracker MVP application.

---

## Phase 0: Infrastructure and Setup ✅

### Monorepo
- [x] Combine backend and frontend projects
- [x] Create a root docker-compose.yml
- [x] Create .env.example with documentation
- [x] Configure .gitignore
- [x] Create a root README.md
- [x] Create CLAUDE.md for AI assistants

### Backend (Django REST Framework)
- [x] Basic Django project structure
- [x] Data models (User, Vehicle, FuelEntry)
- [x] REST API endpoints (all CRUD operations)
- [x] Authentication (session-based + CSRF)
- [x] Permissions and data isolation
- [x] Service layer (business logic)
- [x] Validation (odometer, metrics)
- [x] Middleware (CorrelationId, Logging, Security)
- [x] OpenAPI documentation (Swagger UI)
- [x] Tests (55 tests, 91% coverage)
- [x] Docker configuration

### Frontend (React + Vite + Zustand)
- [x] Basic FSD (Feature-Sliced Design) structure
- [x] Zustand stores (auth, vehicle, userSettings)
- [x] API client (Axios + CSRF handling)
- [x] React Router setup
- [x] shadcn/ui components
- [x] Basic types and utilities

---

## Phase 1: Frontend-Backend Integration 🚀

### 1.1. Authentication Flow (Priority: HIGH) ✅
- [x] **SignUp Page**
  - [x] Connect SignUpForm to API (`POST /api/v1/auth/signup`)
  - [x] Handle successful registration (auto-login)
  - [x] Handle errors (email exists, weak password)
  - [x] Test CSRF tokens
  - [x] Redirect to dashboard after success

- [x] **SignIn Page**
  - [x] Connect SignInForm to API (`POST /api/v1/auth/signin`)
  - [x] Handle successful sign-in
  - [x] Handle errors (invalid credentials)
  - [x] "Remember me" functionality
  - [x] Redirect to dashboard after success

- [x] **SignOut Functionality**
  - [x] Implement logout (`POST /api/v1/auth/signout`)
  - [x] Clear auth state (Zustand store)
  - [x] Redirect to /auth
  - [x] Add Logout button to navigation

- [x] **Session Persistence**
  - [x] Check authentication on application load
  - [x] Automatically redirect to /auth if not authenticated
  - [x] Restore user profile from API
  - [x] Handling expired sessions (401 responses)

### 1.2. Dashboard Page (Priority: HIGH) ✅
- [x] **Layout & Navigation**
  - [x] Create Dashboard page component
  - [x] Sidebar with navigation
  - [x] Header with user menu
  - [x] Breadcrumbs
  - [x] Vehicle selector in header

- [x] **User Profile Display**
  - [x] Fetch user profile (`GET /api/v1/users/me`)
  - [x] Display name and email
  - [x] Display unit preferences

- [x] **Vehicle Overview**
  - [x] Fetch vehicles list (`GET /api/v1/vehicles`)
  - [x] Vehicle cards
  - [x] Quick stats per vehicle
  - [x] Empty state (no vehicles yet)
  - [x] "Add Vehicle" CTA

- [x] **Statistics Cards**
  - [x] Fetch dashboard stats (`GET /api/v1/statistics/dashboard`)
  - [x] Average consumption card
  - [x] Average cost per liter card
  - [x] Total spend card (period)
  - [x] Total distance card (period)
  - [x] Average cost per km card

- [x] **Charts**
  - [x] Line chart: Cost per liter over time
  - [x] Line chart: Consumption (L/100km or MPG) over time
  - [x] Integration with recharts library
  - [x] Responsive design

- [x] **Period Selector**
  - [x] Dropdown: Last 30 days / 90 days / YTD / Custom
  - [x] Date range picker for Custom
  - [x] Automatic data update on period change
  - [x] Save selected period in state

### 1.3. Vehicles Management (Priority: MEDIUM) ✅
- [x] **Vehicles List Page**
  - [x] Table/cards of all vehicles
  - [x] Sorting (by date, name)
  - [x] Search by name
  - [x] Actions: Edit, Delete
  - [x] Empty state

- [x] **Add Vehicle Form**
  - [x] Modal window or separate page
  - [x] Fields: name (required), make, model, year, fuel_type
  - [x] Validation (Zod schema)
  - [x] API call: `POST /api/v1/vehicles`
  - [x] Success toast + redirect to list

- [x] **Edit Vehicle Form**
  - [x] Load vehicle data
  - [x] Pre-fill the form
  - [x] API call: `PATCH /api/v1/vehicles/{id}`
  - [x] Success toast + refresh list

- [x] **Delete Vehicle**
  - [x] Confirmation dialog with a warning
  - [x] Information about the number of associated fuel entries
  - [x] API call: `DELETE /api/v1/vehicles/{id}`
  - [x] Cascade delete explanation
  - [x] Success toast + refresh list

### 1.4. Fuel Entries (Priority: HIGH) ✅
- [x] **Fuel Entries List Page**
  - [x] Fetch entries (`GET /api/v1/fuel-entries`)
  - [x] Table with columns: date, vehicle, station, liters, cost, metrics
  - [x] Pagination (infinite scroll)
  - [x] Sorting by date (desc by default)
  - [x] Actions: Edit, Delete
  - [x] Empty state

- [x] **Filters**
  - [x] Date range picker
  - [x] Vehicle selector (multi-select or single)
  - [x] Fuel brand dropdown
  - [x] Fuel grade dropdown
  - [x] Station name search
  - [x] Query params in URL for filters

- [x] **Add Fuel Entry Form**
  - [x] Modal window or separate page
  - [x] Fields: vehicle, date, odometer, station, brand, grade, liters, total_amount, notes
  - [x] Zod validation schema (all business rules)
  - [x] Odometer validation (monotonicity check on the client)
  - [x] Real-time computed fields: unit_price, expected consumption
  - [x] API call: `POST /api/v1/fuel-entries`
  - [x] Success toast + redirect/refresh

- [x] **Edit Fuel Entry**
  - [x] Load entry data
  - [x] Pre-fill the form
  - [x] Odometer validation (considering adjacent entries)
  - [x] Warning about cascade recalculation
  - [x] API call: `PATCH /api/v1/fuel-entries/{id}`
  - [x] Success toast + refresh

- [x] **Delete Fuel Entry**
  - [x] Confirmation dialog
  - [x] Information about the impact on metrics
  - [x] API call: `DELETE /api/v1/fuel-entries/{id}`
  - [x] Success toast + refresh

- [x] **Entry Details View**
  - [x] Modal window with detailed information
  - [x] All computed metrics
  - [x] Edit/Delete actions

### 1.5. Statistics & Analytics (Priority: MEDIUM) ✅
- [x] **Brand/Grade Comparison Page**
  - [x] Fetch data (`GET /api/v1/statistics/by-brand`, `/api/v1/statistics/by-grade`)
  - [x] Table: Brand × (avg cost/L, avg consumption, count)
  - [x] Table: Grade × (avg cost/L, avg consumption, count)
  - [x] Sorting by columns
  - [x] Vehicle filter
  - [x] Period filter
  - [x] Export to CSV functionality

- [x] **Advanced Charts** (optional)
  - [x] Integration with existing charts on Dashboard
  - [x] Responsive design for tables

### 1.6. User Settings (Priority: LOW) ✅
- [x] **Profile Settings Page**
  - [x] Display current settings
  - [x] Display user email
  - [x] API call: `PATCH /api/v1/users/me`

- [x] **Unit Preferences**
  - [x] Distance unit: km / mi
  - [x] Volume unit: L / gal
  - [x] Currency selection (dropdown)
  - [x] Timezone selection
  - [x] Real-time preview changes
  - [x] Save to API + update Zustand store

- [x] **GDPR Compliance**
  - [x] Export Data button → `GET /api/v1/users/me/export`
  - [x] Download CSV file
  - [x] Delete Account button → `DELETE /api/v1/users/me`
  - [x] Confirmation dialog with a warning
  - [x] Clear explanation of consequences

---

## Phase 2: Polish & UX Enhancements 🎨

### 2.1. Error Handling & Feedback
- [x] Fix: Duplicate close button in EntryDetails modal
- [x] Fix: Calculate metrics for the first fuel entry
- [ ] Centralized error handler for API
- [ ] Toast notifications (success, error, warning)
- [ ] Inline form errors with clear messages
- [ ] Retry logic for failed requests
- [ ] Network error states

### 2.2. Loading States
- [ ] Skeleton loaders for lists
- [ ] Spinner for buttons (loading buttons)
- [ ] Optimistic UI updates where possible
- [ ] Suspense boundaries for code splitting

### 2.3. Empty States
- [ ] Beautiful empty states for all lists
- [ ] Onboarding tooltips for first actions
- [ ] User assistance ("Add your first vehicle")

### 2.4. Mobile Responsive
- [ ] Testing on different screen sizes (≥360px)
- [ ] Mobile-friendly navigation (hamburger menu)
- [ ] Touch-friendly buttons and forms
- [ ] Responsive tables (cards on mobile)

### 2.5. Accessibility (a11y)
- [x] Keyboard navigation (Tab, Enter, Esc)
- [x] ARIA labels for all interactive elements
- [x] Focus indicators
- [x] Screen reader testing
- [x] Color contrast check

### 2.6. UI Consistency
- [x] Fix: Unify header on all pages (Entry Form)

### 2.7. Bug Fixes & Enhancements
- [x] Fix: Pressing 'Add Entry' button logs out the user
- [x] Feat: Aggregate dashboard graphs by day

---

## Phase 3: Testing & Quality Assurance 🧪

### 3.1. Frontend Testing
- [x] Unit tests for utils and helpers
- [x] Component tests (Testing Library)
- [x] Integration tests for forms
- [x] API mocking for tests
- [x] Coverage target: 70%+

### 3.2. E2E Testing
- [x] Setup Playwright 
- [x] Critical user flows:
  - [x] Sign Up → Add Vehicle → Add Fuel Entry → View Dashboard
  - [x] Sign In → Edit Entry → View Statistics → Sign Out

### 3.3. Performance Testing
- [ ] Lighthouse audit (target: 90+ score)
- [ ] Bundle size analysis
- [ ] Lazy loading check
- [ ] Image optimization

---

## Phase 4: Deployment & Documentation 🚀

### 4.1. Production Configuration
- [ ] Production docker-compose.yml
- [ ] Environment-specific configs
- [ ] Health checks for all services
- [ ] Gunicorn configuration
- [ ] Nginx reverse proxy (optional)


### 4.2. Security Audit
- [x] Information Security Audit completed
- [x] 24 vulnerabilities identified and documented
- [x] Action plan created (docs/security-audit.md)
- [x] Fix critical vulnerabilities (SEC-001, SEC-005, SEC-007, SEC-022)
- [x] Fix high priority vulnerabilities (SEC-003, SEC-004, SEC-009)
- [x] Fix medium priority vulnerabilities (SEC-006, SEC-014, SEC-015, SEC-017, SEC-018, SEC-020, SEC-023, SEC-024)

### 4.3. Documentation
- [x] API documentation (Swagger/ReDoc)
- [x] README files (backend, frontend, root)
- [x] Security audit report
- [ ] Deployment guide
- [ ] User guide

### 4.4. Final Checks
- [ ] Re-run security audit after fixes
- [ ] Performance benchmarks (P95 < 500ms)
- [ ] Load testing
- [ ] Browser compatibility testing
- [ ] Full smoke test in production
- [ ] Monitoring setup (logs, metrics)

---

## Post-MVP: Future Enhancements 🔮

**Not for the current MVP, but for future versions:**

- [ ] OCR for receipt recognition
- [ ] Mobile native apps (React Native)
- [ ] Push notifications
- [ ] Shared accounts / Fleet management
- [ ] Trip tracking with GPS
- [ ] Fuel price alerts
- [ ] Tax reports generation
- [ ] Multi-language support (i18n)
- [ ] Dark mode theme
- [ ] Export to PDF/Excel
- [ ] API rate limiting dashboard
- [ ] Admin panel

---

## Current Status

**Current Phase:** Phase 2 - Polish & UX Enhancements
**Next Step:** Start Phase 2 - Error Handling & Feedback

**Progress:**
- ✅ Phase 0: Infrastructure (100%)
- ✅ Phase 1: Frontend-Backend Integration (100%)
  - ✅ 1.1: Authentication Flow (100%)
  - ✅ 1.2: Dashboard Page (100%)
  - ✅ 1.3: Vehicles Management (100%)
  - ✅ 1.4: Fuel Entries (100%)
  - ✅ 1.5: Statistics & Analytics (100%)
  - ✅ 1.6: User Settings (100%)
- ⏳ Phase 2: Polish & UX (0%)
- ⏳ Phase 3: Testing (0%)
- ⏳ Phase 4: Deployment (0%)