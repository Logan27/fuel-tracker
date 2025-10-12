# Setup Instructions

Инструкции по запуску проекта Fuel Tracker после `git clone`.

## Требования

- **Docker** и **Docker Compose**
- **Git**
- Открытые порты: 3000 (frontend), 8000 (backend), 5432 (postgres), 6379 (redis)

## Быстрый старт

### 1. Клонируйте репозиторий

```bash
git clone https://github.com/Logan27/fuel-tracker.git
cd fuel-tracker
```

### 2. Создайте файл `.env` для backend

```bash
cd fuel-tracker-backend
```

Создайте файл `.env` со следующим содержимым:

```env
# Django
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True

# Database
DB_NAME=fuel_tracker
DB_USER=fuel_user
DB_PASSWORD=fuel_password
DB_HOST=postgres
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Security
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:8000
```

**⚠️ ВАЖНО:** Измените `SECRET_KEY` на случайную строку для production!

```bash
# Генерация SECRET_KEY (Python)
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Создайте файл `.env` для frontend

```bash
cd ../fuel-tracker-frontend
```

Создайте файл `.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 4. Вернитесь в корневую директорию

```bash
cd ..
```

### 5. Запустите Docker Compose

```bash
docker compose up --build
```

При первом запуске:
- Будут созданы Docker образы
- Применятся миграции базы данных
- Создадутся тестовые пользователи

**Время первого запуска:** ~5-10 минут

### 6. Откройте приложение

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/api/v1/schema/swagger-ui/
- **ReDoc:** http://localhost:8000/api/v1/schema/redoc/

## Тестовые пользователи

После первого запуска автоматически создаются:

- **demo@example.com** / `demo123`
- **test@example.com** / `test123`

## Управление Docker

```bash
# Запуск в фоновом режиме
docker compose up -d

# Остановка
docker compose down

# Остановка с удалением volumes (БД будет очищена!)
docker compose down -v

# Просмотр логов
docker compose logs -f

# Просмотр логов конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend

# Перезапуск сервиса
docker compose restart backend
```

## Локальная разработка (без Docker)

### Backend

```bash
cd fuel-tracker-backend

# Создайте виртуальное окружение
python -m venv venv

# Активируйте (Windows)
.\venv\Scripts\activate

# Активируйте (Linux/Mac)
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt

# Примените миграции
python manage.py migrate

# Создайте тестовые данные
python manage.py seed_dev_data

# Запустите сервер
python manage.py runserver
```

**Примечание:** Для локальной разработки нужны PostgreSQL и Redis.

### Frontend

```bash
cd fuel-tracker-frontend

# Установите зависимости
npm install

# Запустите dev server
npm run dev
```

## Тестирование

### Backend

```bash
cd fuel-tracker-backend

# Все тесты
python manage.py test

# Конкретное приложение
python manage.py test api

# С coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Frontend

```bash
cd fuel-tracker-frontend

# Запустить тесты
npm run test

# UI режим
npm run test:ui

# Coverage
npm run test:coverage
```

## Проблемы и решения

### Порты заняты

Если порты 3000, 8000, 5432 или 6379 уже используются:

1. Остановите конфликтующие сервисы
2. Или измените порты в `docker-compose.yml`

### CSRF ошибки

Убедитесь, что в `.env` backend указаны правильные `CSRF_TRUSTED_ORIGINS`:

```env
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Ошибки импортов в frontend

```bash
# Очистите node_modules и переустановите
cd fuel-tracker-frontend
rm -rf node_modules package-lock.json
npm install
```

### База данных не создаётся

```bash
# Пересоздайте volumes
docker compose down -v
docker compose up --build
```

### Docker permission errors (Linux)

```bash
# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER

# Перелогиньтесь
newgrp docker
```

## Production Deployment

См. документацию:
- `docs/arch.md` - Архитектура
- `SECURITY.md` - Безопасность
- `GITHUB_SETUP.md` - Git workflow

**⚠️ Перед production:**

1. Измените `SECRET_KEY`
2. Установите `DEBUG=False`
3. Настройте `ALLOWED_HOSTS`
4. Используйте реальные домены в `CORS_ALLOWED_ORIGINS` и `CSRF_TRUSTED_ORIGINS`
5. Настройте HTTPS
6. Используйте управляемые БД сервисы
7. Настройте бэкапы

## Дополнительные ресурсы

- [Документация](docs/)
- [REST API спецификация](docs/rest-api.md)
- [Roadmap](docs/roadmap.md)
- [Security Audit](docs/security-audit.md)

## Поддержка

Создайте issue на GitHub: https://github.com/Logan27/fuel-tracker/issues

