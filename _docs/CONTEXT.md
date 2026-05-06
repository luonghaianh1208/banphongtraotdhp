# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-06

## Muc tieu session

Implement multi-wave justification workflow: floating control bar, DatePicker deadline, auto-lock on expiry, deadline column across Admin + Unit portals.

## Da lam trong session nay

- Them `sendJustificationRequest()` vao criteriaFirestore.js — batch write justification requests across multiple units.
- CriteriaOverviewPage: Floating justification bar voi DatePicker, cross-unit selection tracking, "Thoi han GT" column.
- CriteriaDetailPage: Justification checkbox (selection-based), DatePicker floating bar, deadline column voi badge "Het han".
- UnitSubmitPage: "Thoi han GT" column, auto-lock textarea khi qua deadline, placeholder doi thanh "Het han giai trinh".
- Filter tab Giai trinh: Chi hien muc co `justificationDeadline` (admin da gui yeu cau), khong con dung `requireJustification`.
- Install `react-datepicker` dependency.
- Build thanh cong, push code len main.

## Ket qua quan trong

- Admin co the batch-send justification requests voi deadline cho nhieu don vi cung luc.
- Co so chi thay muc giai trinh khi admin da gui yeu cau (co deadline).
- Textarea tu dong khoa khi qua han, van xem duoc noi dung cu nhung khong sua duoc.
- Moi dot giai trinh co deadline rieng — ho tro multi-wave.

## Quyet dinh ky thuat da chot

- Justification dung `justificationDeadline` (date string) thay vi boolean `requireJustification`.
- Batch operation dung Firestore `writeBatch` de dam bao atomic across nhieu units.
- Deadline comparison dung `new Date().toDateString()` de so sanh theo ngay, khong tinh gio.
- Floating bar xuat hien khi co selection, bien mat khi clear — khong can toggle.
- react-datepicker thay vi native date input de UX dep hon.

## Nhung diem can nho neu tiep tuc session sau

- Test toan bo luong: Admin tick chon → chon deadline → gui → Co so nhan tab Giai trinh → nhap giai trinh → gui → Admin xem.
- Can test edge case: qua deadline roi thi co so khong nhap duoc nua.
- Can test multi-wave: Admin gui dot 1 cho noi dung A, roi gui dot 2 cho noi dung B voi deadline khac.
- Nen uu tien fix cac bug van con mo:
  1. BUG-002: pending approval bypass
  2. BUG-005 + BUG-014: unit portal shape profile va logout
  3. BUG-017: plan detail field mismatch
  4. BUG-018 / BUG-019: data integrity va notification reliability
