# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-07

## Muc tieu session

Chuyen doi xac thuc cho don vi co so tu Google OAuth sang Username/Password + Custom Token, trong khi van giu Google OAuth cho tai khoan noi bo.

## Da lam trong session nay

- Xoa cot Email trong model don vi (`Unit`) va Excel template, thay the bang 2 cot `Username` va `Password`.
- Them quy tac tu dong gen `username` (ten khong dau + `.tdhp`) va `password` (`abc@123.`) cho cac don vi neu de trong khi import/tao moi.
- Viet Cloud Functions:
  - `createUnit`: luu username/password vao Firestore database cua don vi thay vi tao Firebase Auth account ngay lap tuc.
  - `loginUnit`: kiem tra username/password trong database, neu dung tao Firebase Custom Token de dang nhap.
  - `changeUnitPassword`: cho phep don vi tu doi mat khau va cap nhat state `mustChangePassword = false`.
  - `resetUnitPassword`: cho phep admin khoi phuc mat khau ve mac dinh.
- Cap nhat UI:
  - `LoginPage`: tao dual-tab dang nhap. 1 tab cho Đơn vị (Username/Password), 1 tab cho Nội bộ (Google).
  - `ChangePasswordModal`: bat don vi doi pass o lan dang nhap dau tien hoac khi bi reset, chan khong cho xem UI ung dung cho den khi doi.
  - `UnitsPage` (Admin): Them cot Username/Password (co toggle an/hien), xoa cot Email. Them nut Reset Password cho tung don vi.
- Cap nhat `AuthContext`: quan ly quy trinh dang nhap Custom Token, theo doi state `mustChangePassword` realtime de trigger modal.
- Build va Deploy: Đã deploy Cloud Functions lên production bằng `firebase deploy --only functions` và deploy frontend lên Netlify bằng `netlify deploy --prod --dir=dist`.

## Ket qua quan trong

- He thong dang nhap duoc chia ranh gioi ro rang: Đơn vị dùng Username/Password (cấp qua Excel/Admin), Cấp trên/Admin dùng Google Auth.
- Luong doi mat khau lan dau hoat dong chinh xac, giup bao mat tai khoan don vi.
- Admin co the quan ly va reset mat khau cho cac don vi de dang qua bang dieu khien hoac import Excel.

## Quyet dinh ky thuat da chot

- Khong tao truc tiep tai khoan Firebase Auth bang Email/Password cho don vi vi can quan ly password dang clear-text hoac admin-resetable tren Firestore. Thay vao do, dang nhap bang Custom Token giup don vi van co day du quyen han tren Firebase ecosystem.
- `mustChangePassword` flag luu truc tiep tren profile don vi o Firestore de AuthContext co the bat realtime va khoa ung dung.
- Default password la `abc@123.` cho viec onboarding hang loat don vi. Admin van co the nhap password tu chon khi add thu cong.

## Cau truc file da thay doi

- `functions/index.js` — Them 3 endpoints `loginUnit`, `changeUnitPassword`, `resetUnitPassword`, refactor `createUnit`
- `src/firebase/auth.js` — Refactor logic dang nhap cho unit bang Custom Token, giu nguyen Google login cho staff
- `src/firebase/functions.js` — Export 4 APIs moi
- `src/context/AuthContext.jsx` — Quan ly quy trinh Custom Token va realtime listener cho flag mustChangePassword
- `src/pages/LoginPage.jsx` — UI dual-tab
- `src/App.jsx` — Them `ChangePasswordModal` vao trong `<UnitRoute>` de chan luong dang nhap lan dau
- `src/components/criteria/UnitsPage.jsx` — Admin UI thay the email sang user/pass va nut reset
- `src/utils/exportExcel.js` — Template Excel thay cot Email thanh Username/Password
- `src/components/ChangePasswordModal.jsx` — Modal bat buoc doi pass
