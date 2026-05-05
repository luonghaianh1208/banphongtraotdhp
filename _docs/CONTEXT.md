# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-06

## Muc tieu session

Chuan hoa giao dien bang 16 cot dong bo giua UnitSubmitPage (co so) va CriteriaDetailPage (quan ly). Fix syntax bug va bo sung cot con thieu.

## Da lam trong session nay

- Kiem tra code 3 file chinh (UnitSubmitPage, CriteriaDetailPage, EvidenceUpload) so voi ke hoach 16 cot.
- Phat hien va fix 2 loi trong UnitSubmitPage:
  1. Syntax bug: `handleSubmitJustification` bi long trong `handleSubmit` do thieu `};`.
  2. Thieu cot 13 (Y/C Giai trinh) va cot 14 (Noi dung giai trinh) khong hien o tab Bo tieu chi.
- Sau khi fix, ca 2 trang deu hien day du 16 cot dong bo theo ke hoach.
- EvidenceUpload da san sang voi tinh nang gan link URL (da kiem tra, khop 100%).
- CriteriaDetailPage da khop 100% ke hoach (bang ngang, 16 cot, logic khoa/mo dung).

## Ket qua quan trong

- UnitSubmitPage gio hien 16 cot o ca 2 tab (Bo tieu chi va Giai trinh).
- Cot "Y/C Giai trinh" o trang co so chi doc (hien trang thai checkbox cua cap tren).
- Cot "Noi dung giai trinh" luon hien nhung chi editable khi dang o tab Giai trinh.

## Quyet dinh ky thuat da chot

- Tat ca 16 cot phai luon hien thi o moi tab, chi khac nhau trang thai khoa/mo khoa.
- Tab Giai trinh loc chi hien nhung tieu chi co `requireJustification === true`.
- Co so bam "Gui giai trinh" de nop noi dung giai trinh rieng biet (khong trung voi nut Nop bao cao).

## Nhung diem can nho neu tiep tuc session sau

- Nen test toan bo luong: Co so nop → Admin tham dinh (YC giai trinh) → Co so giai trinh → Admin cham lai diem sau giai trinh.
- Nen uu tien fix cac bug van con mo:
  1. BUG-002: pending approval bypass
  2. BUG-005 + BUG-014: unit portal shape profile va logout
  3. BUG-017: plan detail field mismatch
  4. BUG-018 / BUG-019: data integrity va notification reliability
