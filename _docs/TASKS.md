# Task Board

## 🔴 Đang làm
(đã hoàn thành các bug critical)

## 🟡 Cần làm tiếp
- [ ] Rollback Xoá Penalty khi phục hồi Task/Hỗ trợ Extend Deadline an toàn — Đồng bộ luồng (Data Integrity) — Độ ưu tiên: TB
- [ ] Cleanup Notifications rác quá thời hạn / Quá trình xử lý Notifications Fire-And-Forget mảng catch block. — Độ ưu tiên: THẤP

## ✅ Đã hoàn thành
- [x] Sửa 13 Bugs Nghiêm Trọng/Quan Trọng (BUG-001 đến BUG-013) — hoàn thành ngày 2026-04-25
- [x] Deploy Cloud Functions (`initFirstAdmin`, `publishPeriodResults`) — hoàn thành ngày 2026-04-25
- [x] Deploy Firestore Rules bảo mật `criteriaSubmissions` — hoàn thành ngày 2026-04-25
- [x] Sửa Lỗ Hổng Criteria Rules (Block `criteriaSubmissions` leak và Lock Submission theo Revoked Assignment) — hoàn thành ngày 2026-04-24
- [x] Fix Performance 1: `userMap` -> `useMemo` trong TaskDetail (O(1) access) — hoàn thành ngày 2026-04-24
- [x] Fix Performance 2: `taskUserMap` -> `DashboardPage.jsx` giải quyết Nested Map O(n×m) — hoàn thành ngày 2026-04-24
- [x] Khởi tạo documentation trong `_docs/`. — hoàn thành ngày 2026-04-24

## ❌ Đã bỏ / không làm nữa
- Port React Components sang TypeScript (không cần thiết để phát triển do framework đã quá ổn định định dạng JS).
- Chỉnh sửa React Portals cho modal popup do quá rủi ro đứt gãy luồng rendering UI cũ.
