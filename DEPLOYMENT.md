# Fuel Tracker - Production Deployment Guide

This guide provides step-by-step instructions for deploying the Fuel Tracker application in production using Docker Compose.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start (Development)](#quick-start-development)
- [Production Deployment](#production-deployment)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## Prerequisites

Before deploying, ensure you have:

- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Git** (for cloning the repository)
- **Domain name** (for production deployments)
- **SSL certificate** (recommended for production)

### Installing Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS:**
```bash
brew install --cask docker
```

**Windows:**
Download and install Docker Desktop from https://www.docker.com/products/docker-desktop

---

## Quick Start (Development)

For local development and testing:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fuel-tracker
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file with your preferred text editor. For development, the default values work fine:

```bash
nano .env  # or vim, code, etc.
```

### 3. Start the Application

```bash
docker compose up -d
```

This command will:
- Build the frontend and backend Docker images
- Start PostgreSQL database
- Start Redis cache
- Run database migrations
- Start the backend API (port 8000)
- Start the frontend dev server (port 3000)

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/v1
- **API Documentation:** http://localhost:8000/api/v1/schema/swagger-ui/

### 5. Stop the Application

```bash
docker compose down
```

To also remove volumes (database data):
```bash
docker compose down -v
```

---

## Production Deployment

For production environments, follow these steps carefully:

### 1. Clone and Prepare

```bash
git clone <repository-url>
cd fuel-tracker
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

**CRITICAL: Update these values for production:**

```bash
# Django Settings
SECRET_KEY=<generate-strong-secret-key>
DEBUG=False

# Database Configuration
DB_NAME=fuel_tracker
DB_USER=fuel_user
DB_PASSWORD=<strong-password-min-16-chars>
DB_HOST=postgres
DB_PORT=5432

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Security Settings
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend Configuration
VITE_API_URL=https://yourdomain.com/api/v1
```

#### Generating a Secure SECRET_KEY

```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

#### Password Requirements

- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, and symbols
- No dictionary words
- Use a password manager to generate

### 3. Build and Start Production Services

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This will:
- Build optimized production images
- Start all services in detached mode
- Run database migrations
- Collect static files
- Start backend with Gunicorn (4 workers)
- Serve frontend through Nginx

### 4. Verify Deployment

Check that all services are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Expected output:
```
NAME                      STATUS          PORTS
fuel-tracker-backend      running
fuel-tracker-frontend     running         0.0.0.0:80->80/tcp
fuel-tracker-postgres     running (healthy)
fuel-tracker-redis        running (healthy)
```

Check logs:
```bash
# All services
docker compose -f docker-compose.prod.yml logs

# Specific service
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
```

### 5. Create Superuser (Admin Account)

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

Follow the prompts to create an admin account.

### 6. Access the Application

- **Frontend:** http://your-server-ip (or http://yourdomain.com)
- **Backend API:** http://your-server-ip/api/v1
- **Admin Panel:** http://your-server-ip/api/v1/admin/

---

## Post-Deployment

### Setting Up SSL/HTTPS (Recommended)

For production, you should enable HTTPS. Here's how to add SSL:

#### Option 1: Using Nginx Proxy Manager (Easiest)

1. Install Nginx Proxy Manager:
```bash
docker run -d \
  --name nginx-proxy-manager \
  -p 80:80 -p 443:443 -p 81:81 \
  jc21/nginx-proxy-manager:latest
```

2. Access the admin panel at http://your-server-ip:81
3. Add a proxy host pointing to your fuel-tracker-frontend container
4. Enable SSL with Let's Encrypt

#### Option 2: Using Certbot

1. Install Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. Get SSL certificate:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. Update docker-compose.prod.yml to mount certificates

### Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### Monitoring

#### View Real-time Logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```

#### Check Container Stats

```bash
docker stats
```

#### Backend Logs Location

Backend logs are stored in a Docker volume and can be accessed:

```bash
docker compose -f docker-compose.prod.yml exec backend ls -la /app/logs/
docker compose -f docker-compose.prod.yml exec backend tail -f /app/logs/fuel_tracker.log
docker compose -f docker-compose.prod.yml exec backend tail -f /app/logs/security.log
```

---

## Troubleshooting

### Backend Container Fails to Start

**Check logs:**
```bash
docker compose logs backend
```

**Common issues:**

1. **Missing SECRET_KEY:**
   - Error: `CRITICAL SECURITY ERROR: SECRET_KEY must be set`
   - Solution: Generate and set SECRET_KEY in .env file

2. **Database connection fails:**
   - Error: `could not connect to server: Connection refused`
   - Solution: Ensure postgres container is healthy
   ```bash
   docker compose ps postgres
   ```

3. **Missing dependencies:**
   - Error: `ModuleNotFoundError: No module named 'xyz'`
   - Solution: Rebuild the backend image
   ```bash
   docker compose build --no-cache backend
   ```

### Frontend Build Fails

**Check logs:**
```bash
docker compose logs frontend
```

**Common issues:**

1. **TypeScript errors:**
   - Rebuild with latest code
   ```bash
   docker compose build --no-cache frontend
   ```

2. **Node modules issues:**
   - Clear and rebuild
   ```bash
   docker compose down
   docker volume rm fuel-tracker_node_modules
   docker compose up -d --build
   ```

### Database Issues

**Reset database (WARNING: destroys all data):**
```bash
docker compose down
docker volume rm fuel-tracker_postgres_data
docker compose up -d
```

**Create database backup:**
```bash
docker compose exec postgres pg_dump -U fuel_user fuel_tracker > backup.sql
```

**Restore database:**
```bash
cat backup.sql | docker compose exec -T postgres psql -U fuel_user fuel_tracker
```

### Redis Connection Issues

**Check Redis:**
```bash
docker compose exec redis redis-cli ping
```

Expected output: `PONG`

**Clear Redis cache:**
```bash
docker compose exec redis redis-cli FLUSHALL
```

### Permission Issues

If you encounter permission errors:

```bash
# Fix ownership of application directories
sudo chown -R $USER:$USER .

# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

---

## Maintenance

### Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart services
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Database Backups

#### Automated Backup Script

Create a backup script (`backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fuel_tracker_$TIMESTAMP.sql"

docker compose exec -T postgres pg_dump -U fuel_user fuel_tracker > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "fuel_tracker_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Make it executable and add to cron:
```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh
```

### Viewing Logs

```bash
# All logs
docker compose -f docker-compose.prod.yml logs

# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Scaling Backend Workers

To handle more traffic, increase backend workers:

Edit `docker-compose.prod.yml`:

```yaml
backend:
  command: >
    sh -c "python manage.py migrate &&
           python manage.py collectstatic --noinput &&
           gunicorn fuel_tracker.wsgi:application --bind 0.0.0.0:8000 --workers 8 --timeout 60"
```

Then restart:
```bash
docker compose -f docker-compose.prod.yml up -d backend
```

### Resource Limits

To set resource limits, edit `docker-compose.prod.yml`:

```yaml
backend:
  # ... other config
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

### Health Checks

Monitor service health:

```bash
# Check all container health
docker compose -f docker-compose.prod.yml ps

# Test backend health
curl http://localhost/api/v1/schema/

# Test frontend health
curl http://localhost/health
```

---

## Security Checklist

Before going to production, verify:

- [ ] `DEBUG=False` in .env
- [ ] Strong `SECRET_KEY` (50+ characters)
- [ ] Strong database password (16+ characters)
- [ ] `ALLOWED_HOSTS` set to specific domains (no wildcards)
- [ ] `CORS_ALLOWED_ORIGINS` set to specific HTTPS origins
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured
- [ ] Regular backups scheduled
- [ ] Monitoring/logging set up
- [ ] .env file not committed to version control
- [ ] Database port not exposed to public internet
- [ ] Redis port not exposed to public internet

---

## Support

For issues and questions:

- Check the logs: `docker compose logs`
- Review the [README.md](./README.md)
- Check [SECURITY.md](./fuel-tracker-backend/SECURITY.md) for security best practices

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Production                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Frontend   │────────>│   Backend    │                 │
│  │   (Nginx)    │         │  (Gunicorn)  │                 │
│  │   Port 80    │         │              │                 │
│  └──────────────┘         └───────┬──────┘                 │
│                                    │                         │
│                           ┌────────┴────────┐               │
│                           │                 │               │
│                    ┌──────▼──────┐   ┌─────▼──────┐        │
│                    │  PostgreSQL │   │   Redis    │        │
│                    │  (Database) │   │  (Cache)   │        │
│                    └─────────────┘   └────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Services:

1. **Frontend (Nginx)**
   - Serves static React application
   - Proxies API requests to backend
   - Port: 80 (external)

2. **Backend (Django + Gunicorn)**
   - REST API
   - Business logic
   - Port: 8000 (internal only)

3. **PostgreSQL**
   - Primary database
   - Persistent data storage
   - Port: 5432 (internal only)

4. **Redis**
   - Caching layer
   - Session storage
   - Port: 6379 (internal only)

---

## Performance Optimization

### Database Optimization

```bash
# Run database vacuum (optimize)
docker compose exec postgres psql -U fuel_user fuel_tracker -c "VACUUM ANALYZE;"
```

### Clear Cache

```bash
# Clear Redis cache
docker compose exec redis redis-cli FLUSHALL

# Or clear specific Django caches
docker compose exec backend python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
```

### Monitor Database Size

```bash
docker compose exec postgres psql -U fuel_user fuel_tracker -c "SELECT pg_size_pretty(pg_database_size('fuel_tracker'));"
```

---

## Quick Reference Commands

```bash
# Start services (development)
docker compose up -d

# Start services (production)
docker compose -f docker-compose.prod.yml up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart specific service
docker compose restart backend

# Execute commands in container
docker compose exec backend python manage.py <command>

# Access database shell
docker compose exec postgres psql -U fuel_user fuel_tracker

# Access backend shell
docker compose exec backend python manage.py shell

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Run migrations
docker compose exec backend python manage.py migrate

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Rebuild specific service
docker compose build --no-cache backend

# View container stats
docker stats
```
