@echo off
REM Script for local frontend build (Windows)

echo 🔨 Building frontend...

cd fuel-tracker-frontend

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Build production bundle
echo 🏗️  Building production bundle...
call npm run build

echo ✅ Build complete! Files are in fuel-tracker-frontend\dist\

cd ..

