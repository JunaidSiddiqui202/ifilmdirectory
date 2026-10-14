#!/bin/bash

# PWA Version Update Script
# This script updates version numbers in service worker and manifest before deployment
# Run this before every deployment to ensure iOS PWAs update properly

echo "🚀 Updating PWA version for deployment..."

# Generate timestamp-based version
TIMESTAMP=$(date +"%Y%m%d%H%M")
VERSION="v2-$(date +"%Y-%m-%d-%H-%M")"

echo "📦 New version: $VERSION"
echo "🔢 Timestamp: $TIMESTAMP"

# Update service-worker.js
echo "📝 Updating service-worker.js..."
sed -i '' "s/const CACHE_VERSION = '.*';/const CACHE_VERSION = '$VERSION';/" public/service-worker.js

# Update manifest.json version
echo "📝 Updating manifest.json..."
sed -i '' "s/\"version\": \".*\",/\"version\": \"2.0.$TIMESTAMP\",/" public/manifest.json
sed -i '' "s/\"start_url\": \".*\",/\"start_url\": \"\/?v=$TIMESTAMP\",/" public/manifest.json

echo "✅ Version updated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Build the app: npm run build"
echo "2. Deploy to Firebase: firebase deploy"
echo ""
echo "🍎 For iOS users:"
echo "- Users should delete the old PWA icon from home screen"
echo "- Re-add the PWA from Safari"
echo "- The new version will be loaded"
