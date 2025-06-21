#!/bin/bash

echo "🚀 CipherPoint Deployment Script"
echo "================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

# Initialize Railway project if not already done
if [ ! -f ".railway" ]; then
    echo "📦 Initializing Railway project..."
    railway init
fi

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app is now live and accessible from anywhere!"
echo "📱 Update your App.js with the new API URL from Railway dashboard" 