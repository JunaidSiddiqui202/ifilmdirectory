# iFilmDirectory — Audit 6 Launch Readiness Checklist & Release Verification

**Date:** 26 October 2026  
**Auditor / Engineering Pair:** Antigravity AI  
**Repository Branch:** `main` (commit [`919b4a1`](https://github.com/JunaidSiddiqui202/ifilmdirectory/commit/919b4a1))  
**Release Package:** `ifilmdirectory_audit5_release.zip`  
**Release SHA-256 Checksum:** `6f028f2aea6c70e5fe12ddc6d0490230b019e6db9571d6a05953605acd8cc555`  
**Hostinger Production Target:** Server `195.35.44.253` (`https://ifilmdirectory.com`, Document Root: `/home/u755318682/public_html`)  

---

## 1. Branch Merge & Codebase Status

- [x] **Audit 1 (Security Rules, Permissions & Data Sanitization):** Enforced in `firestore.rules` & DOMPurify. Rules unit test suite passes (15/15 tests).
- [x] **Audit 2 (SSRF, Audition Deactivation, Service Resilience):** Deployed & verified on Hostinger (`rss-proxy.php` hostname allowlist & SSRF defense verified live).
- [x] **Audit 3 (Scalability, Bounded Queries, Job Application Schema):** Merged into `main` (`385b410`), verified in Vitest integration tests (11/11 tests).
- [x] **Audit 4 (Accessibility, Focus Trapping, Safe Redirects):** Merged into `main` (`919b4a1`), verified in regression suite (9/9 tests).
- [x] **Audit 5 (Operational Readiness, Backup Policy, Runbook):** Completed, documented in `AUDIT_5_OPERATIONS_REPORT.md`, committed and pushed to `origin/main`.
- [x] **Current Git State:** Clean working tree on `main`. Pushed to GitHub remote.
- [x] **Automated Tests:** 35 of 35 tests passing (`npx vitest run`).
- [x] **Production Build:** Passes cleanly (`tsc -b && vite build`) producing `dist/`.

---

## 2. Hostinger Production Release & Rollback Guide

### 2.1. Deployment Step-by-Step
1. Extract or upload `ifilmdirectory_audit5_release.zip` to Hostinger File Manager:
   - Path: `public_html/`
   - Ensure `public_html/.htaccess` is present and active (handles SPA routing and security restrictions).
2. Alternatively, upload via SFTP/FTP:
   ```bash
   python3 ftp_deploy.py <HOST> <USER> <PASS>
   ```
3. Purge CDN Edge Cache in Hostinger hPanel:
   - Navigate to: **Performance → Cache Manager**
   - Click: **Flush Cache / Purge All**
4. Verify deployment:
   ```bash
   curl -sI https://ifilmdirectory.com
   curl -s https://ifilmdirectory.com | grep -o 'src="/assets/index-[^"]*"'
   ```

### 2.2. Instant Rollback Procedure
If an issue occurs in production:
1. Re-deploy the previous validated release:
   - Previous commit: `385b410` (Audit 3 release)
   - Asset bundle: `dist/assets/index-BnERUT7g.js`
2. Run in terminal:
   ```bash
   git checkout 385b410
   npm run build
   # Re-upload dist/ contents to Hostinger public_html/
   ```
3. Purge Hostinger CDN cache immediately in hPanel.

---

## 3. Administrator Launch Checklist (Pending Final Execution)

These items require administrator console access, billing permissions, or credential management. Do not execute without administrator authorization.

| Category | Task | Recommended Command / Action | Importance |
|---|---|---|:---:|
| **Firestore Safety** | **Enable Delete Protection** | `gcloud firestore databases update --database="(default)" --delete-protection` | **High** |
| **Firestore Backup** | **Enable Point-In-Time Recovery** | `gcloud firestore databases update --database="(default)" --point-in-time-recovery` | **High** |
| **Telemetry** | **Set Sentry DSN** | Set `VITE_SENTRY_DSN` in production `.env` and rebuild; verify issue alerts reach `ifilmdirectory@gmail.com` | **Medium** |
| **Cost Control** | **Verify Budget Alert** | Confirm $5.00/month budget alert in [Google Cloud Billing](https://console.cloud.google.com/billing) for `ifilmdirectory-94b82` | **High** |
| **Media Safety** | **Cloudinary Trash Retention** | Enable 30-day Media Library backup in Cloudinary Settings dashboard | **Low** |

---

## 4. Prepared for Audit 6: Final Launch Readiness & Product Acceptance

The codebase and operations architecture are fully prepared for **Audit 6**.
- No dangling branches or unmerged code.
- Zero open regressions.
- Immutable build artifact packaged with checksum.
