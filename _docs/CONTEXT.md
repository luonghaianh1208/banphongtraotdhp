# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-06

## Muc tieu session

Refactor module Ke hoach: fix bug dieu huong, nang cap form tao KH voi upload file, chuyen trang chi tiet sang bang Excel full-width.

## Da lam trong session nay

- Fix link sai `/admin/plans/${id}` thanh `/plans/${id}` trong PlansManagePage — click nut xem chi tiet gio vao dung PlanDetailPage.
- Them EvidenceUpload vao modal tao ke hoach: cap tren co the upload file + dan link Drive khi tao ke hoach.
- Doi label "Mo ta ngan gon" thanh "Yeu cau cu the ve ho so" cho ro rang.
- Rewrite PlanDetailPage: bo sidebar review, thay bang layout 2 phan — noi dung ke hoach + bang danh sach don vi nop (kieu Excel).
- Bang Excel gom: STT, Don vi, Trang thai (Da nop/Dang nhap/Chua nop), Ngay nop, Ho so dinh kem (click xem/tai).
- Build thanh cong, khong loi.

## Ket qua quan trong

- Workflow Ke hoach day du 2 chieu: Cap tren tao & gui → Co so nhan & nop → Cap tren theo doi.
- EvidenceUpload duoc tai su dung (khong tao component moi).
- Firestore function `createPlan` khong can sua (da spread data → field `attachments` tu dong duoc luu).

## Quyet dinh ky thuat da chot

- Field tai lieu dinh kem dung ten `attachments` (array of objects) — dong bo voi UnitPlanDetail da doc san.
- PlanDetailPage khong con co sidebar review vì ke hoach khong can phe duyet tung bai.
- Bang don vi full-width co overflow-x-auto de responsive tren mobile.

## Nhung diem can nho neu tiep tuc session sau

- Test toan bo luong: Cap tren tao KH voi file → Gui → Co so xem → Upload ho so → Nop → Cap tren thay trong bang.
- Nen uu tien fix cac bug van con mo:
  1. BUG-002: pending approval bypass
  2. BUG-005 + BUG-014: unit portal shape profile va logout
  3. BUG-018 / BUG-019: data integrity va notification reliability
