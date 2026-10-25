#!/usr/bin/env bash
# ==============================================================
# CloudTune Frontend - Firebase Hosting Deployment Script
# ==============================================================
set -e

echo "=========================================================="
echo "🌐 Deploying CloudTune Frontend to Firebase Hosting"
echo "=========================================================="

# 1. Build the production React bundle
echo "Building React Vite bundle..."
cd frontend
npm run build
cd ..

# 2. Deploy using Firebase CLI
echo "Deploying to Firebase Hosting..."
npx -y firebase-tools deploy --only hosting

echo "=========================================================="
echo "🎉 Frontend Deployment Complete!"
echo "=========================================================="
