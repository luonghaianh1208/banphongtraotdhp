# Bug Tracker - HubConnect

Cap nhat lan cuoi: 2026-05-06

Trang thai:
- `open`: dang ton tai trong code hien tai
- `fixed`: da verify khong con tai hien tu code hien tai
- `legacy`: bug lich su hoac module cu khong con duoc noi vao flow chinh

---

## Dang mo

## [BUG-018] Restore task khong xu ly penalty lien quan
- Trang thai: `open`
- Muc do: `medium`
- Vi tri:
  - `src/firebase/firestore.js` (line 237-253)
  - `src/pages/TrashPage.jsx` (line 59-61)
- Mo ta:
  - `restoreTask()` va `restoreTasks()` chi flip `isDeleted` / `deletedAt`.
  - Penalty da tao cho task khong duoc xoa hay danh dau lai.
  - Nguy co user restore task nhung van con penalty cu.

---

## Da verify da fix

## [BUG-020] Member khong the cham diem / gui giai trinh tren CriteriaOverviewPage
- Trang thai: `fixed`
- Vi tri:
  - `src/components/criteria/CriteriaOverviewPage.jsx`
  - `src/components/criteria/CriteriaDetailPage.jsx`
- Ghi chu:
  - `sendJustificationRequest` va `gradeCriteriaSubmission` hardcode `'admin'` lam nguoi thuc hien.
  - Them `useAuth` de lay `userProfile`, truyen `userProfile.id` thay vi `'admin'`.
  - Them `isRowReadOnly()` vao OverviewPage de member chi cham tieu chi duoc phan cong (`assignedTo === userId`), admin cham het.

## [BUG-019] Notification van la fire-and-forget
- Trang thai: `fixed`
- Vi tri:
  - `src/firebase/firestore.js` (line 420-433)
- Ghi chu:
  - `addNotification()` da rethrow error sau `console.error` de caller co the xu ly.

## [BUG-016] `PeriodsManagePage` ton tai nhung khong route toi dau
- Trang thai: `fixed`
- Vi tri:
  - `src/components/criteria/PeriodsManagePage.jsx` (DA XOA)
- Ghi chu:
  - Orphan screen da duoc xoa khoi source.

## [BUG-015] `useSubmissions` la hook vo hieu
- Trang thai: `fixed`
- Vi tri:
  - `src/hooks/useSubmissions.js` (DA XOA)
- Ghi chu:
  - Hook import API khong ton tai, da xoa.

## [BUG-014] Nut dang xuat trong Unit portal goi `logout` khong ton tai trong context
- Trang thai: `fixed`
- Vi tri:
  - `src/components/unit/UnitLayout.jsx`
  - `src/context/AuthContext.jsx`
- Ghi chu:
  - Them `logout` (import tu `auth.js`) vao `value` object trong AuthContext.

## [BUG-005] `userProfile.unitId` van sai o mot phan module unit
- Trang thai: `fixed`
- Vi tri:
  - `src/components/unit/UnitDashboard.jsx`
  - `src/components/unit/UnitSubmissionsList.jsx`
- Ghi chu:
  - Da cleanup bo fallback `|| userProfile?.unitId` de tranh nham lan.

## [BUG-002] Google login co the bypass pending approval
- Trang thai: `fixed`
- Vi tri:
  - `src/firebase/auth.js`
- Ghi chu:
  - `loginWithGoogle()` tao user voi `isActive: false` va `status: 'pending'` thay vi `isActive: true` va khong co `status`.

## [BUG-017] Admin plan detail doc sai field va co the hien thi rong
- Trang thai: `fixed`
- Vi tri:
  - `src/components/criteria/PlanDetailPage.jsx`
  - `src/components/unit/UnitPlanDetail.jsx`
  - `src/firebase/criteriaFirestore.js`
- Ghi chu:
  - Dong bo field du lieu (type, attachments), them `useUnits` vao PlanDetailPage.
  - Tra truc tiep `entryId` khi submit de tranh sync state tre.

## [BUG-001] Race condition tao admin dau tien
- Trang thai: `fixed`
- Vi tri:
  - `functions/index.js`
  - `src/context/AuthContext.jsx`
- Ghi chu:
  - Da dung Cloud Function `initFirstAdmin` + Firestore transaction.

## [BUG-006] Duplicate penalty multi-admin
- Trang thai: `fixed`
- Vi tri:
  - `src/hooks/useAutoOverduePenalties.js`
  - `functions/index.js`
  - `src/firebase/firestore.js`
- Ghi chu:
  - Client goi `createPenaltyIdempotent`.
  - Backend dung transaction va composite key.

## [BUG-007] Huy gui duyet khong thong bao cho nguoi tao task
- Trang thai: `fixed`
- Vi tri:
  - `src/components/task/TaskDetail.jsx`

## [BUG-008] Unit sua bai sau khi dot bi khoa
- Trang thai: `fixed`
- Vi tri:
  - `src/components/unit/UnitSubmitPage.jsx`
  - `firestore.rules`

## [BUG-009] Rule `criteriaSubmissions` qua long
- Trang thai: `fixed`
- Vi tri:
  - `firestore.rules`

## [BUG-010] Logic hien thi criteria detail khong hop format moi
- Trang thai: `fixed`
- Vi tri:
  - `src/components/criteria/CriteriaDetailPage.jsx`

## [BUG-013] Draft criteria submission bi duplicate khi luu nhieu lan
- Trang thai: `fixed`
- Vi tri:
  - `src/firebase/criteriaFirestore.js`

---

## Tong ket nhanh

| Muc | So luong |
|---|---:|
| Open (medium) | 1 |
| Fixed (da verify) | 14 |

Ghi chu:
- BUG-018 la bug duy nhat con open — can them logic xoa penalty khi restore task.
- BUG-020 (NEW) da fix — member gio co the cham diem va gui giai trinh cho tieu chi duoc phan cong.
