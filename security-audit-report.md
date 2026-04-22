# Security Audit Report

**Date**: 2026-04-22
**Auditor**: Security Auditor Agent
**Project**: HubConnect Task Management System (React/Firebase)
**Severity Summary**: Critical: 2 | High: 4 | Medium: 4 | Low: 3 | Info: 4

> **WARNING**: This report contains sensitive security information. DO NOT commit to public repository.

---

## Attack Surface Overview

| Component | Technology | Risk Level |
|---|---|---|
| Frontend | React 18 + Vite | Medium |
| Backend | Firebase Cloud Functions | Medium |
| Database | Google Cloud Firestore | HIGH |
| Authentication | Firebase Auth (Google OAuth) | Medium |
| Storage | Firebase Storage | Medium |

---

## CRITICAL Vulnerabilities

### SEC-001: Firestore Rules — All Authenticated Users Can Read ALL Data

- **OWASP Category**: A01 — Broken Access Control
- **File**: `firestore.rules:25-95`
- **Evidence**: Every collection uses `allow read: if isAuthenticated()` without role/status restrictions:

```javascript
// Line 26 - users collection
allow read: if isAuthenticated();  // ← Any logged-in user can read ALL user profiles

// Line 33 - tasks collection
allow read: if isAuthenticated();  // ← Any logged-in user can read ALL tasks

// Line 51 - penalties collection
allow read: if isAuthenticated();  // ← Any logged-in user can read ALL financial penalties

// Line 44 - notifications collection
allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
// ← But create is: allow create: if isAuthenticated(); ← ANY user can create notifications for ANY user
```

- **Risk**: Any authenticated user (including those with `status: 'pending'` who should be blocked) can read:
  - All user profiles (email, role, isActive status)
  - All tasks (including tasks they are not assigned to)
  - All penalties (financial data exposure)
  - All notifications
  - All units, criteria sets, plans, submissions
- **Fix**: Add role/status checks to read rules:

```javascript
match /users/{userId} {
  allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
}

match /tasks/{taskId} {
  allow read: if isAuthenticated() && (
    request.auth.uid == resource.data.createdBy ||
    request.auth.uid in resource.data.assignees ||
    isAdminOrManager()
  );
}

match /penalties/{penaltyId} {
  allow read: if isAuthenticated() && (
    request.auth.uid == resource.data.userId ||
    isAdminOrManager()
  );
}
```

