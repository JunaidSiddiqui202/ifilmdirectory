#!/bin/bash

# Firebase Blaze Plan Deployment Script
# This script helps you safely deploy to Firebase with cost controls

set -e  # Exit on error

echo "🚀 Firebase Blaze Plan Deployment"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found!${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI found${NC}"
echo ""

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase${NC}"
    echo "Logging in..."
    firebase login
fi

echo -e "${GREEN}✅ Logged in to Firebase${NC}"
echo ""

# Show current project
echo "📋 Current Firebase Project:"
firebase use
echo ""

# Warning about Blaze plan
echo -e "${YELLOW}⚠️  IMPORTANT: Blaze Plan Requirements${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Before deploying Cloud Functions, ensure:"
echo "  1. ✅ Budget alert is set ($5/month recommended)"
echo "  2. ✅ Blaze plan is activated"
echo "  3. ✅ Billing account is configured"
echo ""
echo "Set budget at: https://console.cloud.google.com/billing"
echo ""
read -p "Have you set up budget alerts? (yes/no): " budget_confirm

if [ "$budget_confirm" != "yes" ]; then
    echo -e "${RED}❌ Please set up budget alerts first!${NC}"
    echo "Visit: https://console.cloud.google.com/billing"
    exit 1
fi

echo ""
read -p "Is Blaze plan activated? (yes/no): " blaze_confirm

if [ "$blaze_confirm" != "yes" ]; then
    echo -e "${RED}❌ Please activate Blaze plan first!${NC}"
    echo "Visit: https://console.firebase.google.com/project/ifilmdirectory-94b82"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Prerequisites confirmed${NC}"
echo ""

# Deployment options
echo "🎯 What would you like to deploy?"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Firestore rules and indexes only (FREE)"
echo "  2. Cloud Functions only (Requires Blaze)"
echo "  3. Hosting only (FREE)"
echo "  4. Everything (Firestore + Functions + Hosting)"
echo "  5. Cancel"
echo ""
read -p "Enter your choice (1-5): " deploy_choice

case $deploy_choice in
    1)
        echo ""
        echo "📦 Deploying Firestore rules and indexes..."
        firebase deploy --only firestore
        ;;
    2)
        echo ""
        echo "⚠️  Deploying Cloud Functions (Blaze plan required)"
        echo "This will incur costs based on usage."
        echo ""
        read -p "Continue? (yes/no): " functions_confirm
        if [ "$functions_confirm" = "yes" ]; then
            echo "Building functions..."
            cd functions
            npm run build
            cd ..
            echo "Deploying functions..."
            firebase deploy --only functions
        else
            echo "Cancelled."
            exit 0
        fi
        ;;
    3)
        echo ""
        echo "📦 Deploying Hosting..."
        
        # Auto-update Service Worker version
        VERSION_TAG="v$(date +'%Y-%m-%d-%H-%M')"
        echo "📝 Updating Service Worker version to: $VERSION_TAG"
        sed -i '' "s/const CACHE_VERSION = '.*';/const CACHE_VERSION = '$VERSION_TAG';/" public/service-worker.js
        
        echo "Building app..."
        npm run build
        echo "Deploying to Firebase Hosting..."
        firebase deploy --only hosting
        ;;
    4)
        echo ""
        echo "📦 Deploying EVERYTHING..."
        echo "⚠️  This includes Cloud Functions (Blaze plan required)"
        echo ""
        read -p "Continue with full deployment? (yes/no): " full_confirm
        if [ "$full_confirm" = "yes" ]; then
            # Auto-update Service Worker version
            VERSION_TAG="v$(date +'%Y-%m-%d-%H-%M')"
            echo "📝 Updating Service Worker version to: $VERSION_TAG"
            sed -i '' "s/const CACHE_VERSION = '.*';/const CACHE_VERSION = '$VERSION_TAG';/" public/service-worker.js

            echo "Building app..."
            npm run build
            echo "Building functions..."
            cd functions
            npm run build
            cd ..
            echo "Deploying everything..."
            firebase deploy
        else
            echo "Cancelled."
            exit 0
        fi
        ;;
    5)
        echo "Cancelled."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📊 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Monitor usage: https://console.firebase.google.com/project/ifilmdirectory-94b82/usage"
echo "  2. Check billing: https://console.cloud.google.com/billing/reports"
echo "  3. View functions logs: firebase functions:log"
echo ""
echo "💡 Cost Optimization Tips:"
echo "  - Monitor daily for the first week"
echo "  - Check billing reports weekly"
echo "  - Rate limiting is already enabled"
echo "  - Functions use minimum memory (256MB)"
echo ""
echo "🎉 Happy deploying!"
