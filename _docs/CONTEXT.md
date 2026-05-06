# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-07

## Muc tieu session

Cascade delete khi xoa don vi + cai thien UI CriteriaOverviewPage (progress notes + justification cho don vi chua nop).

## Da lam trong session nay

- Cloud Function `deleteUnit`: them cascade delete xoa sach `criteriaSubmissions`, `criteriaAssignments`, va `plans` khi xoa don vi.
- Don dep du lieu mo coi cua don vi "test" (unitId: `idyTlU248CS269QuN4OWHcm0ZZf2`): xoa 2 submissions + 2 assignments.
- CriteriaOverviewPage: them note in nghieng hien thi tien do nop (x/y noi dung da nop) tren moi card don vi.
- CriteriaOverviewPage: mo khoa bang tham dinh cho don vi chua nop de member co the gui yeu cau giai trinh.
- Them optional chaining an toan khi submission = null.
- An nut "Luu tham dinh" khi don vi chua nop (vi chua co submission ID).
- Da push code thanh cong.

## Ket qua quan trong

- Xoa don vi gio se tu dong don sach du lieu lien quan — khong con du lieu mo coi.
- Cap tren thay duoc tien do nop cua tung don vi ngay tren card (khong can mo bang tham dinh).
- Member gui duoc yeu cau giai trinh cho don vi chua nop, backend tu tao doc moi.

## Quyet dinh ky thuat da chot

- Cascade delete dung batch 500 docs/lan de dam bao an toan Firestore.
- Progress note dem so muc co `selfScore` (khong null, khong rong) so voi tong `tableRows.length`.
- Khi don vi chua nop: hien nut "Xem / Y/C Giai trinh", an nut "Luu tham dinh", tat ca input diem/nhan xet van hoat dong binh thuong.

## Nhung diem can nho neu tiep tuc session sau

- BUG-018 la bug duy nhat con open: restore task khong xoa penalty lien quan.
- Plans cu chua co field `createdBy` — neu can, co the chay script migration.
- Nen deploy Cloud Functions len Firebase (`firebase deploy --only functions`) de cascade delete co hieu luc tren production.