- **Reference**: [OWASP A01:2021 — Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

---

### SEC-002: Firestore Rules — No Validation of `status` Field

- **OWASP Category**: A01 — Broken Access Control
- **File**: `firestore.rules:4-17`
- **Evidence**: `getUserRole()` only returns the `role` field, never checks `status`:

```javascript
function getUserRole() {
  let isUser = exists(/databases/$(database)/documents/users/$(request.auth.uid));
  return isUser ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role : null;
}
```

AuthContext checks `status === 'approved'` for `isAdmin`, but Firestore rules don't know about `status`. A user with `role: 'admin'` but `status: 'pending'` would still have admin access in Firestore rules.

- **Risk**: Users with `status: 'pending'` who are logged in can read all data that any authenticated user can access (see SEC-001). Route guards in App.jsx redirect to `/pending`, but Firestore rules remain vulnerable.
- **Fix**: Add `isApproved()` function and use it:

```javascript
function isApproved() {
  let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
  return userDoc.data.status == 'approved' || (userDoc.data.isActive == true && !('status' in userDoc.data));
}

function isAuthenticatedAndApproved() {
  return isAuthenticated() && isApproved();
}
```

- **Reference**: [Firebase Security Rules Best Practices](https://firebase.google.com/docs/firestore/security/rules-query)

---

## HIGH Vulnerabilities

### SEC-003: Notification Creation — No User Authorization Check

- **OWASP Category**: A01 — Broken Access Control
- **File**: `firestore.rules:46`
- **Evidence**:
```javascript
match /notifications/{notifId} {
  allow create: if isAuthenticated();  // ← No userId validation
  // A malicious user can create notifications as ANY userId
}
```
Also in `src/firebase/firestore.js:381-395`:
```javascript
export const addNotification = async (userId, title, message, type = 'info', relatedTaskId = null) => {
  // ← userId parameter is not validated against request.auth.uid
  await addDoc(collection(db, 'notifications'), {
    userId,  // ← Attacker can pass any userId
    ...
  });
}
```

- **Risk**: Any authenticated user can send fake notifications to any other user, impersonating the system or other users.
- **Fix**: Validate in Firestore rules:
```javascript
allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
```

And in `addNotification` function, validate that target userId matches current user or is a task they're involved in.

---

### SEC-004: Submissions/ContestEntries — Any Authenticated User Can Create

- **OWASP Category**: A01 — Broken Access Control
- **File**: `firestore.rules:79,91`
- **Evidence**:
```javascript
match /submissions/{subId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated();  // ← Anyone can create submissions
}

match /contestEntries/{entryId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated();  // ← Anyone can create contest entries
}
```

- **Risk**: Any authenticated user (including `pending` users) can create fake submissions or contest entries, polluting data integrity.
- **Fix**: Add proper validation:
```javascript
allow create: if isAuthenticated() && isUnit();
```

---

### SEC-005: Auto-Penalty Runs Client-Side — Race Condition & Reliability

- **OWASP Category**: A04 — Insecure Design
- **File**: `src/hooks/useAutoOverduePenalties.js:26-84`
- **Evidence**: The entire penalty auto-creation logic runs client-side:
```javascript
export const useAutoOverduePenalties = () => {
  // ...
  const checkAndCreateOverduePenalties = useCallback(async () => {
    if (!isAdmin || !currentUser) return;  // ← Only runs if admin is online
    // ...
  }, [isAdmin, currentUser, tasks, penalties, ...]);

  useEffect(() => {
    // Debounce 2s
    const timeoutId = setTimeout(() => {
      checkAndCreateOverduePenalties();
    }, 2000);
  }, [...]);
};
```

- **Risk**:
  1. Only works when admin is online — if admin closes browser, no penalties are created
  2. Multiple admin tabs could create duplicate penalties (mitigated by `isProcessingRef` but still a race condition)
  3. Client-side logic can be manipulated by motivated users (though they'd need to be admin)
- **Mitigation**: There's a Cloud Function `autoOverduePenalty` (functions/index.js:355) that runs hourly as backup. However, it has `isPenalized` flag that the client-side hook doesn't respect — could cause double-penalty if both run.
- **Fix**: Remove client-side `useAutoOverduePenalties` hook and rely solely on Cloud Function. Or ensure they share state properly.

---

### SEC-006: Cloud Function `createUser` — Unused but Exposes Password Creation

- **OWASP Category**: A05 — Security Misconfiguration
- **File**: `functions/index.js:33-59`
- **Evidence**:
```javascript
exports.createUser = onCall(async (request) => {
  const { email, password, displayName, role } = request.data;
  // Creates Firebase Auth user with email/password
  const userRecord = await getAuth().createUser({
    email, password, displayName,
  });
```

The app only uses Google OAuth (`loginWithGoogle` in auth.js). This function is dead code but creates accounts with weak passwords.

- **Risk**: If this function is accidentally enabled or called, it creates user accounts with potentially weak passwords, bypassing the Google-only authentication policy.
- **Fix**: Remove unused Cloud Functions, or protect with additional admin verification if needed.

---

## MEDIUM Vulnerabilities

### SEC-007: Firestore Rules — `isUnit()` Has Different Query Pattern Than Other Roles

- **OWASP Category**: A01 — Broken Access Control
- **File**: `firestore.rules:14-16 vs 9-12`
- **Evidence**:
```javascript
function isUnit() {
  return exists(/databases/$(database)/documents/units/$(request.auth.uid));
  // ← Extra exists() check — slower, different from other role checks
}

function isAdmin() { return getUserRole() == 'admin'; }  // ← Uses getUserRole() which already exists()

// Both functions call exists() on user document, but isUnit() doesn't use getUserRole()
```

- **Risk**: Inconsistent authorization logic. The `isUnit()` function performs an extra `exists()` call when `getUserRole()` already does this. Could cause subtle timing issues.
- **Fix**: Refactor to use consistent pattern:
```javascript
function isUnit() {
  return getUserRole() == 'unit';  // Consistent with isAdmin/isManager
}
```

---

### SEC-008: Task Create — No Validation on `createdBy` Field

- **OWASP Category**: A05 — Security Misconfiguration
- **File**: `firestore.rules:34` and `src/firebase/firestore.js:150-163`
- **Evidence**:
```javascript
// Firestore rule
allow create: if isAuthenticated() && (isAdminOrManager() || request.resource.data.createdBy == request.auth.uid);

// firestore.js createTask
export const createTask = async (taskData) => {
  const docRef = await addDoc(collection(db, 'tasks'), {
    ...taskData,  // ← createdBy comes from client, not validated
    createdAt: serverTimestamp(),
    ...
  });
```

The client passes `createdBy` in `taskData`. Rule validates it, but if client passes wrong `createdBy`, Firestore rejects — so this is OK. However, `createdBy` is set from `currentUser.uid` in TaskForm (line 65), which is correct.

- **Risk**: Medium — the rule protects against forged `createdBy`, but the flexibility of the rule (`request.resource.data.createdBy == request.auth.uid`) allows any user to create tasks on behalf of themselves.
- **Fix**: Ensure rules are correctly deployed and tested.

---

### SEC-009: Missing Rate Limiting on Auth Context Loading

- **OWASP Category**: A04 — Insecure Design
- **File**: `src/context/AuthContext.jsx:31-106`
- **Evidence**:
```javascript
const unsubscribe = onAuthStateChanged(auth, async (user) => {
  setCurrentUser(user);
  // On every auth state change, queries Firestore for user profile
  // Also runs getUserProfile() which does getDoc, then potentially more getDocs
  // No debounce or rate limiting
});
```

- **Risk**: If Firebase Auth state changes rapidly (e.g., token refresh issues), multiple Firestore queries could fire simultaneously.
- **Fix**: Add debounce or use a flag to prevent concurrent profile fetches.

---

### SEC-010: Soft Delete Only — No Hard Delete Audit Trail

- **OWASP Category**: A09 — Security Logging Failures
- **File**: `src/firebase/firestore.js:216-233`
- **Evidence**:
```javascript
export const deleteTask = async (taskId) => {
  return updateDoc(doc(db, 'tasks', taskId), {
    isDeleted: true,  // ← Soft delete
    deletedAt: serverTimestamp(),
  });
};
```

Firestore rule allows admin to delete (line 40), but there's no audit log of WHO deleted what.

- **Risk**: No accountability for task deletion. Deleted tasks can be restored but there's no record of who initiated the delete.
- **Fix**: Add deletion audit in `editHistory` array or create a separate `deletionLog` collection.

---

## LOW Vulnerabilities

### SEC-011: Console Warning Exposes Firebase Not Configured State

- **OWASP Category**: A05 — Security Misconfiguration
- **File**: `src/firebase/config.js:19-21`
- **Evidence**:
```javascript
if (!isConfigured) {
  console.warn('⚠️ Firebase chưa được cấu hình. Hãy tạo file .env với config từ Firebase Console. Xem README.md.');
}
```

- **Risk**: Low — only exposes that Firebase isn't configured, not actual secrets.
- **Fix**: Remove or reduce console message verbosity.

---

### SEC-012: Firebase API Key in .env (Client-Side Exposure)

- **OWASP Category**: A02 — Cryptographic Failures
- **File**: `src/firebase/config.js:10-17`
- **Evidence**:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyNotReal',
  // ← API key is bundled into client-side JS
```

- **Risk**: Firebase API keys are designed to be client-side exposed (they have restrictions via Firebase Console allowed domains). This is standard Firebase architecture, not a vulnerability. However, if not properly restricted in Firebase Console, could be abused.
- **Mitigation**: Ensure Firebase Console has proper HTTP referrer restrictions. Current `.env.example` pattern is correct.
- **Fix**: No fix needed — this is how Firebase works. Verify restrictions in Firebase Console.

---

### SEC-013: Theme Preference in localStorage — Low Risk

- **OWASP Category**: A04 — Insecure Design
- **File**: `src/components/layout/Sidebar.jsx:35-45`
- **Evidence**:
```javascript
localStorage.getItem('theme') === 'dark'
localStorage.setItem('theme', 'dark');
```

- **Risk**: Low — only stores theme preference, no sensitive data.
- **Fix**: None needed.

---

## INFORMATIONAL Findings

### SEC-014: No CSP Headers Configured

- **OWASP Category**: A05 — Security Misconfiguration
- **File**: N/A — Firebase Hosting configuration
- **Evidence**: No Content-Security-Policy headers found in codebase.
- **Risk**: Low for React SPA (XSS prevention is React's job), but CSP would add defense-in-depth.
- **Fix**: Configure CSP in `firebase.json` or Firebase Hosting settings if needed.

---

### SEC-015: Email/Password Auth Enabled but Unused

- **OWASP Category**: A05 — Security Misconfiguration
- **File**: `functions/index.js` (unused createUser with password)
- **Evidence**: `loginWithEmail` exists in auth.js (line 49) but is never used in the app (only Google login). Cloud Function `createUser` creates email/password accounts.
- **Risk**: Unused code paths increase attack surface. If accidentally called, creates accounts with passwords.
- **Fix**: Disable email/password auth in Firebase Console if not needed, or remove dead code.

---

### SEC-016: `validateFile` — MIME Type Check Only, No Magic Bytes

- **OWASP Category**: A05 — Security Misconfiguration
- **File**: `src/firebase/storage.js:55-62`
- **Evidence**:
```javascript
export const validateFile = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {  // ← Only checks MIME from upload
    return { valid: false, ... };
  }
  // No magic byte verification
```

- **Risk**: User can bypass MIME check by modifying file header. However, Firebase Storage serves files with proper Content-Type, so execution depends on how files are served.
- **Fix**: Add magic byte validation for uploaded files if strict security is needed.

---

### SEC-017: No Security Headers in Toaster Configuration

- **OWASP Category**: A05 — Security Misconfiguration
- **File**: `src/App.jsx:171-190`
- **Evidence**: Toaster component from react-hot-toast with custom styling.
- **Risk**: Low — toast library is widely used, no known XSS in this usage pattern.
- **Fix**: None needed.

---

## Security Controls Already Implemented (GOOD)

1. **Route Guards in App.jsx** — `ProtectedRoute` checks `isPending` and redirects appropriately
2. **AuthContext Role Checks** — `isAdmin`, `isManager`, `isUnit` computed correctly from `userProfile`
3. **Client-side Status Validation** — `isApproved` checks both `status` and `isActive` fields
4. **No `dangerouslySetInnerHTML`** — No XSS vectors found in React code
5. **File Validation** — `validateFile` checks MIME type and size before upload
6. **Cloud Functions Admin Checks** — `requireAdmin()` and `requireAdminOrManager()` on all sensitive functions
7. **Cloud Function `autoDataRetention`** — Scheduled cleanup of old deleted tasks (good data hygiene)
8. **No Secrets in Code** — No hardcoded passwords, API keys, or tokens found
9. **No `eval()` or `new Function()`** — Safe from code injection
10. **Soft Delete Pattern** — Tasks are never hard-deleted (only admin can delete, but restore is possible)

---

## Recommended Priority Fixes

### P0 — Fix Immediately (Critical):

1. **SEC-001**: Add role-based read rules to Firestore — prevent users from reading other users' data
2. **SEC-002**: Add `status` validation to Firestore rules — enforce approved status
3. **SEC-003**: Fix notification creation rules — validate target userId

### P1 — Fix Within 1 Week (High):

4. **SEC-004**: Fix submissions/contestEntries create rules
5. **SEC-005**: Remove client-side auto-penalty hook, rely on Cloud Function
6. **SEC-006**: Remove unused `createUser` Cloud Function

### P2 — Fix Within 1 Month (Medium):

7. **SEC-007**: Refactor `isUnit()` to use consistent pattern
8. **SEC-008**: Audit all Firestore rules for consistency
9. **SEC-009**: Add debounce to AuthContext profile fetches
10. **SEC-010**: Add deletion audit trail

### P3 — Consider Later (Low):

11. **SEC-011 through SEC-017**: Address as needed based on threat model

---

## Manual Verification Steps

1. **Deploy and test Firestore rules** using Firebase Emulator Suite
2. **Verify SEC-001** by logging in as a `pending` user and attempting to read `/tasks`, `/penalties`, `/users` collections
3. **Check Firebase Console** → Authentication → Sign-in method: ensure email/password is disabled if unused
4. **Review Firebase Console** → Firestore → Rules: ensure HTTP referrer restrictions are set for the API key
5. **Test notification spoofing** by calling `addNotification` with a different `userId` parameter

---

*Report generated by Security Auditor Agent — 2Anh AI Education*
*Framework: OWASP Top 10 2021*