# Code Review Report

**Date**: 2026-04-22
**Reviewer**: Code Reviewer Agent
**Files Reviewed**: 28 files (src/)

## Summary

Large feature expansion introducing criteria/submission evaluation system + unit portal. Overall architecture is sound with good separation between admin and unit roles. Critical issues center on error handling inconsistencies, bulk operation limits, and missing null checks in data transformations.

**Total issues found**: 12
- CRITICAL/HIGH: 4 | MEDIUM: 5 | LOW: 3

**VERDICT: NEEDS FIXES BEFORE MERGE**

---

## Issues Found

### 🔴 CRITICAL / HIGH

#### [1] Bulk delete may exceed Firestore batch limit
- **File**: `PlansManagePage.jsx:106-113`
- **Description**: `handleBulkDelete` uses sequential `await deletePlan(id)` in a loop. No batching. For large selections (500+), this will fail or timeout.
- **Current Code**:
```js
for (const id of selected) await deletePlan(id);
```
- **Suggested Fix**: Implement batch deletes via `writeBatch` (max 500 per batch) or chunked processing.

---

#### [2] Sequential import with no rate limiting / batch processing
- **File**: `UnitsPage.jsx:90-104`
- **Description**: Excel import awaits each `createUnitFn` call sequentially inside `for...of`. For large imports (100+ rows), this will be slow and may hit Firebase function timeout. No parallelization or batching.
- **Current Code**:
```js
for (const row of validRows) {
    await createUnitFn({...});
    setImportProgress(...);
}
```
- **Suggested Fix**: Use `Promise.all` with chunking (e.g., 10-20 concurrent), or use a batch callable function.

---

#### [3] `toast` used but `toast` not imported in PeriodsManagePage
- **File**: `PeriodsManagePage.jsx:23,38,41,51,54`
- **Description**: Uses `toast.error()` / `toast.success()` but `toast` is never imported. Native `alert()` used elsewhere in same file. Will crash at runtime.
- **Current Code**: No import for `toast`.
- **Suggested Fix**: Add `import toast from 'react-hot-toast';` at top.

---

#### [4] `toast` used but `toast` not imported in CriteriaSetsPage
- **File**: `CriteriaSetsPage.jsx:47,48,52,62,72,73,79,82,84`
- **Description**: Uses `toast.success()` / `toast.error()` but `toast` is never imported. Will crash.
- **Suggested Fix**: Add `import toast from 'react-hot-toast';` at top.

---

### 🟡 MEDIUM

#### [5] File upload has no client-side size limit check
- **File**: `EvidenceUpload.jsx:9-55`
- **Description**: No file size validation before upload. UI mentions "25MB max" but no enforcement. Large files will upload to Firebase Storage and only then fail, wasting bandwidth.
- **Current Code**:
```js
const handleFileUpload = async (e) => {
    const fileList = Array.from(e.target.files);
    // no size check
```
- **Suggested Fix**: Add `if (file.size > 25 * 1024 * 1024) { alert('File quá 25MB'); return; }`

---

#### [6] Potential NaN in UnitSubmitPage progress bar
- **File**: `UnitSubmitPage.jsx:181,186`
- **Description**: `criteriaSet.totalMaxScore` could be 0 or undefined, causing division by zero or NaN displayed in UI.
```js
style={{ width: `${Math.min(100, (currentTotalScore / criteriaSet.totalMaxScore) * 100)}%` }}
```
- **Suggested Fix**: Add guard: `(criteriaSet.totalMaxScore || 1)`

---

#### [7] Inline edit title allows empty string save
- **File**: `CriteriaSetsPage.jsx:77-85`
- **Description**: `saveEdit` checks `editTitle.trim()` empty then returns early, but the UX allows pressing Enter which triggers save even when invalid. Also no error feedback to user when trimmed empty.
- **Current Code**:
```js
const saveEdit = async () => {
    if (!editTitle.trim()) { toast.error('Tên không được rỗng'); return; }
```
- **Suggested Fix**: Block Enter key or prevent empty state entirely.

