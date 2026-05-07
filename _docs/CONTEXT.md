# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-07

## Muc tieu session

Xay dung tinh nang Diem danh (Attendance) cho ca cap tren va co so.

## Da lam trong session nay

- Tao 2 Firestore collections moi: `attendancePrograms` va `attendanceRecords`.
- Viet Firestore rules (staff create/update programs, unit create/update records) va Storage rules (attendance photos, max 10MB, images only).
- Tao 5 file frontend moi:
  - `src/firebase/attendanceFirestore.js` — CRUD + Storage upload helpers.
  - `src/hooks/useAttendancePrograms.js` — Realtime subscribe danh sach chuong trinh.
  - `src/hooks/useAttendanceRecords.js` — Realtime subscribe ban ghi theo programId.
  - `src/components/attendance/AttendanceManagePage.jsx` — UI cap tren: danh sach, tao/sua/xoa, gia han, xem chi tiet voi popup.
  - `src/components/unit/UnitAttendancePage.jsx` — UI co so: danh sach, form diem danh (dai dien, SDT, gio, so luong, upload anh).
- Cap nhat routing: `App.jsx` (2 routes), `constants.js` (NAV_ITEM), `UnitLayout.jsx` (sidebar), `MainLayout.jsx` (page title).
- Them Cloud Function `autoDeleteExpiredAttendance` chay moi 24h, tu dong xoa chuong trinh het han 30 ngay.
- Fix bug dang nhap don vi:
  - Sua mat khau mac dinh tu `abc@123.` thanh `abc@123`.
  - Chuyen tu Custom Token (500 loi IAM) sang Firebase Auth Email/Password sync (fakeEmail strategy).
- Deploy: Firestore rules, Storage rules, Cloud Functions (20/20), Push code len Github.

## Ket qua quan trong

- Module Diem danh hoat dong day du: cap tren tao chuong trinh, co so diem danh voi form day du va upload anh, cap tren theo doi realtime.
- He thong tu dong don dep du lieu diem danh sau 30 ngay de tiet kiem dung luong.
- Dang nhap don vi hoat dong on dinh sau khi chuyen sang fakeEmail strategy.

## Quyet dinh ky thuat da chot

- Dung `attendancePrograms` + `attendanceRecords` tach biet thay vi subcollection de de query va subscribe realtime.
- Tat ca staff (admin/manager/member) deu co quyen tao/sua/xoa chuong trinh diem danh.
- Auto-delete sau 30 ngay thay vi giu lai vinh vien de tranh day Firestore.
- loginUnit dung fakeEmail (`username@unit.tdhp`) + Firebase Auth Email/Password thay vi Custom Token de tranh van de quyen IAM.
- Default password la `abc@123` cho viec onboarding hang loat don vi.

## Cau truc file da thay doi

- `functions/index.js` — Them `autoDeleteExpiredAttendance`, sua `loginUnit` (fakeEmail strategy)
- `firestore.rules` — Them rules cho `attendancePrograms` va `attendanceRecords`
- `storage.rules` — Them path `attendance/{programId}/{unitId}/`
- `src/firebase/attendanceFirestore.js` — [NEW] CRUD + Storage helpers
- `src/hooks/useAttendancePrograms.js` — [NEW] Realtime hook
- `src/hooks/useAttendanceRecords.js` — [NEW] Realtime hook
- `src/components/attendance/AttendanceManagePage.jsx` — [NEW] UI cap tren
- `src/components/unit/UnitAttendancePage.jsx` — [NEW] UI co so
- `src/App.jsx` — Them 2 routes: `/attendance` va `/unit/attendance`
- `src/utils/constants.js` — Them NAV_ITEM cho Diem danh
- `src/components/unit/UnitLayout.jsx` — Them sidebar item
- `src/components/layout/MainLayout.jsx` — Them page title
- `src/firebase/auth.js` — Doi sang `signInWithEmailAndPassword`
- `src/pages/LoginPage.jsx` — Doi sang `loginUnitWithEmail`
