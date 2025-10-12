FROM python:3.11-slim

# Устанавливаем curl для healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Рабочая директория
WORKDIR /app

# Копируем requirements и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь проект
COPY . .

# Создаём директорию для логов
RUN mkdir -p /app/logs

# Expose порт
EXPOSE 8000

# Команда по умолчанию (можно переопределить в docker-compose.yml)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

