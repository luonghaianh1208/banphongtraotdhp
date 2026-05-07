# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-07

## Muc tieu session

Fix navigation freeze (BUG-023): click chuyen tab sidebar, URL doi nhung FE dung yen.

## Da lam trong session nay

- Xac dinh root cause: `usePresence` hook bat `window click` → ghi `lastActiveAt` vao Firestore → AuthContext `onSnapshot` fire → `setUserProfile(newObj)` tao object reference moi → re-render toan bo component tree → React Router route change bi nuot.
- Fix `usePresence`: bo `click`/`keydown` listener, chi giu heartbeat 1 gio + `visibilitychange`. Van dam bao online status cap nhat dung.
- Fix `AuthContext`: them shallow compare trong `onSnapshot` callback — chi `setUserProfile` khi cac field quan trong (role, status, displayName, email, avatar, department) thay doi. Skip khi chi `lastActiveAt` thay doi.
- Fix `MainLayout`: them `<Suspense fallback={<LoadingSpinner />}>` boc `<Outlet />` de lazy-loaded pages co fallback dung khi chuyen route.

## Ket qua quan trong

- Navigation chuyen tab gio hoat dong muot, khong can F5.
- Online presence van duoc track qua heartbeat 1 gio va visibility change (du chinh xac).
- AuthContext khong con re-render toan bo tree khi chi lastActiveAt thay doi.

## Quyet dinh ky thuat da chot

- usePresence KHONG nen bat click/keydown tren window. Heartbeat 1 gio + visibilitychange la du de xac dinh online status.
- Online threshold: duoi 65 phut = online (cham xanh), tren 65 phut = offline.
- Heartbeat 1 gio giam 98% Firestore writes so voi 60s (~2,400 vs ~144,000 writes/thang voi 10 user).
- AuthContext `onSnapshot` PHAI so sanh shallow truoc khi `setUserProfile` de tranh cascade re-render vo nghia.
- `<Outlet />` trong layout route PHAI duoc boc boi `<Suspense>` rieng de lazy pages render dung.

## Cau truc file da thay doi

- `src/hooks/usePresence.js` — Rewrite: bo click/keydown, heartbeat 1 gio + visibilitychange
- `src/context/AuthContext.jsx` — Them shallow compare trong onSnapshot
- `src/components/layout/MainLayout.jsx` — Them Suspense boc Outlet
- `src/pages/MembersPage.jsx` — Online threshold tu 2 phut len 65 phut
