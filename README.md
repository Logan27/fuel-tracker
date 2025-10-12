# Fuel Tracker

MVP приложение для отслеживания расхода топлива транспортных средств.

## 🚀 Возможности

- ⛽ **Отслеживание заправок** - Регистрация каждой заправки с полными деталями
- 📊 **Аналитика расхода** - Автоматический расчёт расхода топлива (л/100км)
- 💰 **Учёт расходов** - Отслеживание стоимости топлива и затрат на километр
- 🚗 **Несколько автомобилей** - Управление несколькими транспортными средствами
- 📈 **Графики и статистика** - Визуализация трендов потребления и цен
- 🔒 **Безопасность** - Session-based аутентификация, CSRF защита, изоляция данных
- 🌍 **Мультиязычность** - Поддержка метрической и имперской системы измерений

## 📋 Технологический стек

### Backend
- **Django 5.2** + **Django REST Framework 3.16**
- **PostgreSQL 15** - основная БД
- **Redis 7** - кэширование
- **drf-spectacular** - OpenAPI/Swagger документация
- **Session Authentication** с CSRF защитой

### Frontend
- **React 18** + **TypeScript**
- **Vite** - build tool
- **Zustand** - state management
- **TanStack Query** - server state
- **shadcn/ui** - UI компоненты
- **Tailwind CSS** - стилизация

## 📦 Быстрый старт

### Требования

- Docker и Docker Compose
- Git

### Установка

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/Logan27/fuel-tracker.git
cd fuel-tracker

# 2. Создайте .env файлы (см. SETUP.md)
cp fuel-tracker-backend/.env.example fuel-tracker-backend/.env
cp fuel-tracker-frontend/.env.example fuel-tracker-frontend/.env

# 3. Запустите с Docker
docker compose up --build
```

**Подробные инструкции:** См. [SETUP.md](SETUP.md)

### Доступ к приложению

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/api/v1/schema/swagger-ui/
- **ReDoc:** http://localhost:8000/api/v1/schema/redoc/

### Тестовые пользователи

- **demo@example.com** / `demo123`
- **test@example.com** / `test123`

## 📚 Документация

- **[SETUP.md](SETUP.md)** - Инструкции по установке и настройке
- **[docs/brd.md](docs/brd.md)** - Бизнес-требования
- **[docs/arch.md](docs/arch.md)** - Архитектура системы
- **[docs/rest-api.md](docs/rest-api.md)** - REST API спецификация
- **[docs/security-audit.md](docs/security-audit.md)** - Отчёт по безопасности
- **[docs/roadmap.md](docs/roadmap.md)** - План разработки
- **[SECURITY.md](fuel-tracker-backend/SECURITY.md)** - Политика безопасности

## 🔐 Безопасность

Проект прошёл security audit с фокусом на:
- ✅ Input validation (XSS защита с `bleach`)
- ✅ Authentication & Authorization (session-based + CSRF)
- ✅ SQL Injection защита (Django ORM)
- ✅ DoS Protection (rate limiting, pagination)
- ✅ Account lockout (защита от brute force)
- ✅ Secure sessions & cookies
- ✅ CORS & CSRF configuration

См. [docs/security-audit.md](docs/security-audit.md) для деталей.

## 🧪 Тестирование

### Backend (91% coverage)

```bash
cd fuel-tracker-backend
python manage.py test
coverage run --source='.' manage.py test
coverage report
```

### Frontend

```bash
cd fuel-tracker-frontend
npm run test
npm run test:coverage
```

## 🛠️ Разработка

### Backend

```bash
cd fuel-tracker-backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd fuel-tracker-frontend
npm install
npm run dev
```

## 📊 Архитектура

### Backend
- **Row-Level Security** - данные пользователей изолированы
- **Service Layer** - бизнес-логика в `services.py`
- **Automatic Metrics** - расчёт метрик при создании записей
- **Cascade Recalculation** - пересчёт зависимых данных при изменениях
- **Redis Caching** - кэширование статистики (60s TTL)

### Frontend
- **Feature-Sliced Design (FSD)** - модульная архитектура
- **Zustand** - глобальное состояние
- **TanStack Query** - server state с кэшированием
- **React Hook Form + Zod** - валидация форм
- **Lazy Loading** - оптимизация загрузки страниц

## 🌟 Особенности реализации

### Автоматический расчёт метрик
При добавлении заправки автоматически вычисляются:
- Цена за литр (`unit_price`)
- Пробег с последней заправки (`distance_since_last`)
- Расход топлива (`consumption_l_100km`)
- Стоимость на километр (`cost_per_km`)

### Каскадные пересчёты
При редактировании/удалении записи:
- Автоматически пересчитываются метрики всех последующих записей
- Поддерживается целостность данных
- Транзакционная безопасность

### Безопасность данных
- Все запросы фильтруются по текущему пользователю
- Невозможен доступ к чужим данным через API
- Proper permissions на всех endpoints

## 🐳 Docker

Проект полностью докеризирован:

```yaml
services:
  - backend (Django + Gunicorn)
  - frontend (Vite dev server)
  - postgres (PostgreSQL 15)
  - redis (Redis 7)
```

Healthchecks для всех сервисов обеспечивают правильный порядок запуска.

## 📈 Production Ready

Код готов к деплою:
- ✅ Environment variables для всех настроек
- ✅ Proper error handling и logging
- ✅ Security headers
- ✅ HTTPS ready (настройка в production)
- ✅ Database migrations
- ✅ Static files handling
- ✅ Comprehensive tests

## 🤝 Contributing

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 License

Этот проект создан для демонстрационных целей.

## 👤 Автор

Anton Utorov
- Email: anton.utorov@gmail.com
- GitHub: [@Logan27](https://github.com/Logan27)

## 🙏 Acknowledgments

- [Django REST Framework](https://www.django-rest-framework.org/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Статус проекта:** ✅ MVP Complete | 🔒 Security Audited | 📦 Production Ready

