# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-12

## Muc tieu session

Bo sung 2 tinh nang admin: Xuat danh sach don vi ra Excel va Chon hang loat theo khoi khi giao bo tieu chi.

## Da lam trong session nay

- Them ham `exportUnitsToExcel()` vao `src/utils/exportExcel.js` — xuat Excel voi cac truong: STT, Ten don vi, Username, Mat khau, Khoi, Loai, Trang thai.
- Them nut "Xuat danh sach" mau emerald vao `UnitsPage.jsx`, xuat danh sach don vi da loc (filteredUnits).
- Cai tien giao dien giao bo tieu chi tai `CriteriaSetDetailPage.jsx`:
  - Them toolbar chon nhanh: "Chon tat ca" / "Bo chon tat ca" don vi kha dung.
  - Them cac nut chon theo tung khoi doi tuong (UNIT_BLOCKS) voi toggle on/off va hien thi so luong.
  - Hien thi ten khoi tren moi checkbox don vi (responsive, an tren mobile).
  - Xoa cac nut "Chon tat ca" / "Bo chon" cu o duoi, thay bang toolbar moi phia tren.
- Build thanh cong khong loi.

## Ket qua quan trong

- Admin co the tai file Excel day du thong tin don vi de gui cho cac don vi biet tai khoan dang nhap.
- Admin co the chon nhanh nhieu don vi theo khoi (VD: "Khoi Xa", "Khoi DH-CD") khi giao bo tieu chi, thay vi chon tung don vi mot.

## Quyet dinh ky thuat da chot

- Tat ca quyet dinh tu session truoc van con hieu luc (xem CHANGELOG.md).
- **[PATTERN] Modal/Popup phai dung `createPortal`** — Xem chi tiet tai `_docs/PATTERNS.md` muc "Portal Modal".
- **[PATTERN] DateTimePicker/TimePicker** — Toan he thong dung Flatpickr. Xem chi tiet tai `_docs/PATTERNS.md` muc "Flatpickr".

## Cau truc file da thay doi

- `src/utils/exportExcel.js` — Them ham `exportUnitsToExcel()`
- `src/components/criteria/UnitsPage.jsx` — Them nut "Xuat danh sach", import `exportUnitsToExcel` va `MdFileDownload`
- `src/components/criteria/CriteriaSetDetailPage.jsx` — Toolbar chon hang loat theo khoi, import `UNIT_BLOCKS` va `MdCheckCircle`
