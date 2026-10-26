# iFilmDirectory — Audit 3 Implementation & Verification Report

**Date:** 26 October 2026  
**Branch:** `audit-3-implementation`  
**Base Commit:** `b955c37` (`main`)  
**Implementation Commits:**
- `d79a006`: `feat(audit-3): implement P0/P1 fixes for job application schema, group creation, unbounded queries, presence throttling, and pagination`
- `be4c2b1`: `fix(jobService): preserve Job interface compatibility with components and build`
**Author / Pair Programmer:** Antigravity AI  

---

## 1. Executive Summary

This engineering package implements all findings from **Audit 3 (Scalability, Performance, Data Integrity and Cost)** without weakening Audit 1 Firestore security rules, without undoing Audit 2 security and functional fixes, and without touching production data or deploying unauthorized security rules.

All code modifications were made on a dedicated branch (`audit-3-implementation`) and subjected to end-to-end unit, integration, and security rules testing using Vitest against the real application services and Firestore security specification suite.

---

## 2. Findings, Technical Fixes & Verification Evidence

### A3-01 — P0 — Job Application Schema Mismatch & Firestore Permissions Alignment
* **Root Cause:** In [src/services/jobService.ts](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/src/services/jobService.ts), `applyForJob()` created documents containing `jobId`, `applicantId`, applicant profile fields, `appliedAt`, and `status`, but omitted `userId` and `jobOwnerId`. The deployed Firestore security rule for `job_applications` requires:
  ```javascript
  allow create: if isAuthenticated() && (request.resource.data.userId == request.auth.uid || isAdmin());
  allow read: if isAuthenticated() && (isOwner(resource.data.userId) || isOwner(resource.data.jobOwnerId) || isAdmin());
  ```
  Consequently, unprivileged users were denied permission to create or read their own applications.
* **Implementation Fix:**
  - `applyForJob()` now writes both the canonical authenticated `userId: applicantId` (satisfying rule `request.resource.data.userId == request.auth.uid`) and backward-compatible `applicantId`.
  - Look up authoritative `jobOwnerId` from `jobs/{jobId}` (`job.postedBy`) and persist it on the application document so that the job owner can read and update application status under deployed security rules.
  - In `checkIfApplied()` and `getApplicationsForJob()`, supported dual-field compatibility (`userId` and legacy `applicantId`) so pre-existing documents remain functional without requiring an emergency database-wide wipe.
* **Test Verification:**
  - Verified in `test/service_integration.test.ts`: Unprivileged user `actor_uid_101` submitting an application for a job posted by `director_uid_202` stores both `userId` and `applicantId`, successfully binds `jobOwnerId`, and is retrievable by applicant and owner.

---

### A3-02 — P1 — False Success on Failed Group Creation
* **Root Cause:** In [src/services/groupService.ts](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/src/services/groupService.ts), `createGroup()` caught Firestore write failures and returned `{ success: true, id: 'local-group-' + Date.now() }`. This falsely reported success to the user interface even when permission was denied or network failed, without any persistent synchronization.
* **Implementation Fix:**
  - Replaced fake success fallback with explicit `{ success: false, error: (error as Error).message || 'Failed to create group.' }`.
  - Preserved curated system default groups distinctly in `getGroups()`, ensuring server-persisted groups and client defaults do not collide.
* **Test Verification:**
  - Verified in `test/service_integration.test.ts`: A forced Firestore write failure returns `success: false` with the underlying error message and does not claim creation or assign a fake local ID.

---

### A3-03 — P1 — Unbounded Collection Reads and Client Filtering
* **Root Cause:**
  - `jobService.getJobs()` read entire `jobs` collection without limits.
  - `groupService.getGroups()` and `getForumPosts()` read entire collections.
  - `userService.getAllUsers()` read the entire `users` collection. `getLatestUsers()` fell back to `getAllUsers()`.
  - `messagingService.getChats()` read the entire collection if un-scoped.
* **Implementation Fix:**
  - Implemented server-side pagination with query `limit()`:
    - `jobService.ts: getJobs(filterType, limitCount = 50)`
    - `groupService.ts: getGroups(limitCount = 50)`
    - `groupService.ts: getForumPosts(groupId, limitCount = 50)`
    - `userService.ts: getAllUsers(bypassCache, maxLimit = 100)`
    - `userService.ts: getLatestUsers(maxLimit = 20)` falls back to bounded slice `getAllUsers(false, maxLimit)` instead of reading unbounded collection.
    - `messagingService.ts: getChats(userId, limitCount = 50)` restricts query directly to chats where the user is an active participant (`array-contains`), bound by limit.
