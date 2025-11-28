# Fuel Tracker

An MVP application for tracking vehicle fuel consumption.

> **🏆 Built during a 1-day DataArt hackathon** - This application was developed as part of a 24-hour coding challenge, demonstrating rapid prototyping and full-stack development capabilities.

## 🚀 Features

- ⛽ **Fuel Entry Tracking** - Log every refueling with complete details
- 📊 **Consumption Analytics** - Automatic calculation of fuel consumption (L/100km)
- 💰 **Expense Tracking** - Monitor fuel costs and cost per kilometer
- 🚗 **Multiple Vehicles** - Manage several vehicles
- 📈 **Charts and Statistics** - Visualize consumption and price trends
- 🔒 **Security** - Session-based authentication, CSRF protection, data isolation
- 🌍 **Multilingual** - Support for metric and imperial measurement systems

## 📋 Technology Stack

### Backend
- **Django 5.2** + **Django REST Framework 3.16**
- **PostgreSQL 15** - main database
- **Redis 7** - caching
- **drf-spectacular** - OpenAPI/Swagger documentation
- **Session Authentication** with CSRF protection

### Frontend
- **React 18** + **TypeScript**
- **Vite** - build tool
- **Zustand** - state management
- **TanStack Query** - server state
- **shadcn/ui** - UI components
- **Tailwind CSS** - styling

## 📦 Quick Start

### Requirements

- Docker and Docker Compose
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Logan27/fuel-tracker.git
cd fuel-tracker

# 2. Create .env files (see DEPLOYMENT.md)
cp fuel-tracker-backend/.env.example fuel-tracker-backend/.env
cp fuel-tracker-frontend/.env.example fuel-tracker-frontend/.env

# 3. Run with Docker
docker compose up --build
```

**Detailed instructions:** See [DEPLOYMENT.md](DEPLOYMENT.md)

### Production Build

For a production deployment with an optimized frontend:

```bash
# Production mode with nginx
docker compose -f docker-compose.prod.yml up --build

# Or local build
# Windows:
build-frontend.bat

# Linux/Mac:
chmod +x build-frontend.sh
./build-frontend.sh
```

### Accessing the Application

**Local Development:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/api/v1/schema/swagger-ui/
- **ReDoc:** http://localhost:8000/api/v1/schema/redoc/

**Production (Live Demo):**
- **Application:** https://fuel-tracker.logan27.store
- **API:** https://fuel-tracker.logan27.store/api
- **API Docs:** https://fuel-tracker.logan27.store/api/v1/schema/swagger-ui/

### Test Users

- **demo@example.com** / `demo123`
- **test@example.com** / `test123`

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide (Docker, HTTPS, environment setup)
- **[docs/brd.md](docs/brd.md)** - Business requirements document
- **[docs/arch.md](docs/arch.md)** - System architecture and design
- **[docs/rest-api.md](docs/rest-api.md)** - REST API specification
- **[docs/security-audit.md](docs/security-audit.md)** - Security audit report
- **[docs/roadmap.md](docs/roadmap.md)** - Development roadmap and milestones
- **[docs/test-cases.md](docs/test-cases.md)** - Test cases and QA documentation
- **[SECURITY.md](fuel-tracker-backend/SECURITY.md)** - Security policy and best practices

## 🔐 Security

The project has undergone a security audit with a focus on:
- ✅ Input validation (XSS protection with `bleach`)
- ✅ Authentication & Authorization (session-based + CSRF)
- ✅ SQL Injection protection (Django ORM)
- ✅ DoS Protection (rate limiting, pagination)
- ✅ Account lockout (brute force protection)
- ✅ Secure sessions & cookies
- ✅ CORS & CSRF configuration

See [docs/security-audit.md](docs/security-audit.md) for details.

## 🧪 Testing

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

## 🛠️ Development

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

## 📊 Architecture

### Backend
- **Row-Level Security** - user data is isolated
- **Service Layer** - business logic in `services.py`
- **Automatic Metrics** - metric calculation upon record creation
- **Cascade Recalculation** - recalculation of dependent data on changes
- **Redis Caching** - statistics caching (60s TTL)

### Frontend
- **Feature-Sliced Design (FSD)** - modular architecture
- **Zustand** - global state
- **TanStack Query** - server state with caching
- **React Hook Form + Zod** - form validation
- **Lazy Loading** - page load optimization

## 🌟 Implementation Features

### Automatic Metric Calculation
When adding a fuel entry, the following are automatically calculated:
- Price per liter (`unit_price`)
- Distance since last refueling (`distance_since_last`)
- Fuel consumption (`consumption_l_100km`)
- Cost per kilometer (`cost_per_km`)

### Cascade Recalculations
When editing/deleting a record:
- Metrics of all subsequent records are automatically recalculated
- Data integrity is maintained
- Transactional safety

### Data Security
- All queries are filtered by the current user
- Access to other users' data via the API is not possible
- Proper permissions on all endpoints

## 🐳 Docker

The project is fully containerized:

```yaml
services:
  - backend (Django + Gunicorn)
  - frontend (Vite dev server)
  - postgres (PostgreSQL 15)
  - redis (Redis 7)
```

Healthchecks for all services ensure the correct startup order.

## 📈 Production Ready

The code is ready for deployment:
- ✅ Environment variables for all settings
- ✅ Proper error handling and logging
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ HTTPS with Let's Encrypt SSL
- ✅ Single-domain deployment configuration
- ✅ Database migrations
- ✅ Static files handling
- ✅ Comprehensive tests (91% backend coverage)
- ✅ Docker production builds with Gunicorn
- ✅ Nginx reverse proxy configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project was created for demonstration purposes.

## 👤 Author

Anton Utorov
- Email: anton.utorov@gmail.com
- GitHub: [@Logan27](https://github.com/Logan27)

## 🙏 Acknowledgments

- [Django REST Framework](https://www.django-rest-framework.org/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Project Status:** ✅ MVP Complete | 🔒 Security Audited | 📦 Production Ready