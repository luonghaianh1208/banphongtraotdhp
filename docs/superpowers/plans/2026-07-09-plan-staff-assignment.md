# Plan Staff Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add staff assignment, edit permissions, and Vietnamese activity logs for upper-level plans, contests, and events.

**Architecture:** Store assignees directly on `plans` as `assignedStaffIds` and `assignedStaffNames`. Store audit entries in `plans/{planId}/activityLogs` and subscribe to them from the plan detail page. Keep UI changes inside the existing plan management/detail pages and update Firestore rules so assigned staff can update assigned plans.

**Tech Stack:** React, Firebase Firestore, existing hooks/components, Tailwind utility classes, Firestore security rules.

---

### Task 1: Firestore helpers for plan logs

**Files:**
- Modify: `src/firebase/criteriaFirestore.js`

- [ ] **Step 1: Add log imports and helper functions**

Add `limit` to the Firestore imports. Add `addPlanActivityLog`, `subscribeToPlanActivityLogs`, `getActorName`, and `buildPlanLogMessage`.

- [ ] **Step 2: Verify helper syntax**

Run: `npx eslint src/firebase/criteriaFirestore.js`

Expected: no new lint errors in this file.

### Task 2: Plan list assignment UI and permissions

**Files:**
- Modify: `src/components/criteria/PlansManagePage.jsx`

- [ ] **Step 1: Load active staff users**

Import `useUsers`; compute active staff from roles `admin`, `manager`, `member`.

- [ ] **Step 2: Store assignees on create**

Add `assignedStaffIds` to form state and persist both ids and display names through `createPlan`.

- [ ] **Step 3: Show assigned plans to members**

Update `visiblePlans` so non-admin users see plans they created or plans where their uid is in `assignedStaffIds`.

- [ ] **Step 4: Add assignment modal**

Add a `Phụ trách` action for admin/manager/creator and let them pick multiple staff members. Save with `updatePlan` and write a Vietnamese activity log.

- [ ] **Step 5: Gate destructive actions**

Hide delete/bulk delete for assigned staff who are not admin/manager. Keep update/status/edit actions available for assigned staff.

- [ ] **Step 6: Verify JSX**

Run: `npx eslint src/components/criteria/PlansManagePage.jsx`

Expected: no new lint errors in this file.

### Task 3: Plan detail permissions, assignee display, and logs

**Files:**
- Modify: `src/components/criteria/PlanDetailPage.jsx`

- [ ] **Step 1: Permit assigned staff**

Allow assigned staff to enter the page and edit plan content.

- [ ] **Step 2: Log content edits**

After saving description/attachments, write a Vietnamese activity log.

- [ ] **Step 3: Display assignees**

Show assigned staff as compact tags in the info section.

- [ ] **Step 4: Display activity logs**

Admin/manager should see recent log entries with actor, action message, and date/time.

- [ ] **Step 5: Verify JSX**

Run: `npx eslint src/components/criteria/PlanDetailPage.jsx`

Expected: no new lint errors in this file.

### Task 4: Firestore rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Allow assigned plan staff updates**

Update `/plans/{planId}` rules so admin/manager, creator, or assigned staff can update. Keep delete limited to admin/manager.

- [ ] **Step 2: Allow log reads/writes for staff**

Add nested `activityLogs` rule under plans. Authenticated users can read; staff can create log entries.

- [ ] **Step 3: Deploy rules**

Run: `firebase deploy --only firestore:rules`

Expected: deployment succeeds.

### Task 5: Final verification and publish

**Files:**
- Review all touched files.

- [ ] **Step 1: Run targeted checks**

Run:
- `npx eslint src/firebase/criteriaFirestore.js src/components/criteria/PlansManagePage.jsx src/components/criteria/PlanDetailPage.jsx`
- `git diff --check`

Expected: checks pass or only unrelated pre-existing repo noise is documented.

- [ ] **Step 2: Commit scoped changes**

Stage only:
- `src/firebase/criteriaFirestore.js`
- `src/components/criteria/PlansManagePage.jsx`
- `src/components/criteria/PlanDetailPage.jsx`
- `firestore.rules`
- `docs/superpowers/plans/2026-07-09-plan-staff-assignment.md`

Commit message: `Add plan staff assignment workflow`

- [ ] **Step 3: Push main**

Run: `git push origin main`

Expected: push succeeds.
