# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-12

## Muc tieu session

Bo sung chuc nang tim kiem, loc cho 3 trang quan ly admin: Quan ly don vi, Quan ly bo tieu chi, Quan ly ke hoach.

## Da lam trong session nay

- UnitsPage: Them o tim kiem (search bar) voi icon kinh lup, ho tro tim theo ten don vi, username, ten khoi, ten loai hinh. Ket hop voi filter khoi hien co. Hien thi counter ket qua loc.
- PlansManagePage: Them dropdown loc theo khoi doi tuong (UNIT_BLOCKS). Tim kiem bo sung match ca truong mo ta. Them nut xoa nhanh noi dung search. Hien thi counter ket qua loc. Chuyen filteredPlans sang useMemo.
- CriteriaSetsPage: Da du chuc nang tim kiem va loc — khong can thay doi.
- Build thanh cong khong loi.

## Ket qua quan trong

- Admin co the tim kiem nhanh don vi bang tu khoa bat ky (ten, username, khoi, loai) tai trang Quan ly don vi.
- Admin co the loc ke hoach theo khoi doi tuong tai trang Quan ly ke hoach.
- Tat ca 3 trang quan ly admin deu co chuc nang tim kiem/loc day du va nhat quan.

## Quyet dinh ky thuat da chot

- Tat ca quyet dinh tu session truoc van con hieu luc (xem CHANGELOG.md).
- **[PATTERN] Modal/Popup phai dung `createPortal`** — Xem chi tiet tai `_docs/PATTERNS.md` muc "Portal Modal".
- **[PATTERN] DateTimePicker/TimePicker** — Toan he thong dung Flatpickr. Xem chi tiet tai `_docs/PATTERNS.md` muc "Flatpickr".
- **[PATTERN] Search/Filter** — Su dung `useMemo` cho logic loc, ket hop nhieu dieu kien (text + dropdown). Hien thi counter "Hien thi X/Y" khi dang loc.

## Cau truc file da thay doi

- `src/components/criteria/UnitsPage.jsx` — Them searchQuery state, sua filteredUnits (useMemo), them search input voi MdSearch
- `src/components/criteria/PlansManagePage.jsx` — Them blockFilter state, sua filteredPlans (useMemo), them dropdown khoi, them clear button
