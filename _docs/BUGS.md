# Bug Tracker - HubConnect

Cap nhat lan cuoi: 2026-05-05

Trang thai:
- `open`: dang ton tai trong code hien tai
- `fixed`: da verify khong con tai hien tu code hien tai
- `legacy`: bug lich su hoac module cu khong con duoc noi vao flow chinh

---

## Dang mo

## [BUG-002] Google login co the bypass pending approval
- Trang thai: `open`
- Muc do: `critical`
- Vi tri:
  - `src/firebase/auth.js`
  - `src/context/AuthContext.jsx`
- Mo ta:
  - `loginWithGoogle()` tao document `users/{uid}` voi `isActive: true` va khong set `status`.
  - `AuthContext` suy dien profile khong co `status` thanh `approved` neu `isActive !== false`.
  - Ket qua: user noi bo dang nhap bang Google lan dau co the vao app ngay thay vi dung o `/pending`.

## [BUG-005] `userProfile.unitId` van sai o mot phan module unit
- Trang thai: `open`
- Muc do: `high`
- Vi tri:
  - `src/components/unit/UnitDashboard.jsx`
  - `src/components/unit/UnitSubmissionsList.jsx`
  - mot phan dependency array trong `src/components/unit/UnitSubmitPage.jsx`
- Mo ta:
  - Profile unit duoc nap voi `id` la Firestore/Auth uid.
  - Nhieu component van doc `userProfile.unitId`, nen `useUnitAssignments()` nhan `undefined`.
  - Hieu ung: dashboard va danh sach submissions cua unit co nguy co khong load assignment duoc.

## [BUG-014] Nut dang xuat trong Unit portal se loi runtime
- Trang thai: `open`
- Muc do: `high`
- Vi tri:
  - `src/components/unit/UnitLayout.jsx`
  - `src/context/AuthContext.jsx`
- Mo ta:
  - `UnitLayout` destructure `logout` tu `useAuth()`.
  - `AuthContext` hien khong expose `logout`.
  - Khi bam dang xuat o portal unit, handler goi mot gia tri `undefined`.

## [BUG-015] `useSubmissions` la hook vo hieu
- Trang thai: `open`
- Muc do: `medium`
- Vi tri:
  - `src/hooks/useSubmissions.js`
  - `src/firebase/criteriaFirestore.js`
- Mo ta:
  - Hook import `subscribeToAllSubmissions` va `subscribeToUnitSubmission`.
  - Hai API nay khong ton tai trong `criteriaFirestore`.
  - Hook hien chua duoc dung o route chinh, nhung neu noi vao UI se loi ngay.

## [BUG-016] `PeriodsManagePage` ton tai nhung khong route toi dau
- Trang thai: `open`
- Muc do: `medium`
- Vi tri:
  - `src/components/criteria/PeriodsManagePage.jsx`
  - `src/App.jsx`
- Mo ta:
  - Page quan ly `submissionPeriods` van nam trong source.
  - App khong import, khong khai bao route, khong co menu dan vao.
  - `_docs` truoc day co ghi nhan module nay nhu dang hoat dong, nhung hien tai no la orphan screen.

## [BUG-017] Admin plan detail doc sai field va co the hien thi rong
- Trang thai: `open`
- Muc do: `medium`
- Vi tri:
  - `src/components/criteria/PlanDetailPage.jsx`
  - `src/components/unit/UnitPlanDetail.jsx`
  - `src/firebase/criteriaFirestore.js`
- Mo ta:
  - `PlanDetailPage` doc `plan.category` va `plan.files`.
  - Flow tao/sua plan hien tai dung `type`, va unit detail lai doc `plan.attachments`.
  - Contest entry hien duoc luu thanh `docs` trong `contestEntries`, khong phai cac field participant ma `PlanDetailPage` dang render.
  - He qua: man hinh admin detail co the hien sai badge, sai tep dinh kem, hoac bang du lieu rong.

## [BUG-018] Restore task khong xu ly penalty lien quan
- Trang thai: `open`
- Muc do: `medium`
- Vi tri:
  - `src/firebase/firestore.js`
- Mo ta:
  - `restoreTask()` va `restoreTasks()` chi flip `isDeleted` / `deletedAt`.
  - Penalty da tao cho task khong duoc xoa hay danh dau lai.
  - Nguy co user restore task nhung van con penalty cu.

## [BUG-019] Notification van la fire-and-forget
- Trang thai: `open`
- Muc do: `low`
- Vi tri:
  - `src/firebase/firestore.js`
- Mo ta:
  - `addNotification()` bat loi va chi `console.error`, khong rethrow.
  - Cac caller khong biet notification that bai.
  - Mat notification hien tai khong rollback luong nghiep vu nao.

---

## Da verify da fix

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
| Open | 8 |
| Fixed (da verify) | 6 |

Ghi chu:
- Tai lieu cu danh dau "13/13 bugs fixed" khong con phu hop voi code hien tai.
- BUG-002 va BUG-005 duoc mo lai sau khi doi chieu truc tiep voi source ngay 2026-05-05.
