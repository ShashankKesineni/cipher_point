#!/bin/bash

echo "🚀 CipherPoint App Store Deployment"
echo "==================================="

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Check if logged in to Expo
if ! eas whoami &> /dev/null; then
    echo "🔐 Please login to Expo..."
    eas login
fi

echo "🌐 Step 1: Deploy Backend to Cloud"
echo "   - Go to Railway.app or Render.com"
echo "   - Connect your GitHub repository"
echo "   - Set environment variables"
echo "   - Update API_URL in App.js"

echo ""
echo "🍎 Step 2: Deploy to iOS App Store"
echo "   Prerequisites:"
echo "   - Apple Developer Account ($99/year)"
echo "   - Xcode (latest version)"
echo ""

read -p "Do you have an Apple Developer Account? (y/n): " hasAppleAccount

if [ "$hasAppleAccount" = "y" ]; then
    echo "📱 Building for iOS..."
    eas build --platform ios --profile production
    
    echo "📤 Submitting to App Store..."
    eas submit --platform ios
else
    echo "⚠️  Skipping iOS deployment - requires Apple Developer Account"
fi

echo ""
echo "🤖 Step 3: Deploy to Google Play Store"
echo "   Prerequisites:"
echo "   - Google Play Console ($25 one-time fee)"
echo ""

read -p "Do you have a Google Play Console account? (y/n): " hasGoogleAccount

if [ "$hasGoogleAccount" = "y" ]; then
    echo "📱 Building for Android..."
    eas build --platform android --profile production
    
    echo "📤 Submitting to Play Store..."
    eas submit --platform android
else
    echo "⚠️  Skipping Android deployment - requires Google Play Console"
fi

echo ""
echo "✅ Deployment process completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Wait for app store review (1-7 days)"
echo "2. Monitor app store analytics"
echo "3. Respond to user reviews"
echo "4. Plan marketing strategy"
echo ""
echo "🎉 Your app will be available worldwide!" 