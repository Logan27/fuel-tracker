# Fuel Tracker Development Roadmap

Этот документ описывает пошаговый план разработки MVP приложения Fuel Tracker.

---

## Phase 0: Инфраструктура и настройка ✅

### Монорепозиторий
- [x] Объединение backend и frontend проектов
- [x] Создание корневого docker-compose.yml
- [x] Создание .env.example с документацией
- [x] Настройка .gitignore
- [x] Создание корневого README.md
- [x] Создание CLAUDE.md для AI-ассистентов

### Backend (Django REST Framework)
- [x] Базовая структура проекта Django
- [x] Модели данных (User, Vehicle, FuelEntry)
- [x] REST API endpoints (все CRUD операции)
- [x] Аутентификация (session-based + CSRF)
- [x] Permissions и изоляция данных
- [x] Сервисный слой (бизнес-логика)
- [x] Валидация (одометр, метрики)
- [x] Middleware (CorrelationId, Logging, Security)
- [x] OpenAPI документация (Swagger UI)
- [x] Тесты (55 тестов, 91% coverage)
- [x] Docker configuration

### Frontend (React + Vite + Zustand)
- [x] Базовая структура FSD (Feature-Sliced Design)
- [x] Zustand stores (auth, vehicle, userSettings)
- [x] API client (Axios + CSRF handling)
- [x] React Router настройка
- [x] shadcn/ui компоненты
- [x] Базовые типы и утилиты

---

## Phase 1: Frontend-Backend Integration 🚀

### 1.1. Authentication Flow (Приоритет: ВЫСОКИЙ) ✅
- [x] **SignUp страница**
  - [x] Подключить SignUpForm к API (`POST /api/v1/auth/signup`)
  - [x] Обработка успешной регистрации (auto-login)
  - [x] Обработка ошибок (email exists, weak password)
  - [x] Тестирование CSRF токенов
  - [x] Редирект на dashboard после успеха

- [x] **SignIn страница**
  - [x] Подключить SignInForm к API (`POST /api/v1/auth/signin`)
  - [x] Обработка успешного входа
  - [x] Обработка ошибок (invalid credentials)
  - [x] "Remember me" функциональность
  - [x] Редирект на dashboard после успеха

- [x] **SignOut функциональность**
  - [x] Реализовать logout (`POST /api/v1/auth/signout`)
  - [x] Очистка auth state (Zustand store)
  - [x] Редирект на /auth
  - [x] Добавить кнопку Logout в навигацию

- [x] **Session Persistence**
  - [x] Проверка аутентификации при загрузке приложения
  - [x] Автоматический редирект на /auth если не авторизован
  - [x] Восстановление user profile из API
  - [x] Handling expired sessions (401 responses)

### 1.2. Dashboard Page (Приоритет: ВЫСОКИЙ) ✅
- [x] **Layout & Navigation**
  - [x] Создать Dashboard page компонент
  - [x] Sidebar с навигацией
  - [x] Header с user menu
  - [x] Breadcrumbs
  - [x] Vehicle selector в header

- [x] **User Profile Display**
  - [x] Fetch user profile (`GET /api/v1/users/me`)
  - [x] Отображение имени и email
  - [x] Отображение unit preferences

- [x] **Vehicle Overview**
  - [x] Fetch vehicles list (`GET /api/v1/vehicles`)
  - [x] Карточки автомобилей
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
  - [x] Integration с recharts библиотекой
  - [x] Responsive design

- [x] **Period Selector**
  - [x] Dropdown: Last 30 days / 90 days / YTD / Custom
  - [x] Date range picker для Custom
  - [x] Автоматическое обновление данных при смене периода
  - [x] Сохранение выбранного периода в state

### 1.3. Vehicles Management (Приоритет: СРЕДНИЙ) ✅
- [x] **Vehicles List Page**
  - [x] Таблица/карточки всех vehicles
  - [x] Сортировка (по дате, имени)
  - [x] Поиск по имени
  - [x] Actions: Edit, Delete
  - [x] Empty state

- [x] **Add Vehicle Form**
  - [x] Модальное окно или отдельная страница
  - [x] Поля: name (required), make, model, year, fuel_type
  - [x] Валидация (Zod schema)
  - [x] API call: `POST /api/v1/vehicles`
  - [x] Success toast + redirect to list

- [x] **Edit Vehicle Form**
  - [x] Загрузка данных vehicle
  - [x] Предзаполнение формы
  - [x] API call: `PATCH /api/v1/vehicles/{id}`
  - [x] Success toast + refresh list

- [x] **Delete Vehicle**
  - [x] Confirmation dialog с предупреждением
  - [x] Информация о количестве связанных fuel entries
  - [x] API call: `DELETE /api/v1/vehicles/{id}`
  - [x] Cascade delete explanation
  - [x] Success toast + refresh list

### 1.4. Fuel Entries (Приоритет: ВЫСОКИЙ) ✅
- [x] **Fuel Entries List Page**
  - [x] Fetch entries (`GET /api/v1/fuel-entries`)
  - [x] Таблица с колонками: date, vehicle, station, liters, cost, metrics
  - [x] Pagination (infinite scroll)
  - [x] Sorting по дате (desc by default)
  - [x] Actions: Edit, Delete
  - [x] Empty state

- [x] **Filters**
  - [x] Date range picker
  - [x] Vehicle selector (multi-select or single)
  - [x] Fuel brand dropdown
  - [x] Fuel grade dropdown
  - [x] Station name search
  - [x] Query params в URL для filters

