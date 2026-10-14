# 🎨 Customize Google Sign-In Branding

## Issue
When users click "Continue with Google", they see:
"to continue to **ifilmdirectory-94b82.firebaseapp.com**"

Instead, you want them to see:
"to continue to **iFilmDirectory**" (with your logo)

---

## ✅ Solution: Configure OAuth Consent Screen

### Step 1: Go to Google Cloud Console

1. **Open:** https://console.cloud.google.com/
2. **Select Project:** iFilmDirectory (or ifilmdirectory-94b82)

### Step 2: Navigate to OAuth Consent Screen

1. **Left Menu:** APIs & Services → **OAuth consent screen**
2. **Or Direct Link:** https://console.cloud.google.com/apis/credentials/consent

### Step 3: Configure App Information

#### **App Information Section:**

| Field | Value |
|-------|-------|
| **App name** | `iFilmDirectory` |
| **User support email** | `ifilmdirectory@gmail.com` |
| **App logo** | Upload your logo (120x120px minimum, PNG/JPG) |

#### **App Domain Section:**

| Field | Value |
|-------|-------|
| **Application home page** | `https://ifilmdirectory.com` |
| **Application privacy policy link** | `https://ifilmdirectory.com/privacy` |
| **Application terms of service link** | `https://ifilmdirectory.com/terms` |

#### **Authorized Domains:**

Add these domains:
- `ifilmdirectory.com`
- `firebaseapp.com` (keep this)

#### **Developer Contact Information:**

- **Email addresses:** `ifilmdirectory@gmail.com`

### Step 4: Configure Scopes

1. Click **"Add or Remove Scopes"**
2. Select these scopes:
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
   - ✅ `openid`
3. Click **"Update"**
4. Click **"Save and Continue"**

### Step 5: Test Users (if in Testing mode)

If your app is in **Testing** mode:
1. Add test users (emails that can sign in)
2. Add your email: `ifilmdirectory@gmail.com`
3. Add any other test user emails

**OR**

**Publish the app:**
1. Click **"Publish App"** to make it available to everyone
2. No verification needed for basic scopes (email, profile)

### Step 6: Save Everything

1. Click **"Save and Continue"** on each screen
2. Review the summary
3. Click **"Back to Dashboard"**

---

## 🎨 Prepare Your Logo

Your logo should be:
- **Size:** Minimum 120x120px (recommended: 512x512px)
- **Format:** PNG or JPG
- **Background:** Transparent PNG preferred
- **Square:** 1:1 aspect ratio

You can use your existing logo from: `public/logo.png`

---

## 📝 Create Privacy Policy & Terms (Optional but Recommended)

### Quick Privacy Policy Page

Create a simple privacy policy page in your app:

**File:** `src/pages/Privacy.tsx`

```tsx
export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p>Last updated: December 29, 2025</p>
      
      <h2 className="text-2xl font-bold mt-6 mb-4">Information We Collect</h2>
      <p>We collect information you provide directly to us, including:</p>
      <ul className="list-disc ml-6">
        <li>Name and email address (via Google Sign-In)</li>
        <li>Profile information</li>
        <li>Content you post</li>
      </ul>
      
      <h2 className="text-2xl font-bold mt-6 mb-4">How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul className="list-disc ml-6">
        <li>Provide and improve our services</li>
        <li>Communicate with you</li>
        <li>Ensure security</li>
      </ul>
      
      <h2 className="text-2xl font-bold mt-6 mb-4">Contact Us</h2>
      <p>Email: ifilmdirectory@gmail.com</p>
    </div>
  );
}
```

Add route in `App.tsx`:
```tsx
<Route path="/privacy" element={<Privacy />} />
```

---

## ⏱️ How Long Does It Take?

- **Configuration:** 5-10 minutes
- **Changes take effect:** Immediately
- **Verification (if needed):** 1-7 days (only for sensitive scopes)

For basic email/profile scopes, **no verification is needed**!

---

## ✅ After Configuration

Once you've configured the OAuth consent screen:

1. **The Google Sign-In popup will show:**
   - ✅ Your app name: "iFilmDirectory"
   - ✅ Your app logo
   - ✅ "to continue to **iFilmDirectory**"

2. **Users will see:**
   - Your professional branding
   - Your app logo
   - Your app name
   - Links to privacy policy and terms

---

## 🧪 Testing

After configuration:
1. Clear browser cache
2. Try "Continue with Google" again
3. You should see your app name and logo!

---

## 📸 What You'll See

**Before:**
```
Choose an account
to continue to ifilmdirectory-94b82.firebaseapp.com
```

**After:**
```
Choose an account
to continue to iFilmDirectory
[Your Logo]
```

---

## 🎯 Quick Checklist

- [ ] Go to Google Cloud Console
- [ ] Navigate to OAuth consent screen
- [ ] Set app name to "iFilmDirectory"
- [ ] Upload your logo
- [ ] Add home page URL
- [ ] Add authorized domain
- [ ] Configure scopes (email, profile)
- [ ] Save changes
- [ ] Test Google Sign-In

---

## 📞 Need Help?

- **Google Cloud Console:** https://console.cloud.google.com/
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent
- **Firebase Project:** https://console.firebase.google.com/project/ifilmdirectory-94b82

---

**Once configured, your Google Sign-In will look professional with your branding! 🎨**