* **Test Verification:**
  - Verified in `test/service_integration.test.ts`:
    - `getJobs` fetches at most bounded count (e.g., 50).
    - `getGroups` and `getForumPosts` limit reads.
    - `getAllUsers` respects `maxLimit`.

---

### A3-04 — P1 — Presence Heartbeat Write Amplification
* **Root Cause:** [src/services/presenceService.ts](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/src/services/presenceService.ts) wrote to `/users/{uid}` immediately on initialization, every 60 seconds while visible, and on every focus/visibility change. Furthermore, multiple open browser tabs for the same user sent duplicate concurrent heartbeats, and asynchronous `beforeunload` Firestore writes frequently failed or stalled.
* **Implementation Fix:**
  - **Cross-tab write deduplication & throttling:** Tracked cross-tab write timestamps via `localStorage.getItem('ifilm_presence_last_write')`. Enforced a strict minimum write interval (`PRESENCE_WRITE_THROTTLE_MS = 2 * 60 * 1000`, 2 minutes) across all tabs.
  - **Window Focus / Visibility Throttling:** Switching tabs or windows no longer issues immediate Firestore writes if the user already checked in within the throttle window.
  - **Heartbeat Interval:** Increased active visible heartbeat timer from 60s to 120s (2 minutes), reducing write volume by >50% per single tab and eliminating amplification across multi-tab sessions.
  - **Removed Unreliable `beforeunload` Async Writes:** Avoided unhandled async Firestore document writes during page teardown. Relies on TTL-based presence semantics (`isOnline` evaluated with `lastActive` > 5 minutes ago).
* **Test Verification:**
  - Verified in `test/service_integration.test.ts`:
    - Consecutive rapid `recordActivity()` calls are throttled; second tab skips Firestore write if last write occurred within 2 minutes.

---

### A3-05 — P1 — Read-Heavy Follows and Per-User Fan-Out
* **Root Cause:** In [src/services/userService.ts](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/src/services/userService.ts), `getFollowers()` and `getFollowing()` fetched all documents in `users/{uid}/followers` and `following`, and then executed `Promise.all(ids.map(id => getUserProfile(id)))` without pagination, causing massive document read spikes on accounts with many followers.
* **Implementation Fix:**
  - Added bounded limit parameter `limitCount = 50` to `getFollowers(userId, limitCount = 50)` and `getFollowing(userId, limitCount = 50)`.
  - Limited concurrent profile hydration to the bounded page size.
* **Test Verification:**
  - Verified in `test/service_integration.test.ts`: Follower queries are capped by `limitCount = 50`, preventing fan-out on high-follower profiles.

---

### A3-06 — P2 — Client-Side RSS Feed Architecture Measurement
* **Finding:** RSS feeds are fetched client-side with `Promise.allSettled` and cached in `localStorage` per user device.
* **Measurement & Assessment:**
  - Evaluated existing caching: `rssNewsService` and `rssJobService` cache up to 80 items per client in `localStorage` with a 90-minute cooldown (`CACHE_TTL_MS = 90 * 60 * 1000`).
  - Bundle footprint: `rssNewsService` is 36.58 kB (gzip: 11.91 kB) and `rssJobService` is 32.10 kB (gzip: 10.99 kB), both code-split and loaded only on the respective jobs/news routes.
  - Architectural Recommendation: Before adding backend server infrastructure (e.g. cloud scheduler / Redis), current client-side `localStorage` caching with 90-minute TTL effectively caps client calls. A shared server worker should only be deployed if third-party RSS providers enforce strict IP rate-limiting.

---

