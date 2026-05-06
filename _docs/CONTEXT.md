# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-07

## Muc tieu session

Bo sung tab Thanh vien cho tat ca roles (admin/manager/member) voi chuc nang xem danh sach, trang thai online, va thong tin chuc vu.

## Da lam trong session nay

- Tao hook `usePresence`: track online bằng `lastActiveAt` trong Firestore, heartbeat moi 1 phut + khi user tuong tac.
- Tich hop `usePresence` vao `MainLayout` de tat ca user deu duoc track.
- Mo route `/members` tu admin-only thanh all roles (admin/manager/member).
- Doi ten nav item tu "Quan ly thanh vien" thanh "Thanh vien".
- Rewrite `MembersPage` thanh card layout voi:
  - Online indicator kieu Messenger (cham xanh animate-pulse khi online).
  - Hien thi "X phut truoc" / "X gio truoc" / "Dang hoat dong".
  - Tim kiem thanh vien.
  - Admin giu full control (duyet/doi quyen/xoa), member/manager chi xem.
  - Ho tro dark mode day du.
- Push code thanh cong.

## Ket qua quan trong

- Member/Manager gio thay duoc danh sach thanh vien phong ban, chuc vu, va trang thai online.
- Admin van giu full quyen quan ly (duyet/sua/xoa).
- Online status tu dong cap nhat moi phut — mat data duoi 2 phut = "Dang hoat dong".

## Quyet dinh ky thuat da chot

- Online threshold: duoi 2 phut = online (cham xanh), tren 2 phut = offline (cham xam) + text "X phut/gio truoc".
- Heartbeat interval: 60 giay, throttle event listener cung 60 giay de tranh ghi Firestore qua nhieu.
- Component re-render moi 30 giay de cap nhat label thoi gian.

## Cau truc file da thay doi

- `src/hooks/usePresence.js` — MOI
- `src/pages/MembersPage.jsx` — Rewrite hoan toan
- `src/App.jsx` — Mo route /members cho tat ca role
- `src/utils/constants.js` — NAV_ITEMS cap nhat
- `src/components/layout/MainLayout.jsx` — Tich hop usePresence
