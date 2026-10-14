#!/bin/bash

# Script to generate app icons from logo.png
# This will create all required icon sizes for Android PWA

echo "🎨 Generating app icons for iFilmDirectory..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Installing via Homebrew..."
    brew install imagemagick
fi

# Source logo
LOGO="public/logo.png"

if [ ! -f "$LOGO" ]; then
    echo "❌ Error: logo.png not found in public directory"
    exit 1
fi

# Create icons directory
mkdir -p public/icons

# Generate all icon sizes
echo "📱 Generating icon sizes..."

convert "$LOGO" -resize 72x72 public/icons/icon-72x72.png
convert "$LOGO" -resize 96x96 public/icons/icon-96x96.png
convert "$LOGO" -resize 128x128 public/icons/icon-128x128.png
convert "$LOGO" -resize 144x144 public/icons/icon-144x144.png
convert "$LOGO" -resize 152x152 public/icons/icon-152x152.png
convert "$LOGO" -resize 192x192 public/icons/icon-192x192.png
convert "$LOGO" -resize 384x384 public/icons/icon-384x384.png
convert "$LOGO" -resize 512x512 public/icons/icon-512x512.png

echo "✅ All icons generated successfully!"
echo ""
echo "Generated icons:"
ls -lh public/icons/