---

#### [8] Missing `id` key in overdue table row
- **File**: `DashboardPage.jsx:240-241`
- **Description**: `overdueByMember.map(({ user, tasks: overTasks }, i)` uses array index `i` as key instead of stable `user.id`. If users reorder, React will mis-reconcile.
- **Current Code**:
```js
{overdueByMember.map(({ user, tasks: overTasks }, i) => (
    <tr key={i} ...
```
- **Suggested Fix**: Use `key={user.id}`.

---

#### [9] `onChange` prop defaults to no-op, silently ignored
- **File**: `ConditionRow.jsx:9`, `GradeInputCard.jsx:8`
- **Description**: `onChange = () => {}` makes it easy to forget to pass handler. No warning in dev mode. Particularly dangerous in `GradeInputCard` where `onChange` is the primary way to update score.
- **Suggested Fix**: Consider `console.warn` in dev build if not provided, or make required prop via TypeScript.

---

### 🟢 LOW

#### [10] Typo in UnitsPage label
- **File**: `UnitsPage.jsx:399`
- **Description**: Label says "Tên cơ sở cơ sở" (doubling word).
- **Current Code**: `'Tên cơ sở cơ sở'`
- **Suggested Fix**: Change to `'Tên cơ sở'`

---

#### [11] Inconsistent `alert` vs `toast` usage across files
- **Files**: PeriodsManagePage, CriteriaSetsPage, PlansManagePage, CriteriaDetailPage
- **Description**: Mix of native `alert()` for errors and `toast()` for success. This creates jarring UX. `alert()` is also blocking and modal.
- **Suggested Fix**: Standardize on `toast.error()` for all error cases everywhere.

---

#### [12] Dead code: `loginWithEmail` and `changePassword` unused
- **File**: `src/firebase/auth.js:49-59`
- **Description**: Both functions defined but never called. `loginWithEmail` may be intentional but `changePassword` seems unused (app uses Google login only).
- **Suggested Fix**: Remove if truly unused, or mark with `/** @deprecated */`.

---

## Recommendations

1. **Firestore batch operations**: All bulk delete/create operations should use `writeBatch` with chunking (max 500 ops per batch) to avoid timeout and quota issues.

2. **Add TypeScript**: Several files have implicit `any` or loose prop types. A gradual migration would catch many issues at compile time.

3. **Error boundary**: Several pages (CriteriaDetailPage, PlanDetailPage) call `alert()` on error. Wrap these in a proper error boundary or use `toast.error()` consistently.

4. **Performance audit**: The `CriteriaOverviewPage` maps units then filters - consider whether this should be done with a Firestore compound query instead of client-side filtering.

---

## Files Analyzed

- src/App.jsx
- src/components/criteria/ConditionRow.jsx
- src/components/criteria/CriteriaDetailPage.jsx
- src/components/criteria/CriteriaOverviewPage.jsx
- src/components/criteria/CriteriaSetsPage.jsx
- src/components/criteria/EvidenceUpload.jsx
- src/components/criteria/GradeInputCard.jsx
- src/components/criteria/PeriodsManagePage.jsx
- src/components/criteria/PlanDetailPage.jsx
- src/components/criteria/PlansManagePage.jsx
- src/components/criteria/UnitsPage.jsx
- src/components/layout/Header.jsx
- src/components/layout/MainLayout.jsx
- src/components/layout/Sidebar.jsx
- src/components/task/StatusBadge.jsx
- src/components/task/TaskCard.jsx
- src/components/unit/UnitDashboard.jsx
- src/components/unit/UnitLayout.jsx
- src/components/unit/UnitSubmissionsList.jsx
- src/components/unit/UnitSubmitPage.jsx
- src/pages/DashboardPage.jsx
- src/pages/LoginPage.jsx
- src/pages/TaskConfigPage.jsx
- src/pages/TodayPage.jsx
- src/firebase/auth.js
- src/utils/constants.js
- src/utils/exportExcel.js
- src/components/common/Skeleton.jsx