- [x] **Add Fuel Entry Form**
  - [x] Модальное окно или отдельная страница
  - [x] Поля: vehicle, date, odometer, station, brand, grade, liters, total_amount, notes
  - [x] Zod validation schema (все бизнес-правила)
  - [x] Odometer validation (monotonicity check на клиенте)
  - [x] Real-time computed fields: unit_price, expected consumption
  - [x] API call: `POST /api/v1/fuel-entries`
  - [x] Success toast + redirect/refresh

- [x] **Edit Fuel Entry**
  - [x] Загрузка entry data
  - [x] Предзаполнение формы
  - [x] Валидация odometer (с учётом соседних entries)
  - [x] Предупреждение о cascade recalculation
  - [x] API call: `PATCH /api/v1/fuel-entries/{id}`
  - [x] Success toast + refresh

- [x] **Delete Fuel Entry**
  - [x] Confirmation dialog
  - [x] Информация о влиянии на метрики
  - [x] API call: `DELETE /api/v1/fuel-entries/{id}`
  - [x] Success toast + refresh

- [x] **Entry Details View**
  - [x] Модальное окно с детальной информацией
  - [x] Все computed metrics
  - [x] Edit/Delete actions

### 1.5. Statistics & Analytics (Приоритет: СРЕДНИЙ) ✅
- [x] **Brand/Grade Comparison Page**
  - [x] Fetch data (`GET /api/v1/statistics/by-brand`, `/api/v1/statistics/by-grade`)
  - [x] Таблица: Brand × (avg cost/L, avg consumption, count)
  - [x] Таблица: Grade × (avg cost/L, avg consumption, count)
  - [x] Sorting по колонкам
  - [x] Vehicle filter
  - [x] Period filter
  - [x] Export to CSV functionality

- [x] **Advanced Charts** (опционально)
  - [x] Интеграция с существующими charts на Dashboard
  - [x] Responsive design для таблиц

### 1.6. User Settings (Приоритет: НИЗКИЙ) ✅
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
  - [x] Confirmation dialog с предупреждением
  - [x] Понятное объяснение последствий

---

## Phase 2: Polish & UX Enhancements 🎨

### 2.1. Error Handling & Feedback
- [ ] Централизованный error handler для API
- [ ] Toast notifications (success, error, warning)
- [ ] Inline form errors с понятными сообщениями
- [ ] Retry logic для failed requests
- [ ] Network error states

### 2.2. Loading States
- [ ] Skeleton loaders для списков
- [ ] Spinner для кнопок (loading buttons)
- [ ] Optimistic UI updates где возможно
- [ ] Suspense boundaries для code splitting

### 2.3. Empty States
- [ ] Красивые empty states для всех списков
- [ ] Onboarding tooltips для первых действий
- [ ] Помощь пользователю ("Add your first vehicle")

### 2.4. Mobile Responsive
- [ ] Тестирование на разных размерах экрана (≥360px)
- [ ] Mobile-friendly navigation (hamburger menu)
- [ ] Touch-friendly кнопки и формы
- [ ] Адаптивные таблицы (cards на mobile)

### 2.5. Accessibility (a11y)
- [x] Keyboard navigation (Tab, Enter, Esc)
- [x] ARIA labels для всех интерактивных элементов
- [x] Focus indicators
- [x] Screen reader testing
- [x] Color contrast проверка

---

## Phase 3: Testing & Quality Assurance 🧪

### 3.1. Frontend Testing
- [x] Unit tests для utils и helpers
- [x] Component tests (Testing Library)
- [x] Integration tests для forms
- [x] API mocking для tests
- [x] Coverage target: 70%+

### 3.2. E2E Testing
- [x] Setup Playwright 
- [x] Critical user flows:
  - [x] Sign Up → Add Vehicle → Add Fuel Entry → View Dashboard
  - [x] Sign In → Edit Entry → View Statistics → Sign Out

### 3.3. Performance Testing
- [ ] Lighthouse audit (target: 90+ score)
- [ ] Bundle size analysis
- [ ] Lazy loading проверка
- [ ] Image optimization

---

## Phase 4: Deployment & Documentation 🚀

### 4.1. Production Configuration
- [ ] Production docker-compose.yml
- [ ] Environment-specific configs
- [ ] Health checks для всех сервисов
- [ ] Gunicorn configuration
- [ ] Nginx reverse proxy (опционально)


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
- [ ] Full smoke test на production
- [ ] Monitoring setup (logs, metrics)

---

## Post-MVP: Future Enhancements 🔮

**Не для текущего MVP, но для будущих версий:**

- [ ] OCR для распознавания чеков
- [ ] Mobile native apps (React Native)
- [ ] Push notifications
- [ ] Shared accounts / Fleet management
- [ ] Trip tracking с GPS
- [ ] Fuel price alerts
- [ ] Tax reports генерация
- [ ] Multi-language support (i18n)
- [ ] Dark mode theme
- [ ] Export to PDF/Excel
- [ ] API rate limiting dashboard
- [ ] Admin panel

---

## Текущий статус

**Текущая фаза:** Phase 2 - Polish & UX Enhancements
**Следующий шаг:** Начать Phase 2 - Error Handling & Feedback

**Прогресс:**
- ✅ Phase 0: Инфраструктура (100%)
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
