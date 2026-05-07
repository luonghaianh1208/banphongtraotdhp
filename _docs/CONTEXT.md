# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-07

## Muc tieu session

Fix navigation freeze (BUG-023): click chuyen tab sidebar, URL doi nhung FE dung yen.

## Da lam trong session nay

- Xac dinh root cause: `usePresence` hook bat `window click` → ghi `lastActiveAt` vao Firestore → AuthContext `onSnapshot` fire → `setUserProfile(newObj)` tao object reference moi → re-render toan bo component tree → React Router route change bi nuot.
- Fix `usePresence`: bo `click`/`keydown` listener, chi giu heartbeat 60s + `visibilitychange`. Van dam bao online status cap nhat dung.
- Fix `AuthContext`: them shallow compare trong `onSnapshot` callback — chi `setUserProfile` khi cac field quan trong (role, status, displayName, email, avatar, department) thay doi. Skip khi chi `lastActiveAt` thay doi.
- Fix `MainLayout`: them `<Suspense fallback={<LoadingSpinner />}>` boc `<Outlet />` de lazy-loaded pages co fallback dung khi chuyen route.

## Ket qua quan trong

- Navigation chuyen tab gio hoat dong muot, khong can F5.
- Online presence van duoc track qua heartbeat 60s va visibility change (du chinh xac).
- AuthContext khong con re-render toan bo tree moi phut (giam ~60 re-render/gio).

## Quyet dinh ky thuat da chot

- usePresence KHONG nen bat click/keydown tren window. Heartbeat + visibilitychange la du de xac dinh online status.
- AuthContext `onSnapshot` PHAI so sanh shallow truoc khi `setUserProfile` de tranh cascade re-render vo nghia.
- `<Outlet />` trong layout route PHAI duoc boc boi `<Suspense>` rieng de lazy pages render dung.

## Cau truc file da thay doi

- `src/hooks/usePresence.js` — Rewrite: bo click/keydown, chi heartbeat + visibilitychange
- `src/context/AuthContext.jsx` — Them shallow compare trong onSnapshot
- `src/components/layout/MainLayout.jsx` — Them Suspense boc Outlet
