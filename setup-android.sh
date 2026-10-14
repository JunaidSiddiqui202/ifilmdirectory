#!/bin/bash

# iFilmDirectory - Android App Setup Script
# This script sets up Capacitor for native Android builds

echo "📱 Setting up Android App for iFilmDirectory..."
echo ""

# Step 1: Install Capacitor dependencies
echo "📦 Step 1: Installing Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/android

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Capacitor dependencies"
    exit 1
fi

echo "✅ Capacitor installed successfully!"
echo ""

# Step 2: Build the web app
echo "🔨 Step 2: Building web app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed!"
echo ""

# Step 3: Add Android platform
echo "🤖 Step 3: Adding Android platform..."
npx cap add android

if [ $? -ne 0 ]; then
    echo "⚠️  Android platform might already exist, syncing instead..."
    npx cap sync
fi

echo "✅ Android platform ready!"
echo ""

# Step 4: Sync
echo "🔄 Step 4: Syncing web app to Android..."
npx cap sync

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Build APK in Android Studio"
echo "3. Test on device or emulator"
echo ""
echo "For detailed instructions, see: ANDROID_APP_GUIDE.md"