### A3-07 — P2 — Bundle Budget & Route Measurements
* **Finding:** Several large modules existed in source (`AdminDashboard.tsx`, `Search.tsx`, `Home.tsx`, `UserProfile.tsx`).
* **Production Build Sizing Measurement (Vite 6 / Rollup):**
  ```
  dist/assets/index-BnERUT7g.js                      696.99 kB │ gzip: 218.07 kB
  dist/assets/UserProfile-DPC5PAi2.js                201.59 kB │ gzip:  38.70 kB
  dist/assets/EmptyState-C2KRHAWE.js                 114.09 kB │ gzip:  37.64 kB
  dist/assets/AdminDashboard-CCRV9ruY.js             102.74 kB │ gzip:  18.50 kB
  dist/assets/Terms-D2PyAU1C.js                       90.67 kB │ gzip:  18.45 kB
  dist/assets/EditBlog-CTmzNQSG.js                    83.38 kB │ gzip:  19.06 kB
  dist/assets/Home-C3IzJEs4.js                        75.94 kB │ gzip:  15.63 kB
  dist/assets/Search-DMujaGFP.js                      68.02 kB │ gzip:  14.89 kB
  dist/assets/Showcase-C0QCEGSN.js                    54.45 kB │ gzip:  12.64 kB
  dist/assets/PostJob-DRxbxfQZ.js                     49.67 kB │ gzip:   9.91 kB
  dist/assets/Guilds-BvkvFjot.js                      49.25 kB │ gzip:  11.62 kB
  dist/assets/Privacy-DqDESTH0.js                     46.30 kB │ gzip:  10.62 kB
  dist/assets/SouthCinemaNews-Dw6EuXuZ.js             44.19 kB │ gzip:   9.69 kB
  dist/assets/BrowseProfiles-XhTsH7YA.js              43.47 kB │ gzip:   9.20 kB
  dist/assets/GroupsForums-BXBBj5JD.js                37.77 kB │ gzip:  10.10 kB
  dist/assets/UploadShowreel-BytJU7M5.js              36.18 kB │ gzip:   8.50 kB
  dist/assets/Jobs-BOY8OTVl.js                        35.20 kB │ gzip:   8.37 kB
  dist/assets/Messaging-DgbwAIpU.js                   26.77 kB │ gzip:   7.19 kB
  dist/assets/JobDetails-CgrdRnPz.js                  25.01 kB │ gzip:   5.85 kB
  dist/assets/index-qPvye2ec.css                     199.64 kB │ gzip:  27.37 kB
  ```
  - All large pages are lazy-loaded on demand via `React.lazy()` and chunked into separate route files.
  - Total initial main bundle is ~218 kB gzipped (including React, React Router, Firebase, and core UI icons), well within acceptable modern web performance thresholds for rich interactive single-page applications.

---

## 3. Test Results & Verification

All 35 automated tests run and pass cleanly:

```bash
npx vitest run test/firestore/rules_spec.test.ts test/regression_suite.test.ts test/service_integration.test.ts
```

Output:
```
 ✓ test/regression_suite.test.ts (9 tests) 22ms
 ✓ test/firestore/rules_spec.test.ts (15 tests) 21ms
 ✓ test/service_integration.test.ts (11 tests) 351ms

 Test Files  3 passed (3)
      Tests  35 passed (35)
   Duration  3.65s
```

All modified TypeScript services pass ESLint with 0 errors:
```bash
npx eslint src/services/userService.ts src/services/jobService.ts src/services/groupService.ts src/services/presenceService.ts src/services/messagingService.ts
# Exit code 0
```

Production build passes with exit code 0 (`tsc -b && vite build`).

---

## 4. Modified Files Summary

| File | Change Description |
|---|---|
| [src/services/jobService.ts](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/src/services/jobService.ts) | Canonical `userId` & `applicantId` schema alignment, `jobOwnerId` binding, bounded query limits |
| [src/services/groupService.ts](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/src/services/groupService.ts) | Elimination of false-success local fallback, explicit error return, bounded query limits |
| [src/services/messagingService.ts](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/src/services/messagingService.ts) | Added `limitCount = 50` on participant chats query |
| [src/services/presenceService.ts](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/src/services/presenceService.ts) | Multi-tab write deduplication, 2-minute throttling, removed unpromised `beforeunload` async write |
| [src/services/userService.ts](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/src/services/userService.ts) | Follower/following `limitCount = 50` pagination, bounded `getAllUsers` and fallback in `getLatestUsers` |
| [test/service_integration.test.ts](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/test/service_integration.test.ts) | Integration tests validating A3-01 through A3-05 against application services |

---

## 5. Deployment Status & Known Remaining Risks

* **Branch Status:** Pushed to remote branch `audit-3-implementation` (commit `be4c2b1`). Ready for PR / merge into `main`.
* **Production Data & Rules:**
  - No production data was altered.
  - Firestore security rules were **not** redeployed or weakened; they remain strictly in enforcing mode from Audit 1.
* **Compatibility & Migration:**
  - Job application queries gracefully handle both canonical `userId` and legacy `applicantId` fields.
  - Presence service is backwards-compatible with existing client sessions.
* **Residual Risks:**
  - For very high-volume forum post threads (over 50 comments), the UI should adopt infinite scroll / cursor pagination when thread depths routinely exceed 50.
