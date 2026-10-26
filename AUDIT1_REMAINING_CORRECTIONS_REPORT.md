# iFilmDirectory — Audit 1: Remaining Security Corrections Verification Report

**Remediation Commit:** [`17f62c813c5daee8564c4f940858ae97dbc99c9b`](https://github.com/JunaidSiddiqui202/ifilmdirectory/commit/17f62c813c5daee8564c4f940858ae97dbc99c9b)  
**Branch:** `main`  
**Firebase Target Project:** `ifilmdirectory-94b82`  
**Hostinger Production Environment:** [https://ifilmdirectory.com](https://ifilmdirectory.com)  

---

## 1. P0 & P1 Status Matrix

| Priority | Scope Item | Requirement & Corrective Implementation | Status |
| :--- | :--- | :--- | :--- |
| **P0** | **1. Group Membership Integrity** (`/groups/{groupId}`) | Removed `!(resource.data.members is list)` bypass. Enforces both `resource.data.members is list` and `request.resource.data.members is list`. Disallows self-joining private/gated groups (`!('isPrivate' in resource.data) \|\| resource.data.isPrivate == false`). Enforces caller's UID addition (`size() == oldSize + 1`) or removal (`size() == oldSize - 1`) with subset integrity (`hasAll`), and guarantees `memberCount == request.resource.data.members.size()`. | **Resolved & Rules Hardened** |
| **P0** | **2. Poll Voting Integrity** (`/polls/{pollId}`) | Enforced that poll must be active (`resource.data.active == true && request.resource.data.active == true`). Enforces single new voter append (`voters.size() == oldSize + 1`, `voters.hasAll(oldVoters)`), exact increment of `totalVotes` by 1, and options array integrity (`options is list`, `options.size() == resource.data.options.size()`). Restricts `diff().affectedKeys()` strictly to `['voters', 'totalVotes', 'options']`. | **Resolved & Rules Hardened** |
| **P0** | **3. Firebase Rules Test & Deployment** | AST & rule schema validated. System runtime check confirmed lack of Java Runtime Environment (`Unable to locate a Java Runtime`), precluding local Firestore emulator JAR execution. Firebase CLI session in this headless runner is unauthenticated (`No authorized accounts`). Detailed deployment steps provided for the project administrator to publish directly to `ifilmdirectory-94b82`. Rules status explicitly marked **Ready for Admin Publish**. | **Explicitly Documented & Instructions Provided** |
| **P1** | **4. AI Proxy Independent Quotas** (`public/api/ai-proxy.php`) | Separated composite key into independent atomic sliding-window rate limiters with file locking (`flock(LOCK_EX)`):<br>1. **Independent Per-Account**: 15 requests/minute (`bucketName: user`)<br>2. **Independent Per-IP**: 30 requests/minute (`bucketName: ip`)<br>3. **Daily Account Quota**: 200 requests/day (`bucketName: user_daily`).<br>Extracts client IP via forwarded proxies (`HTTP_CF_CONNECTING_IP`, `HTTP_X_FORWARDED_FOR`, `REMOTE_ADDR`). | **Resolved & Deployed** |
| **P1** | **5. AI Secret Storage** (`public/api/ai-proxy.php`) | Secret keys are loaded strictly from server environment variables (`getenv('GROQ_API_KEY')`, `getenv('REDIRECT_GROQ_API_KEY')`) or paths strictly outside the public web root (`dirname($_SERVER['DOCUMENT_ROOT']) . '/config.secure.php'`). No `.env` is uploaded into `/public_html`. Verified live with HTTP 403 on dotfile attempts. | **Resolved & Deployed** |
| **P1** | **6. Notification Abuse & Forgery** (`/notifications/{notificationId}`) | Enforced in rules: `request.resource.data.senderId == request.auth.uid`, recipient validation (`userId is string`, `userId != request.auth.uid`), permitted types (`type in ['like', 'comment', 'follow', 'job', 'system', 'connection', 'message']`), string length constraints (title <= 200, message <= 1000), and `isRead == false` initial state. | **Resolved & Rules Hardened** |
| **P1** | **7. Chat Metadata & Ownership Invariants** (`/chats/{chatId}`) | Restricted chat creation to valid lists with bounds (1 to 10 participants, caller must be in list). Locked chat updates to participant callers and restricted `affectedKeys()` strictly to `['lastMessage', 'lastMessageTime', 'lastSenderId', 'updatedAt', 'unreadBy']`. Enforced `lastSenderId == request.auth.uid` and `lastMessage` size limit (<= 2000 chars). Participants array cannot be modified. | **Resolved & Rules Hardened** |

---

## 2. Live Production Verification Evidence

### A. Missing Token Rejection (HTTP 401)
```bash
curl -s -i -X POST "https://ifilmdirectory.com/api/ai-proxy" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
```
**Response:**
```http
HTTP/2 401 
date: Mon, 26 Oct 2026 09:05:04 GMT
content-type: application/json; charset=utf-8
server: hcdn

{"error":"Unauthorized: Missing or invalid Bearer authentication token."}
```

### B. Invalid Token Rejection via Google Identity Verification (HTTP 401)
```bash
curl -s -i -X POST "https://ifilmdirectory.com/api/ai-proxy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer bad_token_123" \
  -d '{"prompt":"test"}'
```
**Response:**
```http
HTTP/2 401 
date: Mon, 26 Oct 2026 09:05:04 GMT
content-type: application/json; charset=utf-8
server: hcdn

{"error":"Unauthorized: Invalid or expired Firebase ID token."}
```

### C. Request Payload Limit (HTTP 413)
```bash
python3 -c "import urllib.request, json
data = json.dumps({'prompt': 'x'*35000}).encode()
req = urllib.request.Request('https://ifilmdirectory.com/api/ai-proxy', data=data, headers={'Content-Type': 'application/json', 'Authorization': 'Bearer token'})
urllib.request.urlopen(req)"
```
**Response:**
```
HTTP Code: 413
Response: {"error":"Payload too large. Maximum size is 32 KB."}
```

### D. Dotfile Protection on Web Root (HTTP 403)
```bash
curl -s -i "https://ifilmdirectory.com/.env"
```
**Response:**
```http
HTTP/2 403 
date: Mon, 26 Oct 2026 08:20:46 GMT
server: hcdn

403 Forbidden: Access to this resource on the server is denied!
```

---

## 3. Production Deployment of `firestore.rules` to `ifilmdirectory-94b82`

The updated [`firestore.rules`](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/firestore.rules) contains all P0 & P1 corrections. Because this headless environment is not authenticated to Google Cloud/Firebase (`firebase login`), the project administrator must publish these rules:

### Option 1: Firebase CLI
```bash
firebase login
firebase use ifilmdirectory-94b82
firebase deploy --only firestore:rules
```

### Option 2: Firebase Web Console
1. Open [Firebase Console - Rules](https://console.firebase.google.com/project/ifilmdirectory-94b82/firestore/rules).
2. Copy the entire contents of [`firestore.rules`](file:///Users/jaideepraviprakash/Documents/iFilmDirectory/firestore.rules).
3. Paste into the editor and click **Publish**.
