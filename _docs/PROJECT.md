# Project Overview - HubConnect

Cap nhat lan cuoi: 2026-05-05

## Tong quan

- Ten package: `task-app`
- Ten san pham dang hien tren UI: `HubConnect`
- Muc tieu:
  - quan ly cong viec noi bo cho staff
  - giao va cham bo tieu chi cho don vi
  - nhan ho so ke hoach / hoi thi tu don vi
- Nhom nguoi dung:
  - `admin`: duyet thanh vien, duyet task, quan ly config, users, units, toan quyen quan ly bo tieu chi va cham diem tat ca.
  - `manager`: quan ly task, penalties, plans, quan ly bo tieu chi, cham diem tieu chi duoc phan cong.
  - `member`: xem task duoc giao, chi duoc xem bo tieu chi (view-only), va cham diem tieu chi duoc phan cong.
  - `unit`: vao portal rieng de nop criteria va ho so plan/contest

## Tech stack hien tai

- Frontend:
  - React `19.2.4`
  - Vite `8.0.4`
  - Tailwind CSS `3.4.19`
  - React Router DOM `7.14.0`
- Firebase:
  - Auth
  - Firestore
  - Storage
  - Callable / scheduled Functions
- Thu vien phu:
  - `react-hot-toast`
  - `react-icons`
  - `recharts`
  - `flatpickr` + `react-flatpickr`
  - `xlsx`
  - `jspdf` + `jspdf-autotable`
  - `date-fns`
- Deploy:
  - Netlify cho frontend
  - Firebase cho Firestore / Storage / Functions

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Bien moi truong can co

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ORG_NAME=
```

Ghi chu:
- `src/firebase/config.js` co fallback demo values khi chua co `.env`, nhung app thuc te can env that de chay dung.

## Cau truc thu muc

```text
src/
|-- components/
|   |-- common/
|   |-- criteria/
|   |-- layout/
|   |-- task/
|   `-- unit/
|-- context/
|-- firebase/
|-- hooks/
|-- pages/
|-- utils/
|-- App.jsx
`-- main.jsx

functions/
|-- index.js
|-- package.json
`-- package-lock.json

_docs/
|-- ARCHITECTURE.md
|-- BUGS.md
|-- CHANGELOG.md
|-- CONTEXT.md
|-- PROJECT.md
`-- TASKS.md
```

## Module route dang hoat dong

- Internal:
  - `/`
  - `/tasks`
  - `/dashboard`
  - `/members`
  - `/trash`
  - `/task-config`
  - `/penalties`
  - `/settings`
  - `/system-info`
  - `/criteria-sets`
  - `/criteria-set/:setId`
  - `/criteria-overview/:criteriaSetId`
  - `/criteria-detail/:periodId/:submissionId`
  - `/plans-manage`
  - `/plans/:planId`
  - `/units`
- Unit:
  - `/unit/dashboard`
  - `/unit/submissions`
  - `/unit/submit/:criteriaSetId`
  - `/unit/plans`
  - `/unit/plans/:planId`

## Ghi chu quan trong ve codebase hien tai

- UI dang nhap chinh dang mo Google login; helper email/password van con trong code.
- `functions/` la thu muc goc, khong nam trong `src/`.
- App co module `submissionPeriods` o tang data/backend, nhung man hinh quan ly dot (`PeriodsManagePage`) hien khong noi vao route.
- `useSubmissions.js` la hook cu, dang import API khong ton tai va hien chua duoc dung.

## Quy uoc ky thuat dang duoc dung

- Firestore realtime qua `onSnapshot` la co che chinh cho UI.
- Criteria submission dung composite document id `${criteriaSetId}_${unitId}`.
- Mot so action quan trong co backend ho tro:
  - `initFirstAdmin`
  - `createPenaltyIdempotent`
  - `publishPeriodResults`
  - `deleteUser`
  - `deleteUnit`

## Nhung file can thay doi can than

- `src/firebase/config.js`
- `firestore.rules`
- `storage.rules`
- `functions/index.js`

Neu sua cac file nay, can doi chieu lai `_docs/ARCHITECTURE.md` va `_docs/BUGS.md`.
