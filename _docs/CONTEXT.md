# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-06

## Muc tieu session

Fix Criteria Scoring Authorization + Cleanup dead code + Fix open bugs.

## Da lam trong session nay

- CriteriaOverviewPage: import `useAuth`, them `isRowReadOnly()` — member chi cham tieu chi duoc phan cong (`assignedTo === userId`), admin cham het. Input diem/nhan xet bi disabled cho tieu chi khong thuoc member.
- CriteriaOverviewPage + CriteriaDetailPage: thay hardcode `'admin'` trong `sendJustificationRequest` va `gradeCriteriaSubmission` bang `userProfile.id` dong.
- firestore.js: `addNotification()` rethrow error (BUG-019).
- AuthContext: expose `logout` (BUG-014).
- auth.js: Google login tao user `status: 'pending'`, `isActive: false` (BUG-002).
- UnitDashboard + UnitSubmissionsList: cleanup fallback `unitId` (BUG-005).
- Xoa `useSubmissions.js` (BUG-015) va `PeriodsManagePage.jsx` (BUG-016) — dead code.
- Build thanh cong, khong loi.

## Ket qua quan trong

- Member duoc phan cong tieu chi gio co the cham diem va gui giai trinh tu CriteriaOverviewPage va CriteriaDetailPage.
- Admin van cham tat ca tieu chi nhu truoc.
- Unit portal logout hoat dong binh thuong.
- User moi login qua Google bat buoc phai cho admin duyet.

## Quyet dinh ky thuat da chot

- `isRowReadOnly()` check `assignedTo` tren tieu chi — neu `assignedTo !== userId` thi row bi locked (truong hop member). Admin luon bypass.
- IIFE pattern bi loai bo — thay bang `const locked = isRowReadOnly(row)` tai dau map callback de giu JSX sach.
- `addNotification` gio rethrow error de caller co the xu ly — nhung hien chua co caller nao catch, chi them an toan tuong lai.

## Nhung diem can nho neu tiep tuc session sau

- BUG-018 la bug duy nhat con open: restore task khong xoa penalty lien quan.
- Plans cu chua co field `createdBy` — neu can, co the chay script migration.
- Nen test voi member thuc te co `assignedTo` tren tieu chi de verify scoring restriction hoat dong dung.
