#!/bin/bash
# Script for local frontend build

echo "🔨 Building frontend..."

cd fuel-tracker-frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build production bundle
echo "🏗️  Building production bundle..."
npm run build

echo "✅ Build complete! Files are in fuel-tracker-frontend/dist/"
echo "📊 Build size:"
du -sh dist/

cd ..

