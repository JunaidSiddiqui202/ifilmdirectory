# 📱 Android App Setup Guide for iFilmDirectory

This guide covers both **PWA (Progressive Web App)** and **Native Android App** setup.

---

## 🚀 Quick Start: PWA (Already Implemented!)

Your app is now a **Progressive Web App** and can be installed directly from the browser!

### ✅ What's Already Done:

1. ✅ PWA Manifest configured
2. ✅ Service Worker for offline support
3. ✅ App icons generated (all sizes)
4. ✅ Meta tags for Android/iOS
5. ✅ Theme colors configured

### 📲 How Users Install the PWA:

**On Android (Chrome/Edge):**
1. Visit `https://ifilmdirectory.com` on their phone
2. Tap the **menu (⋮)** in the browser
3. Select **"Add to Home screen"** or **"Install app"**
4. The app icon will appear on their home screen
5. Opens like a native app (no browser UI)

**On iOS (Safari):**
1. Visit the site in Safari
2. Tap the **Share** button
3. Select **"Add to Home Screen"**

---

## 📦 Native Android App (Google Play Store)

To publish on Google Play Store, we'll use **Capacitor** to wrap your web app.

### Step 1: Install Capacitor

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Initialize Capacitor
npx cap init "iFilmDirectory" "com.ifilmdirectory.app" --web-dir=dist
```

### Step 2: Add Android Platform

```bash
# Add Android platform
npx cap add android

# Sync your web app to Android
npm run build
npx cap sync
```

### Step 3: Open in Android Studio

```bash
# Open the Android project in Android Studio
npx cap open android
```

This will open Android Studio where you can:
- Build the APK
- Test on emulator
- Generate signed APK for Play Store

### Step 4: Build APK

**In Android Studio:**
1. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete
3. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

**For Production (Signed APK):**
1. Go to **Build → Generate Signed Bundle / APK**
2. Create a keystore (first time only)
3. Build release APK
4. Upload to Google Play Console

---

## 🎨 App Configuration

### App Details (Already Configured):

- **App Name:** iFilmDirectory
- **Package Name:** com.ifilmdirectory.app
- **Theme Color:** #8b5cf6 (Purple)
- **Background Color:** #0a0a0a (Dark)
- **Orientation:** Portrait

### Icon Sizes Generated:

- ✅ 72x72
- ✅ 96x96
- ✅ 128x128
- ✅ 144x144
- ✅ 152x152
- ✅ 192x192
- ✅ 384x384
- ✅ 512x512

---

## 🔧 Capacitor Configuration

Create `capacitor.config.ts` in the root:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ifilmdirectory.app',
  appName: 'iFilmDirectory',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0a0a",
      showSpinner: false
    }
  }
};

export default config;
```

---

## 📋 Pre-Publishing Checklist

### Before Publishing to Play Store:

- [ ] Test app thoroughly on Android device
- [ ] Update version number in `android/app/build.gradle`
- [ ] Create app screenshots (required by Play Store)
- [ ] Write app description
- [ ] Create privacy policy URL
- [ ] Generate signed APK with release keystore
- [ ] Test signed APK on real device

### Google Play Store Requirements:

1. **Developer Account** ($25 one-time fee)
2. **Privacy Policy** (required for all apps)
3. **App Screenshots** (minimum 2, recommended 8)
4. **Feature Graphic** (1024x500px)
5. **App Icon** (512x512px) ✅ Already have!
6. **Content Rating** (fill questionnaire)
7. **Target API Level** (Android 13+ required)

---

## 🚀 Deployment Commands

### Deploy Web App (PWA):
```bash
npm run build
firebase deploy --only hosting
```

### Update Native Android App:
```bash
# After making changes to web app
npm run build
npx cap sync
npx cap open android
# Then rebuild in Android Studio
```

---

## 🔄 Update Workflow

When you make changes:

1. **Update web code**
2. **Build:** `npm run build`
3. **Deploy web:** `firebase deploy --only hosting`
4. **Sync to Android:** `npx cap sync`
5. **Rebuild APK** in Android Studio
6. **Upload new version** to Play Store

---

## 📱 Testing

### Test PWA:
1. Deploy to Firebase
2. Open on phone: `https://ifilmdirectory.com`
3. Install to home screen
4. Test all features

### Test Native App:
1. Build APK in Android Studio
2. Install on physical Android device
3. Test all features
4. Check permissions (camera, storage, etc.)

---

## 🎯 Features Available

### PWA Features:
- ✅ Offline support (via Service Worker)
- ✅ Add to home screen
- ✅ Full-screen experience
- ✅ Push notifications (can be added)
- ✅ Background sync (can be added)

### Native App Additional Features:
- ✅ Better performance
- ✅ Native device APIs
- ✅ App store presence
- ✅ Better offline experience
- ✅ Native notifications

---

## 📞 Support & Resources

- **Capacitor Docs:** https://capacitorjs.com/docs
- **PWA Checklist:** https://web.dev/pwa-checklist/
- **Google Play Console:** https://play.google.com/console
- **Android Studio:** https://developer.android.com/studio

---

## 🎉 Next Steps

1. **Test PWA** - It's already live! Visit on mobile and install
2. **Install Capacitor** - Run the commands in Step 1
3. **Build Android App** - Follow Step 2-4
4. **Publish to Play Store** - Follow the checklist

---

## 💡 Pro Tips

- **PWA is instant** - Users can install right now!
- **Native app takes time** - Play Store review can take 1-7 days
- **Both can coexist** - PWA for quick access, native for app store
- **Update PWA instantly** - Just deploy, no app store approval
- **Update native app** - Requires Play Store review for each update

---

**Your app is already installable as a PWA! 🎉**

Just visit `https://ifilmdirectory.com` on Android and tap "Add to Home screen"!
