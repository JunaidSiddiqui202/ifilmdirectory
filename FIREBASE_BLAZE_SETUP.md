# Firebase Blaze Plan Setup with Budget Controls

## Overview
This guide will help you upgrade to Firebase Blaze (Pay-as-you-go) plan with proper budget controls and cost management to prevent unexpected charges.

## Why Upgrade to Blaze Plan?

### Current Limitations on Spark (Free) Plan:
- ❌ Cannot deploy Cloud Functions
- ❌ Limited to 50K reads/day, 20K writes/day, 20K deletes/day
- ❌ No outbound network requests from Cloud Functions
- ❌ 1GB storage limit
- ❌ 10GB/month bandwidth

### Benefits of Blaze Plan:
- ✅ Deploy Cloud Functions for server-side logic
- ✅ Send push notifications via Cloud Functions
- ✅ Automated email notifications
- ✅ WhatsApp integration capabilities
- ✅ Scalable read/write operations
- ✅ **FREE tier included** (same as Spark plan limits)
- ✅ Only pay for what you use beyond free tier

---

## Step 1: Set Up Billing Budget Alerts

### Before Upgrading - CRITICAL!

1. **Go to Google Cloud Console Billing**:
   ```
   https://console.cloud.google.com/billing
   ```

2. **Create a Budget Alert**:
   - Click on "Budgets & alerts" in the left menu
   - Click "CREATE BUDGET"
   - Select your Firebase project: `ifilmdirectory-94b82`
   
3. **Configure Budget Settings**:
   ```
   Budget name: iFilmDirectory Monthly Budget
   Time range: Monthly
   Projects: ifilmdirectory-94b82
   Services: All services
   
   Budget amount: $5.00 USD (recommended starting amount)
   
   Alert threshold rules:
   - 50% of budget ($2.50) → Email alert
   - 75% of budget ($3.75) → Email alert
   - 90% of budget ($4.50) → Email alert + SMS (if configured)
   - 100% of budget ($5.00) → Email alert + SMS
   ```

4. **Set Up Billing Account Notifications**:
   - Add your email: `ifilmdirectory@gmail.com`
   - Enable all notification types
   - Consider adding SMS alerts for critical thresholds

---

## Step 2: Upgrade to Blaze Plan

### Via Firebase Console (Recommended):

1. **Open Firebase Console**:
   ```
   https://console.firebase.google.com/project/ifilmdirectory-94b82
   ```

2. **Navigate to Billing**:
   - Click on the ⚙️ gear icon (Settings) → "Usage and billing"
   - Click "Details & settings" tab
   - Click "Modify plan"

3. **Select Blaze Plan**:
   - Choose "Blaze (Pay as you go)"
   - Review the pricing details
   - Click "Purchase"
   - Confirm billing account setup

### Via Command Line:

```bash
# Login to Firebase
firebase login

# Check current project
firebase use

# The upgrade must be done through the console
# Command line doesn't support plan upgrades
```

---

## Step 3: Configure Firestore Security Rules

We've already created comprehensive security rules with rate limiting:

### Key Features of Our Rules:
- ✅ **Rate Limiting**: Prevents abuse (e.g., max 20 posts/day per user)
- ✅ **Role-Based Access**: Admin, verified users, regular users
- ✅ **Document Size Limits**: Max 1MB per document
- ✅ **Granular Permissions**: Each collection has specific rules
- ✅ **Cost Protection**: Limits prevent runaway read/write operations

### Deploy Security Rules:

```bash
cd /Volumes/JUNAID/CODES/iFilmDirectory/ifilm-app

# Deploy Firestore rules only
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy both together
firebase deploy --only firestore
```

---

## Step 4: Monitor Your Usage

### Firebase Console Monitoring:

1. **Usage Dashboard**:
   ```
   https://console.firebase.google.com/project/ifilmdirectory-94b82/usage
   ```
   
   Monitor:
   - Firestore reads/writes/deletes
   - Cloud Functions invocations
   - Storage usage
   - Hosting bandwidth

2. **Set Up Usage Alerts**:
   - Go to Usage tab
   - Enable email notifications for high usage
   - Set custom thresholds

### Google Cloud Console Monitoring:

1. **Detailed Billing Reports**:
   ```
   https://console.cloud.google.com/billing/reports
   ```
   
   View:
   - Daily cost breakdown
   - Service-level costs
   - Forecasted costs
   - Cost trends

---

## Step 5: Cost Optimization Best Practices

### Firestore Optimization:

1. **Implement Client-Side Caching**:
   ```typescript
   // Enable offline persistence
   enableIndexedDbPersistence(db).catch((err) => {
     if (err.code == 'failed-precondition') {
       console.warn('Multiple tabs open');
     } else if (err.code == 'unimplemented') {
       console.warn('Browser doesn\'t support persistence');
     }
   });
   ```

2. **Use Pagination**:
   ```typescript
   // Limit query results
   const q = query(
     collection(db, 'posts'),
     orderBy('createdAt', 'desc'),
     limit(20) // Only fetch 20 at a time
   );
   ```

3. **Avoid Real-time Listeners Where Possible**:
   ```typescript
   // Use one-time reads instead of listeners when appropriate
   const snapshot = await getDocs(query);
   // Instead of: onSnapshot(query, callback);
   ```

### Cloud Functions Optimization:

1. **Set Function Timeouts**:
   ```typescript
   export const myFunction = functions
     .runWith({
       timeoutSeconds: 60, // Max 60 seconds
       memory: '256MB' // Minimum memory needed
     })
     .https.onRequest((req, res) => {
       // Function code
     });
   ```

