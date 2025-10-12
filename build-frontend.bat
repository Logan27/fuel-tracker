@echo off
REM Скрипт для локальной сборки frontend (Windows)

echo 🔨 Building frontend...

cd fuel-tracker-frontend

REM Установка зависимостей
echo 📦 Installing dependencies...
call npm install

REM Сборка production build
echo 🏗️  Building production bundle...
call npm run build

echo ✅ Build complete! Files are in fuel-tracker-frontend\dist\

cd ..

