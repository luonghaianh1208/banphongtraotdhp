# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-06

## Muc tieu session

Fix BUG-021: Enforce explicit assignedTo check trong isRowReadOnly + fix backend sendJustificationRequest khi doc chua ton tai.

## Da lam trong session nay

- CriteriaOverviewPage + CriteriaDetailPage: fix `isRowReadOnly()` — member PHAI duoc gan ro rang (`assignedTo === userId`) moi edit duoc. Truoc day khi `assignedTo = null` thi member van edit duoc tat ca tieu chi.
- CriteriaOverviewPage + CriteriaDetailPage: lock checkbox Y/C Giai trinh cho tieu chi khong duoc phan cong (dong bo voi input diem).
- criteriaFirestore.js: `sendJustificationRequest` tao doc moi bang `batch.set()` khi `criteriaSubmissions` doc chua ton tai, thay vi `continue` skip im lang.
- Build thanh cong, da push code.

## Ket qua quan trong

- Member chi edit duoc tieu chi DUOC GAN RO RANG — khong con edit duoc tieu chi chua gan.
- Checkbox Y/C Giai trinh bi disabled khi row bi locked — tranh member gui giai trinh cho tieu chi khong phai cua minh.
- Backend tao doc moi khi gui yeu cau giai trinh cho don vi chua co submission — khong con skip im lang.

## Quyet dinh ky thuat da chot

- `isRowReadOnly()`: logic moi la `if (!tc || !tc.assignedTo || tc.assignedTo !== userProfile?.id) return true` — nghia la member PHAI duoc assignedTo ro rang. Admin luon bypass.
- Backend dung `batch.set()` thay vi `batch.update()` khi doc chua ton tai, dam bao giao dich batch khong bi loi.

## Nhung diem can nho neu tiep tuc session sau

- BUG-018 la bug duy nhat con open: restore task khong xoa penalty lien quan.
- Plans cu chua co field `createdBy` — neu can, co the chay script migration.
- Can test voi member thuc te co `assignedTo` tren tieu chi de verify scoring restriction hoat dong dung o moi flow.
- Nen xem xet them Firestore Security Rules de enforce permission o server-side (hien tai chi check o client).
