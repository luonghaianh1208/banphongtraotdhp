# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-06

## Muc tieu session

Implement Role-Based Access Control cho module Ke hoach: Member chi thay plan minh tao, Admin thay tat ca.

## Da lam trong session nay

- PlansManagePage: import `useAuth`, them `useMemo` filter `visiblePlans` — Member chi thay plans co `createdBy === currentUser.uid`, Admin/Manager thay tat ca.
- PlansManagePage: khi `createPlan`, luu them `createdBy` (uid) va `createdByName` (displayName) de truy vet nguoi tao.
- PlanDetailPage: import `useAuth` + `Navigate`, them guard — Member truy cap plan khong phai cua minh se bi redirect ve `/plans-manage`.
- Build thanh cong, khong loi.
- Cap nhat CHANGELOG, TASKS, CONTEXT.

## Ket qua quan trong

- Member co the tao ke hoach, nhung chi xem ke hoach cua minh.
- Admin va Manager van thay toan bo ke hoach.
- Plans cu (truoc khi co `createdBy`) se khong hien cho member — chi Admin/Manager thay.

## Quyet dinh ky thuat da chot

- Dung client-side filter (`useMemo`) thay vi Firestore query rieng de giu don gian (1 subscription cho tat ca plans, filter tren client).
- Guard redirect tren PlanDetailPage bang `<Navigate>` thay vi hien thong bao loi — UX muot hon.
- Field `createdBy` va `createdByName` duoc luu truc tiep trong document plan.

## Nhung diem can nho neu tiep tuc session sau

- Plans cu chua co field `createdBy` — neu can, co the chay script migration de gan `createdBy` cho cac plans cu.
- Bo tieu chi: tat ca member deu xem duoc toan bo (khong can filter) — da dung tu truoc.
- Nen uu tien fix cac bug van con mo:
  1. BUG-002: pending approval bypass
  2. BUG-005 + BUG-014: unit portal shape profile va logout
  3. BUG-018 / BUG-019: data integrity va notification reliability
