# Justification Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the justification workflow work smoothly for unit users without reopening the main criteria submission.

**Architecture:** Keep the existing `criteriaSubmissions` routes, but store unit-submitted justification text and evidence in a separate top-level `justificationResponses` map. UI overlays `justificationResponses[row.id]` over `responses[row.id]` for display while Firestore rules keep unit justification updates away from the main `responses` map.

**Tech Stack:** React, Vite, Firebase Firestore, Firestore security rules.

---

## File Structure

- Modify `src/components/unit/UnitSubmitPage.jsx`
  - Keep main report locked after submit/grade.
  - Allow `justificationText` and `evidenceFiles` edits only on requested justification rows before deadline.
  - Show the "Gửi giải trình" action on the justification tab even when the main report is read-only.
- Modify `firestore.rules`
  - Keep existing staff access.
  - Keep existing unit draft update path.
  - Add a narrow unit justification update path for `justificationResponses`, `justifiedAt`, and `justificationStatus`.
- Verify with `pnpm build`
  - Confirms JSX and bundling still pass.

---

### Task 1: Fix Unit Justification Editing

**Files:**
- Modify: `src/components/unit/UnitSubmitPage.jsx`

- [ ] **Step 1: Add separate editability helpers**

Add these helpers near the existing `isReadOnly`, `isGraded`, and `tableRows` declarations:

```jsx
const isMainReportReadOnly = submissionStatus === 'submitted' || submissionStatus === 'graded' || assignmentRevoked || isPeriodLocked;
const canEditJustificationRow = (graded) => {
    const dlStr = graded?.justificationDeadline;
    if (!dlStr || assignmentRevoked || isPeriodLocked) return false;
    const isDeadlineExpired = new Date(dlStr) < new Date(new Date().toDateString());
    return activeTab === 'giaiTrinh' && !isDeadlineExpired;
};
```

Then keep `isReadOnly` as a compatibility alias if needed:

```jsx
const isReadOnly = isMainReportReadOnly;
```

- [ ] **Step 2: Change response update rules**

Replace the current `handleResponseChange` guard:

```jsx
if (isReadOnly) return;
```

with field-aware logic:

```jsx
const graded = gradedData.scores[mucId] || {};
const canEditJustificationField = ['justificationText', 'evidenceFiles'].includes(field) && canEditJustificationRow(graded);
if (isMainReportReadOnly && !canEditJustificationField) return;
if (activeTab === 'giaiTrinh' && !canEditJustificationField) return;
```

This preserves the main-report lock while allowing only justification text and evidence uploads in the justification tab.

- [ ] **Step 3: Use the helper inside table row rendering**

Replace the row-local `isJustificationUnlocked` calculation with:

```jsx
const isJustificationUnlocked = canEditJustificationRow(graded);
```

Keep the existing deadline display logic.

- [ ] **Step 4: Keep main report controls locked, but show justification submit controls**

Replace the bottom action wrapper:

```jsx
{!isReadOnly && (
```

with:

```jsx
{(!isMainReportReadOnly || activeTab === 'giaiTrinh') && (
```

In the justification button, disable when no editable requested rows remain:

```jsx
disabled={saving || !tableRows.some((row) => canEditJustificationRow(gradedData.scores[row.id] || {}))}
```

For the normal report tab, keep the existing save/submit behavior disabled by `isMainReportReadOnly`.

- [ ] **Step 5: Verify unit-side behavior by build**

Run:

```powershell
pnpm build
```

Expected: build completes without JSX or bundling errors.

---

### Task 2: Allow Narrow Unit Justification Updates In Firestore

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add a narrow helper for unit justification updates**

Inside `service cloud.firestore { match /databases/{database}/documents { ... } }`, near the existing auth helper functions, add:

```js
function isUnitJustificationUpdate() {
  return isUnit()
    && resource.data.unitId == request.auth.uid
    && request.resource.data.unitId == request.auth.uid
    && (resource.data.status in ['pending', 'submitted', 'graded'])
    && request.resource.data.status == resource.data.status
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
      'justificationResponses',
      'justifiedAt',
      'justificationStatus'
    ]);
}
```

- [ ] **Step 2: Use the helper in `criteriaSubmissions` update rule**

Change:

```js
allow update: if isStaff()
  || (
```

to:

```js
allow update: if isStaff()
  || isUnitJustificationUpdate()
  || (
```

This allows unit users to submit justification/evidence on existing `pending`, `submitted`, or `graded` docs without allowing them to alter `responses`, scores, totals, comments, or status.

- [ ] **Step 3: Verify rule syntax by build/static check**

Run:

```powershell
pnpm build
```

Expected: app build still passes. Firestore rule deployment is not performed in this task.

---

### Task 3: Final Verification And Review

**Files:**
- Review: `src/components/unit/UnitSubmitPage.jsx`
- Review: `firestore.rules`

- [ ] **Step 1: Inspect changed files**

Run:

```powershell
git diff -- src/components/unit/UnitSubmitPage.jsx firestore.rules
```

Expected:
- Unit page changes are limited to justification editability and submit controls.
- Firestore rules only add the narrow justification update path.

- [ ] **Step 2: Run final build**

Run:

```powershell
pnpm build
```

Expected: build succeeds.

- [ ] **Step 3: Manual behavior checklist**

Confirm from code:
- A `submitted`, `graded`, or `pending` submission can still open tab `giaiTrinh`.
- Only rows with `gradedScores[row.id].justificationDeadline` render in tab `giaiTrinh`.
- Unit can edit `justificationResponses[row.id].justificationText` before deadline.
- Unit can update `justificationResponses[row.id].evidenceFiles` before deadline.
- Unit cannot edit `responses`, `selfScore`, `notes`, `gradedScores`, `status`, or total fields through the justification flow.
- Cấp trên reads `justificationResponses[row.id]` overlaid on `responses[row.id]` in the overview/detail grading tables.

---

## Self-Review

Spec coverage:
- FE split between main report and justification editability is covered in Task 1.
- Evidence upload during justification is covered in Task 1.
- Firebase narrow update permissions are covered in Task 2.
- No Cloud Function change is included because the existing data model supports this flow.

Placeholder scan:
- No placeholder implementation steps are left.

Type consistency:
- Uses existing fields plus a dedicated `justificationResponses` map: `responses`, `justificationResponses`, `justifiedAt`, `justificationStatus`, `gradedScores`, `justificationDeadline`, `evidenceFiles`, `justificationText`.