2. **Use Minimum Memory**:
   - Start with 256MB
   - Only increase if needed

3. **Batch Operations**:
   - Group multiple operations together
   - Reduce function invocations

---

## Step 6: Expected Monthly Costs

### Realistic Cost Estimate for iFilmDirectory:

#### Free Tier (Always Included):
- **Firestore**: 50K reads, 20K writes, 20K deletes/day
- **Cloud Functions**: 2M invocations, 400K GB-seconds, 200K CPU-seconds/month
- **Hosting**: 10GB storage, 360MB/day transfer
- **Storage**: 5GB

#### Beyond Free Tier (Pay-as-you-go):
- **Firestore Reads**: $0.06 per 100K reads
- **Firestore Writes**: $0.18 per 100K writes
- **Cloud Functions**: $0.40 per million invocations
- **Storage**: $0.026 per GB/month

#### Example Monthly Usage Scenario:
```
Assumptions:
- 100 active users/day
- Each user: 50 reads, 5 writes
- 10 push notifications/day
- 5 email notifications/day

Daily Operations:
- Reads: 5,000 (well within free tier)
- Writes: 500 (well within free tier)
- Function calls: 15 (well within free tier)

Monthly Cost: $0.00 (all within free tier!)

Even with 10x growth:
- Reads: 50,000/day (at free tier limit)
- Writes: 5,000/day (within free tier)
- Function calls: 150/day (within free tier)

Monthly Cost: ~$0.50 - $2.00
```

---

## Step 7: Deploy Everything

### Full Deployment Command:

```bash
cd /Volumes/JUNAID/CODES/iFilmDirectory/ifilm-app

# 1. Deploy Firestore rules and indexes
firebase deploy --only firestore

# 2. Deploy Cloud Functions
firebase deploy --only functions

# 3. Deploy Hosting
firebase deploy --only hosting

# Or deploy everything at once
firebase deploy
```

---

## Step 8: Emergency Cost Controls

### If Costs Spike Unexpectedly:

1. **Immediate Actions**:
   ```bash
   # Disable Cloud Functions temporarily
   firebase functions:delete functionName
   
   # Or update rules to read-only mode
   # In firestore.rules, temporarily set:
   # allow write: if false;
   ```

2. **Check for Issues**:
   - Review Cloud Functions logs for errors/loops
   - Check Firestore usage for unusual patterns
   - Look for infinite loops or recursive calls

3. **Set Hard Limits** (Advanced):
   - Use Google Cloud Console → IAM & Admin → Quotas
   - Set hard limits on API calls
   - Enable automatic service disabling at budget threshold

---

## Step 9: Rate Limiting Implementation

Our Firestore rules include built-in rate limiting. To track this, update your user documents:

### User Document Structure:
```typescript
{
  uid: "user123",
  email: "user@example.com",
  role: "user", // or "admin"
  verified: false,
  rateLimits: {
    posts: {
      count: 0,
      lastAction: Timestamp
    },
    comments: {
      count: 0,
      lastAction: Timestamp
    },
    // ... other collections
  }
}
```

### Update Rate Limit on Write:
```typescript
// In your frontend code
const updateRateLimit = async (collection: string) => {
  const userRef = doc(db, 'users', auth.currentUser.uid);
  const today = new Date().setHours(0, 0, 0, 0);
  
  await updateDoc(userRef, {
    [`rateLimits.${collection}.count`]: increment(1),
    [`rateLimits.${collection}.lastAction`]: serverTimestamp()
  });
};
```

---

## Step 10: Monitoring Dashboard

### Create a Simple Admin Dashboard:

```typescript
// src/components/admin/UsageMonitor.tsx
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const UsageMonitor = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    todayPosts: 0,
    todayReads: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Implement your monitoring logic
      const today = new Date().setHours(0, 0, 0, 0);
      
      // Count today's posts
      const postsQuery = query(
        collection(db, 'posts'),
        where('createdAt', '>=', today)
      );
      const postsSnapshot = await getDocs(postsQuery);
      
      setStats({
        ...stats,
        todayPosts: postsSnapshot.size
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="usage-monitor">
      <h2>Daily Usage</h2>
      <p>Posts Today: {stats.todayPosts} / 20 (per user limit)</p>
      {/* Add more metrics */}
    </div>
  );
};
```

---

## Summary Checklist

- [ ] Set up billing budget alerts ($5/month recommended)
- [ ] Add email notifications for budget thresholds
- [ ] Upgrade to Blaze plan via Firebase Console
- [ ] Deploy Firestore security rules with rate limiting
- [ ] Deploy Firestore indexes for query optimization
- [ ] Deploy Cloud Functions for notifications
- [ ] Monitor usage daily for first week
- [ ] Review billing reports weekly
- [ ] Implement client-side caching
- [ ] Set up admin usage monitoring dashboard

---

## Support & Resources

### Firebase Pricing Calculator:
```
https://firebase.google.com/pricing
```

### Firebase Documentation:
```
https://firebase.google.com/docs/firestore/quotas
```

### Cost Optimization Guide:
```
https://firebase.google.com/docs/firestore/best-practices
```

---

## Questions or Issues?

If you encounter any issues during setup:

1. Check Firebase Console for error messages
2. Review Cloud Functions logs
3. Verify billing account is active
4. Ensure payment method is valid
5. Contact Firebase Support if needed

**Remember**: With proper rate limiting and monitoring, your costs should stay well within the free tier for moderate usage!
