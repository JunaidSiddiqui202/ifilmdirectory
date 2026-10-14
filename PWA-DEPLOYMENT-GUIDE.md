# PWA Deployment Guide - iOS Update Fix

## Problem
iOS aggressively caches PWAs and doesn't update them even when you delete and re-add the icon.

## Solution Implemented
We've implemented a comprehensive PWA update system with:

1. **Dynamic Cache Versioning** - Service worker cache name changes on every deployment
2. **Automatic Update Detection** - App checks for updates on every page load
3. **Force Update Mechanism** - Users are prompted to reload when updates are available
4. **Cache-Control Headers** - Prevents browser/CDN from caching critical PWA files
5. **Version Tracking** - Manifest includes version numbers for better tracking

## Deployment Steps

### Every Time You Deploy:

1. **Update PWA Version** (IMPORTANT!)
   ```bash
   cd /Volumes/JUNAID/CODES/iFilmDirectory/ifilm-app
   ./update-pwa-version.sh
   ```
   This automatically updates version numbers in:
   - `public/service-worker.js` (CACHE_VERSION)
   - `public/manifest.json` (version and start_url)

2. **Build the App**
   ```bash
   npm run build
   ```

3. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

## For iOS Users (After Deployment)

### Method 1: Force Refresh (Recommended)
1. Open Safari and go to your website
2. Pull down to refresh the page
3. The app will detect the new version and prompt to reload
4. Click "OK" to reload and get the latest version

### Method 2: Clear Safari Cache
1. Go to iPhone Settings → Safari
2. Tap "Clear History and Website Data"
3. Open Safari and visit your website
4. Add to Home Screen again

### Method 3: Delete and Re-add (Last Resort)
1. Long-press the PWA icon on home screen
2. Tap "Remove App" or the X button
3. Open Safari and go to your website
4. Tap the Share button
5. Tap "Add to Home Screen"
6. The new version will be installed

## Verification

After deployment, you can verify the update worked by:

1. **Check Console Logs** (Safari Web Inspector):
   ```
   [ServiceWorker] Installing version: v2-2026-01-01-22-30
   [ServiceWorker] Activating version: v2-2026-01-01-22-30
   ```

2. **Check Manifest Version**:
   - Open: https://your-domain.com/manifest.json
   - Look for the "version" field - it should match your deployment timestamp

3. **Check Cache Storage** (Safari Developer Tools):
   - Open Web Inspector → Storage → Cache Storage
   - You should see cache named: `ifilmdirectory-v2-2026-01-01-22-30`

## Technical Details

### Files Modified:
- ✅ `public/service-worker.js` - Dynamic versioning, aggressive cache clearing
- ✅ `public/manifest.json` - Version field, cache-busting start_url
- ✅ `src/main.tsx` - Service worker registration with update detection
- ✅ `firebase.json` - Cache-control headers
- ✅ `update-pwa-version.sh` - Automated version update script

### How It Works:

1. **On Deployment**: Version numbers are updated automatically
2. **On Page Load**: Service worker checks for updates
3. **Update Found**: New service worker installs in background
4. **User Prompt**: User is asked to reload to get new version
5. **Reload**: Old cache is deleted, new version takes over
6. **iOS Cache**: Prevented by no-cache headers on critical files

## Troubleshooting

### PWA Still Not Updating on iOS?

1. **Verify deployment**:
   ```bash
   curl -I https://your-domain.com/service-worker.js
   ```
   Check for: `Cache-Control: no-cache, no-store, must-revalidate`

2. **Check version was updated**:
   ```bash
   grep "CACHE_VERSION" public/service-worker.js
   ```

3. **Clear ALL iOS caches**:
   - Settings → Safari → Advanced → Website Data → Remove All

4. **Hard refresh in Safari**:
   - Open Safari (not the PWA)
   - Go to your site
   - Tap address bar, then reload button
   - Hold reload button for force refresh

### Update Script Not Working?

If `update-pwa-version.sh` fails, manually update:

1. **In `public/service-worker.js`**:
   ```javascript
   const CACHE_VERSION = 'v2-YYYY-MM-DD-HH-MM'; // Update this
   ```

2. **In `public/manifest.json`**:
   ```json
   "version": "2.0.YYYYMMDDHHMM",
   "start_url": "/?v=YYYYMMDDHHMM"
   ```

## Best Practices

1. **Always run `update-pwa-version.sh` before deployment**
2. **Test in Safari before deploying** (localhost:5173)
3. **Inform users** when major updates are deployed
4. **Monitor console logs** for service worker errors
5. **Keep version numbers sequential** for easier tracking

## Notes for Future Deployments

- The version format is: `v2-YYYY-MM-DD-HH-MM`
- Each deployment MUST have a unique version
- The script uses timestamps to ensure uniqueness
- iOS Safari is the most aggressive with caching - always test there first
