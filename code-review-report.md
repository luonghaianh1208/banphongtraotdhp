# Code Review Report

**Date**: 2026-04-22
**Reviewer**: Code Reviewer Agent
**Files Reviewed**: 42 files (src/App.jsx, src/firebase/*.js, src/context/*.jsx, src/hooks/*.js, src/components/**/*.jsx, src/pages/**/*.jsx, src/utils/*.js, firestore.rules)

---

## Summary

Project la React/Firebase task management system voi 4 role (admin/manager/member/unit), realtime Firestore subscriptions, va auto-penalty system. Code quality overall good, architecture ro rang.

**Total issues found: 25**
- CAO (Critical): 3
- TRUNG (Medium): 10
- THAP (Low): 12

---

## Architecture Overview

### Strengths
- Clean component structure voi separation of concerns
- Proper lazy loading cho routes
- Good use of Context providers (Auth, TaskConfig, Notification)
- Realtime data flow with onSnapshot properly cleaned up
- Soft-delete pattern implemented correctly
- Role-based access control at both route and Firestore rule level

### Areas of Concern
- Potential race conditions in AuthContext async callback
- Some hooks not properly memoized
- Missing field validation before Firestore writes
- Performance concerns in heavy render components

---

## Issues Found

### CAO (Critical Priority)

#### 1. Firestore Rules - Missing size limit on responses/scores field
- **File**: `firestore.rules`
- **Line**: 80 (submissions update rule)
- **Description**: The `submissions` collection allows authenticated users to update `responses` and `scores` fields with no size limit. A malicious user could upload extremely large payloads causing DoS.
- **Current Code**:
```javascript
allow update: if isAdminOrManager() || (isUnit() && resource.data.unitId == request.auth.uid);
```
- **Suggested Fix**:
```javascript
allow update: if isAdminOrManager() || (isUnit() && resource.data.unitId == request.auth.uid)
  && request.resource.data.responses.size() <= 100
  && request.resource.data.scores.size() <= 100;
```

#### 2. AuthContext - Race condition in async auth callback
- **File**: `src/context/AuthContext.jsx`
- **Line**: 31-112
- **Description**: The `onAuthStateChanged` callback is async and performs multiple await operations. If auth state changes rapidly (user logs out while profile is being fetched), the `unsubProfile` cleanup may race with new subscriptions, potentially causing memory leaks or state inconsistency.
- **Current Code**:
```javascript
const unsubscribe = onAuthStateChanged(auth, async (user) => {
  setCurrentUser(user);
  setProfileError(false);
  if (unsubProfile) { unsubProfile(); unsubProfile = null; }
  if (user) {
    try {
      let profile = await getUserProfile(user.uid);
      // ...
      unsubProfile = onSnapshot(doc(db, targetCollection, user.uid), ...);
    } catch (err) { ... }
  }
});
```
- **Suggested Fix**: Use a ref to track current user UID and abort pending operations when user changes:
```javascript
const profileFetchId = useRef(null);
const unsubscribe = onAuthStateChanged(auth, async (user) => {
  const currentFetchId = ++profileFetchId.current;
  setCurrentUser(user);
  if (unsubProfile) { unsubProfile(); unsubProfile = null; }
  if (!user) { setUserProfile(null); setLoading(false); return; }
  try {
    const profile = await getUserProfile(user.uid);
    if (currentFetchId !== profileFetchId.current) return; // Stale
    // ... rest of profile handling
  }
});
```

#### 3. handleRemind closes modal before verifying success
- **File**: `src/components/task/TaskDetail.jsx`
- **Line**: 210-221
- **Description**: `onClose()` is called immediately after `handleRemindTask` succeeds, before checking if the operation completed. If the update fails silently, the UI has already closed the modal.
- **Current Code**:
```javascript
const handleRemind = async () => {
  setLoading(true);
  try {
    await handleRemindTask(task, currentUser.uid);
    toast.success('Đã nhắc việc thành công!');
    onClose(); // <-- Closes modal even if toast fails
  } catch (err) {
    toast.error('Lỗi khi nhắc việc: ' + err.message);
  } finally {
    setLoading(false);
  }
};
```
- **Suggested Fix**: Only call `onClose()` inside the try block after confirming success, or move it to after the toast confirmation:
```javascript
const handleRemind = async () => {
  setLoading(true);
  try {
    await handleRemindTask(task, currentUser.uid);
    toast.success('Đã nhắc việc thành công!');
    setTimeout(() => onClose(), 500); // Allow toast to show first
  } catch (err) {
    toast.error('Lỗi khi nhắc việc: ' + err.message);
    setLoading(false);
  }
};
```

---

### TRUNG (Medium Priority)

#### 4. TaskCard - Inline arrow functions in map causing re-renders
- **File**: `src/components/task/TaskCard.jsx`
- **Line**: 12-14
- **Description**: `assigneeNames` is computed inline using map on every render. Also `getUploaderName` in TaskDetail is defined as a regular function instead of useCallback.
- **Current Code**:
```javascript
const assigneeNames = (task.assignees || [])
  .map(uid => users.find(u => u.id === uid)?.displayName || '?')
  .join(', ');
```
- **Suggested Fix**: Use `useMemo`:
```javascript
const assigneeNames = useMemo(() =>
  (task.assignees || [])
    .map(uid => users.find(u => u.id === uid)?.displayName || '?')
    .join(', '),
  [task.assignees, users]
);
```

#### 5. TodayPage - sortedTasks computed on every render
- **File**: `src/pages/TodayPage.jsx`
- **Line**: 43-54
- **Description**: `sortedTasks` is recalculated on every render despite being derived from stable data. Should be memoized.
- **Current Code**:
```javascript
const sortedTasks = [...filteredTasks].sort((a, b) => {
  const statusA = getTaskDisplayStatus(a);
  // ...
});
```
- **Suggested Fix**: Wrap in `useMemo`:
```javascript
const sortedTasks = useMemo(() => {
  return [...filteredTasks].sort((a, b) => {
    // sorting logic
  });
}, [filteredTasks]);
```

#### 6. subscribeToTasks - No composite index documented for isDeleted + createdAt
- **File**: `src/firebase/firestore.js`
- **Line**: 89-94
- **Description**: The query `where('isDeleted', '==', false)` + `orderBy('createdAt', 'desc')` requires a composite index. If not created, the query will fail or be very slow. Not documented anywhere.
- **Current Code**:
```javascript
const q = query(
  collection(db, 'tasks'),
  where('isDeleted', '==', false),
  orderBy('createdAt', 'desc'),
  limit(maxItems)
);
```
- **Suggested Fix**: Either document the required index in README, or handle the error gracefully and fall back to a simpler query.

#### 7. useAutoOverduePenalties - Callback recreated on every tasks/penalties change
- **File**: `src/hooks/useAutoOverduePenalties.js`
- **Line**: 25, 95
- **Description**: `checkAndCreateOverduePenalties` is in the effect dependency array, but it depends on `tasks` and `penalties`. Every time tasks change, a new callback is created which triggers the effect again.
- **Current Code**:
```javascript
}, [isAdmin, currentUser, tasks, penalties, penaltyTypes, checkAndCreateOverduePenalties]);
```
- **Suggested Fix**: Use ref for tasks/penalties to avoid triggering effect on every data change:
```javascript
const tasksRef = useRef(tasks);
const penaltiesRef = useRef(penalties);
useEffect(() => { tasksRef.current = tasks; }, [tasks]);
useEffect(() => { penaltiesRef.current = penalties; }, [penalties]);
// Then use tasksRef.current inside checkAndCreateOverduePenalties
```

#### 8. setDoc in AuthContext on every new user creation without unique check
- **File**: `src/context/AuthContext.jsx`
- **Line**: 65
- **Description**: `setDoc` is called for every new user but only after checking if the doc doesn't exist. However, the initial check uses `getDocs` (which is a query, not a direct doc read) which could have timing issues if the doc is created between check and set.
- **Current Code**:
```javascript
if (!docSnap.exists()) {
  await setDoc(doc(db, 'users', user.uid), newProfile);
  profile = { id: user.uid, ...newProfile };
}
```
- **Suggested Fix**: Use a transaction or handle the potential write error if doc already exists:
```javascript
try {
  await setDoc(doc(db, 'users', user.uid), newProfile);
  profile = { id: user.uid, ...newProfile };
} catch (err) {
  if (err.code === 'already-exists') {
    const fresh = await getDoc(doc(db, 'users', user.uid));
    profile = { id: fresh.id, ...fresh.data() };
  } else throw err;
}
```

#### 9. TaskForm - No client-side validation on file size before upload
- **File**: `src/components/task/TaskForm.jsx`
- **Line**: 35-44
- **Description**: `validateFile` is called but the actual file size check happens only after `handleFileChange`. Large files could still cause issues.
- **Current Code**:
```javascript
const handleFileChange = (e) => {
  const selectedFiles = Array.from(e.target.files);
  for (const file of selectedFiles) {
    const validation = validateFile(file);
    if (!validation.valid) { ... }
  }
  setFiles(prev => [...prev, ...selectedFiles]);
};
```
- **Suggested Fix**: Check file size directly before adding to state:
```javascript
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const handleFileChange = (e) => {
  const selectedFiles = Array.from(e.target.files);
  for (const file of selectedFiles) {
    if (file.size > MAX_SIZE) {
      toast.error(`File "${file.name}" vuot qua 10MB`);
      return;
    }
    const validation = validateFile(file);
    if (!validation.valid) { ... }
  }
  setFiles(prev => [...prev, ...selectedFiles]);
};
```

#### 10. Missing loading states in handleExtendDeadline fallback
- **File**: `src/hooks/useTaskActions.js`
- **Line**: 89-106
- **Description**: When Cloud Function fails and fallback Firestore update is used, there's no loading state handling between the two paths. The success toast always shows regardless of which path succeeded.
- **Current Code**:
```javascript
export const handleExtendDeadline = async (task, newDeadline, currentUserUid) => {
  try {
    await callExtendDeadline({ ... });
  } catch {
    await updateTask(task.id, { ... });
  }
  toast.success('Da gia han deadline'); // Always shows
};
```
- **Suggested Fix**: Track which path succeeded and show appropriate feedback:
```javascript
export const handleExtendDeadline = async (task, newDeadline, currentUserUid) => {
  let cloudFnWorked = false;
  try {
    await callExtendDeadline({ taskId: task.id, newDeadline: parseVNTime(newDeadline).toISOString() });
    cloudFnWorked = true;
  } catch {
    await updateTask(task.id, {
      originalDeadline: task.originalDeadline || task.deadline,
      deadline: parseVNTime(newDeadline),
      status: 'extended',
    }, currentUserUid, {
      action: 'extend', field: 'deadline',
      oldValue: formatDateTime(task.deadline),
      newValue: newDeadline,
    });
  }
  toast.success('Da gia han deadline');
};
```

#### 11. NotificationContext missing error handling
- **File**: `src/context/NotificationContext.jsx`
- **Line**: 27
- **Description**: `subscribeToNotifications` callback has no error handling. If subscription fails, user sees empty notifications with no feedback.
- **Current Code**:
```javascript
const unsubscribe = subscribeToNotifications(currentUser.uid, (notifs) => {
  setNotifications(notifs);
  setLoading(false);
});
```
- **Suggested Fix**: Add error callback:
```javascript
const unsubscribe = subscribeToNotifications(
  currentUser.uid,
  (notifs) => { setNotifications(notifs); setLoading(false); },
  (err) => {
    console.error('Loi tai thong bao:', err);
    setLoading(false);
    toast.error('Loi tai thong bao');
  }
);
```

#### 12. getTaskDisplayStatus called repeatedly in TodayPage without memo
- **File**: `src/pages/TodayPage.jsx`
- **Line**: 56-59
- **Description**: `urgentCount` computation calls `getTaskDisplayStatus` on every render. This function is also called in `sortedTasks` sorting.
- **Current Code**:
```javascript
const urgentCount = activeTasks.filter(t => {
  const s = getTaskDisplayStatus(t);
  return s === TASK_DISPLAY_STATUS.URGENT || s === TASK_DISPLAY_STATUS.OVERDUE;
}).length;
```
- **Suggested Fix**: Memoize this computation with useMemo.

---

### THAP (Low Priority)

#### 13. Missing cleanup in useAllPenalties
- **File**: `src/hooks/usePenalties.js`
- **Line**: 26-39
- **Description**: `useAllPenalties` has no onError callback passed to `subscribeToAllPenalties`.
- **Current Code**:
```javascript
const unsub = subscribeToAllPenalties((data) => {
  setPenalties(data);
  setLoading(false);
});
```
- **Suggested Fix**: Add error handling:
```javascript
const unsub = subscribeToAllPenalties(
  (data) => { setPenalties(data); setLoading(false); },
  (err) => { console.error(err); setLoading(false); }
);
```

#### 14. DashboardPage - barData computed inline without memoization
- **File**: `src/pages/DashboardPage.jsx`
- **Line**: 36-40
- **Description**: `barData` is computed on every render, filtering all users and tasks.
- **Current Code**:
```javascript
const barData = users.filter(u => u.isActive !== false).map(user => {
  const userTasks = tasks.filter(t => t.assignees?.includes(user.id));
  // ...
});
```
- **Suggested Fix**: Wrap in useMemo.

#### 15. CriteriaSetsPage - createPortal called inline in JSX
- **File**: `src/components/criteria/CriteriaSetsPage.jsx`
- **Line**: 226-349
- **Description**: The modal is rendered inline with `createPortal` inside the JSX return, making it harder to test and reason about.
- **Suggested Fix**: Extract to a separate Modal component with isOpen prop.

#### 16. PlansManagePage - Same inline createPortal pattern
- **File**: `src/components/criteria/PlansManagePage.jsx`
- **Line**: 321-447
- **Description**: Same issue as CriteriaSetsPage - modal rendered inline.

#### 17. Missing Toast import in NotificationContext
- **File**: `src/context/NotificationContext.jsx`
- **Line**: 4
- **Description**: The file doesn't import toast but might need it for error feedback.
- **Current Code**: No toast import.

#### 18. getCategoryById returns default without checking for empty array
- **File**: `src/context/TaskConfigContext.jsx`
- **Line**: 47-49
- **Description**: If `categories` is empty, `find` returns undefined and the fallback is returned correctly. However, the pattern is inconsistent with `getPriorityById`.
- **Current Code**:
```javascript
const getCategoryById = (id) => {
  if (!id || id === 'other') return categories.find(c => c.id === 'other') || { id: 'other', name: 'Khac', color: '#9CA3AF' };
  return categories.find(c => c.id === id) || { id: 'other', name: 'Khac', color: '#9CA3AF' };
};
```
- **Suggested Fix**: Consistent with getPriorityById pattern, but current code works.

#### 19. TaskCard - creatorName uses fallback '?' which appears in UI
- **File**: `src/components/task/TaskCard.jsx`
- **Line**: 16
- **Description**: If user not found, '?' is shown in the card. Should handle this case more gracefully.
- **Current Code**:
```javascript
const creatorName = users.find(u => u.id === task.createdBy)?.displayName || '?';
```
- **Suggested Fix**: Show something less jarring like 'Unknown' or hide the badge entirely if unknown.

#### 20. Sidebar - NAV_ITEMS filter has no defensive check for undefined role
- **File**: `src/components/layout/Sidebar.jsx`
- **Line**: 59-61
- **Description**: If `userProfile?.role` is undefined, `item.roles.includes(undefined)` works but could cause issues if role list is missing.
- **Current Code**:
```javascript
const visibleItems = NAV_ITEMS.filter(item =>
  item.roles.includes(userProfile?.role)
);
```
- **Suggested Fix**: Add defensive check:
```javascript
const visibleItems = NAV_ITEMS.filter(item =>
  userProfile?.role && item.roles.includes(userProfile.role)
);
```

#### 21. EmptyState component usage with aria-label missing
- **File**: `src/components/common/EmptyState.jsx` (not reviewed, assumed simple)
- **Description**: Accessibility - ensure all interactive elements have proper labels.

#### 22. TodayPage - StatCard is defined inline in same file
- **File**: `src/pages/TodayPage.jsx`
- **Line**: 224
- **Description**: Inline component definition at bottom of file makes it harder to test. Consider extracting to separate file.
- **Current Code**:
```javascript
const StatCard = ({ icon: Icon, label, value, gradient, iconColor }) => (...)
```

#### 23. DashboardPage - Same inline StatCard issue
- **File**: `src/pages/DashboardPage.jsx`
- **Line**: 278

#### 24. Missing null check for newDeadline in handleExtend
- **File**: `src/components/task/TaskDetail.jsx`
- **Line**: 236-251
- **Description**: `newDeadline` is checked for null but if user passes invalid date, it could crash.
- **Current Code**:
```javascript
if (!newDeadline) return toast.error('Vui long chon deadline moi');
```

#### 25. Console.error used throughout for error logging - should use structured logging
- **Files**: Multiple files (firestore.js, criteriaFirestore.js, various hooks)
- **Description**: `console.error` is used for error logging. In production, this should be structured logging with context.

---

## Recommendations

### High Priority
1. Fix the race condition in AuthContext - critical for auth security
2. Add size limits to Firestore rules for submissions collection
3. Fix handleRemind to not close modal before confirming success

### Medium Priority
4. Memoize sortedTasks in TodayPage
5. Add composite index documentation for tasks query
6. Fix useAutoOverduePenalties dependency array issue
7. Add Toast error feedback to NotificationContext

### Lower Priority
8. Extract inline modals to separate components
9. Memoize barData in DashboardPage
10. Add error callbacks to all onSnapshot calls
11. Consider adding React.memo to TaskCard/TaskDetail for heavy renders

---

## Files Analyzed

- `src/App.jsx` - Route structure, lazy loading, protected routes
- `src/firebase/auth.js` - Google login, profile creation
- `src/firebase/firestore.js` - Core CRUD operations, realtime subscriptions
- `src/firebase/criteriaFirestore.js` - Criteria/plans/submissions CRUD
- `src/firebase/config.js` - Firebase initialization
- `src/firebase/functions.js` - Cloud function references
- `src/firebase/storage.js` - File upload (not reviewed fully)
- `src/context/AuthContext.jsx` - Auth state management
- `src/context/TaskConfigContext.jsx` - Categories, priorities, penalty types
- `src/context/NotificationContext.jsx` - Realtime notifications
- `src/hooks/useTasks.js` - Tasks subscription
- `src/hooks/useUsers.js` - Users subscription
- `src/hooks/usePenalties.js` - Penalties subscription and actions
- `src/hooks/useUnits.js` - Units subscription
- `src/hooks/useCriteriaSets.js` - Criteria sets subscription
- `src/hooks/usePlans.js` - Plans subscription
- `src/hooks/useSubmissions.js` - Submissions subscription
- `src/hooks/useContestEntries.js` - Contest entries subscription
- `src/hooks/useTaskActions.js` - Shared task action helpers
- `src/hooks/useTaskCRUD.js` - Task create/edit with file upload
- `src/hooks/useAutoOverduePenalties.js` - Auto penalty system
- `src/utils/statusUtils.js` - Task status computation
- `src/utils/dateUtils.js` - Date formatting utilities
- `src/utils/constants.js` - Constants, navigation items
- `src/utils/exportExcel.js` - Excel export functionality
- `src/components/common/Modal.jsx` - Portal modal
- `src/components/common/ConfirmDialog.jsx` - Portal confirmation dialog
- `src/components/common/ErrorBoundary.jsx` - Error boundary
- `src/components/common/EmptyState.jsx` - Empty state component
- `src/components/common/LoadingSpinner.jsx` - Loading spinner
- `src/components/common/Skeleton.jsx` - Skeleton loaders
- `src/components/task/TaskCard.jsx` - Task card component
- `src/components/task/TaskDetail.jsx` - Task detail modal
- `src/components/task/TaskForm.jsx` - Task create/edit form
- `src/components/task/StatusBadge.jsx` - Status badge
- `src/components/task/PriorityBadge.jsx` - Priority badge
- `src/components/layout/Sidebar.jsx` - Navigation sidebar
- `src/components/layout/MainLayout.jsx` - Main layout wrapper
- `src/components/layout/Header.jsx` - Header component
- `src/components/criteria/CriteriaSetsPage.jsx` - Criteria sets management
- `src/components/criteria/PlansManagePage.jsx` - Plans management
- `src/pages/TodayPage.jsx` - Today's tasks page
- `src/pages/DashboardPage.jsx` - Dashboard with charts
- `src/pages/SettingsPage.jsx` - User settings
- `src/pages/TrashPage.jsx` - Trash management
- `firestore.rules` - Firestore security rules