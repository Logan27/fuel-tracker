#!/bin/bash
# Скрипт для локальной сборки frontend

echo "🔨 Building frontend..."

cd fuel-tracker-frontend

# Установка зависимостей
echo "📦 Installing dependencies..."
npm install

# Сборка production build
echo "🏗️  Building production bundle..."
npm run build

echo "✅ Build complete! Files are in fuel-tracker-frontend/dist/"
echo "📊 Build size:"
du -sh dist/

cd ..

