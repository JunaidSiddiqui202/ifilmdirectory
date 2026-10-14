# 🔔 Push Notifications Setup Guide

## Overview
This guide will help you set up push notifications so you receive alerts (with sound) on your mobile device when users submit access requests.

## 📋 Prerequisites
- Firebase project (already set up ✅)
- Admin access to Firebase Console
- Your mobile device with the PWA installed

---

## 🚀 Step-by-Step Setup

### Step 1: Get Your VAPID Key (Web Push Certificate)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ifilmdirectory-94b82**
3. Click the ⚙️ gear icon → **Project settings**
4. Go to the **Cloud Messaging** tab
5. Scroll down to **Web Push certificates**
6. If you don't have one, click **Generate key pair**
7. Copy the **Key pair** value (starts with `B...`)

### Step 2: Add VAPID Key to Your App

1. Open your `.env` file in the `ifilm-app` folder
2. Add this line:
   ```
   VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
   ```
3. Replace `YOUR_VAPID_KEY_HERE` with the key you copied
4. Save the file

### Step 3: Mark Yourself as Admin

You need to add the `role: "admin"` field to your user document in Firestore:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database**
3. Find the `users` collection
4. Find your user document (search by your email)
5. Click **Edit** (pencil icon)
6. Add a new field:
   - **Field**: `role`
   - **Type**: `string`
   - **Value**: `admin`
7. Click **Update**

### Step 4: Enable FCM in Your App

Update your `AuthContext.tsx` to register for notifications when you log in.

Add this code after successful login:

```typescript
import { registerFCMToken } from '../services/fcmService';

// After user logs in successfully
if (user) {
    // Register for push notifications
    registerFCMToken(user.uid).then(token => {
        if (token) {
            console.log('Push notifications enabled!');
        }
    });
}
```

### Step 5: Deploy Cloud Functions

Run these commands:

```bash
cd /Volumes/JUNAID/CODES/iFilmDirectory/ifilm-app
firebase deploy --only functions
```

This will deploy the Cloud Functions that send notifications when access requests are submitted.

### Step 6: Test on Your Mobile Device

1. **Install the PWA** on your mobile device:
   - Open `https://iFilmDirectory.com` in Chrome (Android) or Safari (iOS)
   - Tap "Add to Home Screen" or "Install"

2. **Log in as admin** in the PWA

3. **Allow notifications** when prompted

4. **Test it**:
   - Open another browser/device
   - Go to `https://iFilmDirectory.com/login?tab=request`
   - Submit a test access request
   - You should receive a push notification with sound! 🔔

---

## 🎯 What Happens When Someone Requests Access

1. User fills out the Request Access form
2. Form data is saved to Firestore `access_requests` collection
3. Cloud Function triggers automatically
4. Function creates an in-app notification
5. Function sends push notification to all admin users
6. **You receive notification on your phone with sound** 📱🔔
7. Clicking the notification opens the Admin Dashboard

---

## 🔧 Troubleshooting

### Not receiving notifications?

1. **Check browser permissions**:
   - Make sure notifications are allowed in browser settings
   - On mobile, check app notification settings

2. **Check your admin role**:
   - Verify `role: "admin"` is set in your Firestore user document

3. **Check FCM token**:
   - Open browser console
   - Look for "FCM Token obtained" message
   - Verify `fcmToken` field exists in your user document

4. **Check Cloud Functions logs**:
   ```bash
   firebase functions:log
   ```

### Sound not playing?

- Make sure your device is not in silent mode
- Check notification sound settings in your device settings
- Some browsers require user interaction before playing sounds

---

## 📱 Notification Features

✅ **Sound**: Default notification sound
✅ **Vibration**: Custom vibration pattern
✅ **Badge**: Shows app icon
✅ **Persistent**: Notification stays until dismissed
✅ **Clickable**: Opens Admin Dashboard
✅ **Background**: Works even when app is closed

---

## 💰 Cost Considerations

- **Cloud Functions**: Free tier includes 2M invocations/month
- **FCM**: Completely free, unlimited notifications
- **Firestore**: Minimal reads/writes for notifications

For your use case (access requests), this will be **completely free** under Firebase's free tier.

---

## 🎉 You're All Set!

Once you complete these steps, you'll receive instant push notifications with sound whenever someone requests access to your platform!

**Questions?** Check the Firebase Console logs or browser console for debugging information.
