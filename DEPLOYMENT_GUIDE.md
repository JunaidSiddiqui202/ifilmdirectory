# 🚀 iFilmDirectory Deployment Guide

## Overview
This guide will help you deploy your iFilmDirectory application with your Hostinger domain. We'll cover multiple deployment options and recommend the best approach.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Before deploying, ensure all your API keys are properly configured:

**Current `.env` file contains:**
- ✅ Cloudinary (Image uploads)
- ✅ Groq API (AI - Primary)
- ✅ Gemini API (AI - Fallback)
- ✅ Firebase (Backend)
- ✅ Resend API (Emails)
- ✅ EmailJS (Email service)

**⚠️ IMPORTANT:** Never commit your `.env` file to Git. It's already in `.gitignore`.

### 2. Build Test
First, let's ensure your app builds successfully:

```bash
npm run build
```

This will create a `dist` folder with your production-ready files.

### 3. Preview Build Locally
Test the production build before deploying:

```bash
npm run preview
```

---

## 🎯 Recommended Deployment Options

### **Option 1: Firebase Hosting + Custom Domain (RECOMMENDED) ⭐**

**Why this is best:**
- ✅ Already configured in your project
- ✅ Free SSL certificate
- ✅ Global CDN (fast worldwide)
- ✅ Easy to connect custom domain
- ✅ Automatic HTTPS
- ✅ Perfect integration with your Firebase backend
- ✅ Free tier is generous

**Steps:**

#### Step 1: Initialize Firebase (if not done)
```bash
# Check if Firebase CLI is installed
firebase --version

# If not installed, install it
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (select your existing project)
firebase use ifilmdirectory-94b82
```

#### Step 2: Build and Deploy
```bash
# Build the production version
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

#### Step 3: Connect Your Hostinger Domain

After deployment, you'll get a Firebase URL like: `https://ifilmdirectory-94b82.web.app`

**To connect your Hostinger domain:**

1. **In Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - Select your project: `ifilmdirectory-94b82`
   - Go to **Hosting** → **Add custom domain**
   - Enter your domain (e.g., `ifilmdirectory.com`)
   - Firebase will provide DNS records

2. **In Hostinger:**
   - Login to Hostinger
   - Go to **Domains** → Select your domain
   - Go to **DNS/Name Servers**
   - Add the DNS records provided by Firebase:
     - **A Record**: Point to Firebase IP
     - **TXT Record**: For verification
   
3. **Wait for DNS propagation** (can take 24-48 hours, usually faster)

4. **SSL Certificate**: Firebase automatically provides free SSL

---

### **Option 2: Hostinger Shared Hosting**

**Pros:**
- You already have the hosting
- Simple FTP upload

**Cons:**
- ⚠️ No automatic HTTPS (need to configure)
- ⚠️ Slower than CDN
- ⚠️ Manual updates required
- ⚠️ May have issues with React Router

**Steps:**

#### Step 1: Build the App
```bash
npm run build
```

#### Step 2: Upload to Hostinger
1. Login to Hostinger control panel
2. Go to **File Manager** or use **FTP**
3. Navigate to `public_html` folder
4. Upload all files from the `dist` folder
5. Create a `.htaccess` file for React Router:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Step 3: Configure Environment Variables
Since Hostinger shared hosting doesn't support `.env` files for frontend apps, you'll need to:
- Use Firebase Hosting instead (recommended)
- OR hardcode values (NOT recommended for security)
- OR use a backend proxy

---

### **Option 3: Vercel (Alternative - Also Excellent) ⭐**

**Pros:**
- ✅ Free tier
- ✅ Automatic deployments from Git
- ✅ Free SSL
- ✅ Global CDN
- ✅ Easy custom domain setup
- ✅ Environment variables support

**Steps:**

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy
```bash
# Login to Vercel
vercel login

# Deploy
vercel

# For production
vercel --prod
```

#### Step 3: Add Environment Variables
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all variables from your `.env` file

