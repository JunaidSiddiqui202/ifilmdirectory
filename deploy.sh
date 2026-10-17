#!/bin/bash

# iFilmDirectory Deployment Script
# This script updates PWA version, builds, and deploys your app to Firebase Hosting

echo "🚀 Starting iFilmDirectory Deployment..."
echo ""

# Step 1: Update PWA version for iOS cache busting
echo "📦 Step 1/3: Updating PWA version..."
./update-pwa-version.sh
echo ""

# Step 2: Build the application
echo "🔨 Step 2/3: Building production version..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    
    # Step 2: Deploy to Firebase
    if command -v firebase &> /dev/null; then
        firebase deploy --only hosting
    else
        npx -y firebase-tools deploy --only hosting
    fi
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Deployment successful!"
        echo ""
        echo "Your app is now live at:"
        echo "https://ifilmdirectory-94b82.web.app"
        echo ""
        echo "📱 iOS PWA Users - To update your app:"
        echo "   Method 1 (Recommended):"
        echo "   • Open Safari and go to your website"
        echo "   • Pull down to refresh the page"
        echo "   • Click 'OK' when prompted to reload"
        echo ""
        echo "   Method 2 (If Method 1 doesn't work):"
        echo "   • Delete the PWA icon from home screen"
        echo "   • Open Safari and visit the website"
        echo "   • Add to Home Screen again"
        echo ""
        echo "🔍 Verify update: https://ifilmdirectory-94b82.web.app/manifest.json"
        echo "   (Check that version number has changed)"
        echo ""
    else
        echo "❌ Deployment failed. Please check the error messages above."
        exit 1
    fi
else
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi
