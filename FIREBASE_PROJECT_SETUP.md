# 🔧 Firebase Project Setup Guide

## Issue Found
The Firebase project `ifilmdirectory-94b82` referenced in your `.env` file doesn't exist in your Firebase account yet.

## Solution: Create the Firebase Project

### Option 1: Create via Firebase Console (Recommended - Easier)

1. **Go to Firebase Console:**
   - Open: https://console.firebase.google.com/
   - Login with: storieswriterai@gmail.com

2. **Create New Project:**
   - Click **"Add project"** or **"Create a project"**
   - Enter project name: `iFilmDirectory`
   - Click **Continue**

3. **Google Analytics (Optional):**
   - You can enable or disable Google Analytics
   - Click **Continue** or **Create project**

4. **Wait for Project Creation:**
   - Takes about 30 seconds
   - Click **Continue** when ready

5. **Get Project ID:**
   - Once created, you'll see the project dashboard
   - Note the **Project ID** (it might be different from `ifilmdirectory-94b82`)
   - It could be something like `ifilmdirectory-xxxxx`

6. **Enable Required Services:**
   
   a. **Enable Authentication:**
      - In left sidebar, click **Build** → **Authentication**
      - Click **Get started**
      - Enable **Email/Password** sign-in method
      - Enable **Google** sign-in method
      - Click **Save**

   b. **Enable Firestore Database:**
      - In left sidebar, click **Build** → **Firestore Database**
      - Click **Create database**
      - Choose **Production mode** (we'll update rules later)
      - Select location: Choose closest to your users (e.g., `asia-south1` for India)
      - Click **Enable**

   c. **Enable Storage:**
      - In left sidebar, click **Build** → **Storage**
      - Click **Get started**
      - Choose **Production mode**
      - Click **Done**

   d. **Enable Hosting:**
      - In left sidebar, click **Build** → **Hosting**
      - Click **Get started**
      - Follow the setup wizard (we'll deploy via CLI)

7. **Get Firebase Configuration:**
   - In Firebase Console, click the **gear icon** (⚙️) → **Project settings**
   - Scroll down to **Your apps** section
   - If no web app exists, click **Add app** → **Web** (</> icon)
   - Register app name: `iFilmDirectory Web`
   - Click **Register app**
   - Copy the Firebase configuration object

8. **Update Your `.env` File:**
   - Replace the values in your `.env` file with the new configuration
   - The format should be:
   ```
   VITE_FIREBASE_API_KEY=your-new-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-new-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

9. **Update `.firebaserc`:**
   - Update the project ID in `.firebaserc` to match your new project ID

---

### Option 2: Use Existing Project (Quick Alternative)

If you want to use an existing project instead:

**Use `storieswriterai-c3770`:**

1. **Update `.firebaserc`:**
   ```json
   {
     "projects": {
       "default": "storieswriterai-c3770"
     }
   }
   ```

2. **Update `.env`:**
   - Get the Firebase config from the existing project
   - Update all `VITE_FIREBASE_*` variables

3. **Enable Hosting:**
   - Go to Firebase Console → storieswriterai-c3770
   - Enable Hosting if not already enabled

---

## After Setup

Once you've created/configured the Firebase project:

1. **Update configuration files** (`.env` and `.firebaserc`)
2. **Run deployment again:**
   ```bash
   ./deploy.sh
   ```

---

## Need Help?

Let me know which option you prefer:
1. Create new Firebase project (recommended)
2. Use existing project

I can guide you through either option!
