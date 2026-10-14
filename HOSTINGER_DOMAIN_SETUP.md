# 🌐 Connecting Your Hostinger Domain to Firebase

## Step-by-Step Guide

### Part 1: Deploy to Firebase First

1. **Build and Deploy:**
   ```bash
   # Option 1: Use the automated script
   ./deploy.sh
   
   # Option 2: Manual commands
   npm run build
   firebase deploy --only hosting
   ```

2. **Verify Deployment:**
   - After deployment, you'll get a URL like: `https://ifilmdirectory-94b82.web.app`
   - Open it in your browser to verify everything works

---

### Part 2: Add Custom Domain in Firebase

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - Login with your Google account

2. **Select Your Project:**
   - Click on `ifilmdirectory-94b82`

3. **Navigate to Hosting:**
   - In the left sidebar, click **Hosting**
   - You should see your deployed site

4. **Add Custom Domain:**
   - Click **Add custom domain** button
   - Enter your domain name (e.g., `ifilmdirectory.com` or `www.ifilmdirectory.com`)
   - Click **Continue**

5. **Get DNS Records:**
   - Firebase will provide you with DNS records to add
   - **Keep this page open** - you'll need these values

   Example records you'll receive:
   ```
   Type: A
   Name: @
   Value: 151.101.1.195
   
   Type: A
   Name: @
   Value: 151.101.65.195
   
   Type: TXT
   Name: @
   Value: firebase=ifilmdirectory-94b82
   ```

---

### Part 3: Configure DNS in Hostinger

1. **Login to Hostinger:**
   - Go to: https://hpanel.hostinger.com/
   - Login with your credentials

2. **Access Domain Settings:**
   - Click on **Domains** in the top menu
   - Select your domain (e.g., `ifilmdirectory.com`)

3. **Open DNS Zone Editor:**
   - Look for **DNS / Name Servers** or **DNS Zone**
   - Click on **Manage** or **Edit DNS Zone**

4. **Add Firebase DNS Records:**

   **For Root Domain (example.com):**
   
   a. **Delete existing A records** (if any point to Hostinger)
   
   b. **Add Firebase A Records:**
   ```
   Type: A
   Name: @ (or leave blank)
   Points to: 151.101.1.195
   TTL: 14400 (or Auto)
   ```
   
   ```
   Type: A
   Name: @ (or leave blank)
   Points to: 151.101.65.195
   TTL: 14400 (or Auto)
   ```
   
   c. **Add TXT Record for Verification:**
   ```
   Type: TXT
   Name: @ (or leave blank)
   Value: firebase=ifilmdirectory-94b82
   TTL: 14400 (or Auto)
   ```

   **For www subdomain (www.example.com):**
   
   ```
   Type: CNAME
   Name: www
   Points to: ifilmdirectory-94b82.web.app
   TTL: 14400 (or Auto)
   ```

5. **Save Changes:**
   - Click **Save** or **Add Record** for each entry
   - Hostinger will confirm the changes

---

### Part 4: Verify in Firebase

1. **Return to Firebase Console:**
   - Go back to the Firebase tab where you added the domain

2. **Click Verify:**
   - Firebase will check if the DNS records are correct
   - This might take a few minutes

3. **Wait for SSL Certificate:**
   - After verification, Firebase will automatically provision an SSL certificate
   - This can take up to 24 hours (usually much faster)
   - You'll receive an email when it's ready

---

### Part 5: DNS Propagation

**Important:** DNS changes can take time to propagate worldwide.

- **Minimum:** 15 minutes
- **Average:** 2-4 hours
- **Maximum:** 48 hours

**Check DNS Propagation:**
- Use: https://dnschecker.org/
- Enter your domain
- Select "A" record type
- Check if it shows Firebase IPs globally

---

## 🔍 Troubleshooting

### Issue: "Domain verification failed"
**Solution:**
- Wait 10-15 minutes after adding DNS records
- Verify TXT record is correct (no extra spaces)
- Try verification again

### Issue: "SSL certificate pending"
**Solution:**
- This is normal - can take up to 24 hours
- Your site will work on HTTP in the meantime
- Firebase will auto-enable HTTPS when ready

### Issue: "Site not loading on custom domain"
**Solution:**
- Check DNS propagation: https://dnschecker.org/
- Clear browser cache
- Try incognito/private mode
- Wait for full DNS propagation (up to 48 hours)

### Issue: "Mixed content warnings"
**Solution:**
- Ensure all resources (images, scripts) use HTTPS
- Update any hardcoded HTTP URLs to HTTPS

---

## ✅ Verification Checklist

After setup, verify these:

- [ ] Firebase deployment successful
- [ ] Site loads on Firebase URL (*.web.app)
- [ ] DNS records added in Hostinger
- [ ] Domain verified in Firebase
- [ ] SSL certificate provisioned
- [ ] Site loads on custom domain (HTTP)
- [ ] Site loads on custom domain (HTTPS)
- [ ] www subdomain works
- [ ] All features work on custom domain
- [ ] Mobile responsive on custom domain

---

## 📊 Expected Timeline

| Step | Time |
|------|------|
| Firebase deployment | 2-5 minutes |
| Add DNS records | 5-10 minutes |
| DNS propagation | 2-48 hours |
| SSL certificate | 1-24 hours |
| **Total** | **2-48 hours** |

---

## 🎯 Quick Reference: DNS Records

**Replace `ifilmdirectory.com` with your actual domain**

```
# Root domain
Type: A
Name: @
Value: 151.101.1.195

Type: A
Name: @
Value: 151.101.65.195

# Verification
Type: TXT
Name: @
Value: firebase=ifilmdirectory-94b82

# WWW subdomain
Type: CNAME
Name: www
Value: ifilmdirectory-94b82.web.app
```

---

## 📞 Support Resources

- **Firebase Hosting Docs:** https://firebase.google.com/docs/hosting
- **Hostinger DNS Guide:** https://support.hostinger.com/en/articles/1583227-how-to-manage-dns-records
- **DNS Checker:** https://dnschecker.org/
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html

---

## 🎉 Success!

Once everything is set up, your app will be accessible at:

- ✅ `https://ifilmdirectory-94b82.web.app` (Firebase URL)
- ✅ `https://ifilmdirectory-94b82.firebaseapp.com` (Alternative Firebase URL)
- ✅ `https://yourdomain.com` (Your custom domain)
- ✅ `https://www.yourdomain.com` (WWW version)

**All with free SSL certificates and global CDN! 🚀**

---

## 🔄 Future Updates

To update your site after making changes:

```bash
# Quick update
./deploy.sh

# Or manually
npm run build
firebase deploy --only hosting
```

Changes will be live in 2-5 minutes!