#### Step 4: Connect Custom Domain
1. In Vercel Dashboard → **Settings** → **Domains**
2. Add your Hostinger domain
3. Update DNS in Hostinger with Vercel's nameservers

---

### **Option 4: Netlify (Another Great Alternative)**

**Similar to Vercel:**
- Free tier
- Automatic deployments
- Custom domains
- Environment variables

**Quick Deploy:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## 🎨 My Recommendation for You

### **Use Firebase Hosting + Your Hostinger Domain**

**Why?**
1. You're already using Firebase for backend (Firestore, Auth, Storage)
2. Perfect integration - no CORS issues
3. Free and reliable
4. Easy to update: just run `firebase deploy`
5. Your Hostinger domain can point to Firebase
6. You keep your domain, get better hosting

**Your Hostinger domain will still be used**, just pointing to Firebase servers instead of Hostinger servers.

---

## 📝 Quick Deployment Commands

### For Firebase (Recommended):
```bash
# 1. Build
npm run build

# 2. Deploy
firebase deploy --only hosting

# 3. View your site
firebase open hosting:site
```

### For Updates (After Initial Deploy):
```bash
# Just run these two commands
npm run build
firebase deploy --only hosting
```

---

## 🔒 Security Checklist Before Deploy

- [ ] `.env` file is in `.gitignore`
- [ ] All API keys are valid
- [ ] Firebase security rules are configured
- [ ] CORS is properly configured
- [ ] Test all features in production build (`npm run preview`)

---

## 🌐 DNS Configuration for Hostinger Domain

### If using Firebase Hosting:

**In Hostinger DNS Settings, add:**

1. **A Record:**
   - Type: `A`
   - Name: `@`
   - Value: `151.101.1.195` (Firebase IP - will be provided)
   - TTL: `14400`

2. **A Record (www):**
   - Type: `A`
   - Name: `www`
   - Value: `151.101.1.195`
   - TTL: `14400`

3. **TXT Record (Verification):**
   - Type: `TXT`
   - Name: `@`
   - Value: (Provided by Firebase)
   - TTL: `14400`

**Note:** Firebase will provide exact DNS records when you add custom domain.

---

## 🚨 Common Issues & Solutions

### Issue 1: "Page not found" on refresh
**Solution:** Ensure rewrites are configured in `firebase.json` (already done ✅)

### Issue 2: Environment variables not working
**Solution:** 
- Vite requires `VITE_` prefix (already done ✅)
- Rebuild after changing `.env`
- For Firebase: Set in Firebase Console → Hosting → Environment variables

### Issue 3: API calls failing
**Solution:**
- Check CORS configuration
- Verify API keys are set in production environment
- Check Firebase security rules

### Issue 4: Images not loading
**Solution:**
- Ensure Cloudinary URLs are correct
- Check Firebase Storage rules
- Verify image paths in production build

---

## 📊 Post-Deployment Testing

After deployment, test these features:

- [ ] User registration/login
- [ ] Profile creation and editing
- [ ] Image uploads (Cloudinary)
- [ ] AI features (Groq/Gemini)
- [ ] Job postings
- [ ] Booking facilities
- [ ] Blog creation
- [ ] Showreel uploads
- [ ] Email notifications
- [ ] Mobile responsiveness

---

## 🔄 Continuous Deployment (Optional)

### Set up GitHub Actions for Auto-Deploy:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ifilmdirectory-94b82
```

---

## 📞 Need Help?

If you encounter any issues during deployment:

1. Check Firebase Console logs
2. Check browser console for errors
3. Verify all environment variables
4. Test locally with `npm run preview` first

---

## 🎉 Success!

Once deployed, your app will be live at:
- **Firebase URL:** `https://ifilmdirectory-94b82.web.app`
- **Your Custom Domain:** `https://yourdomain.com` (after DNS setup)

**Next Steps:**
1. Share the link with users
2. Monitor Firebase Analytics
3. Set up error tracking (optional: Sentry)
4. Configure Firebase Performance Monitoring

---

**Good luck with your deployment! 🚀**
