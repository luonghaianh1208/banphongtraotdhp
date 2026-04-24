# Changelog

## [2026-04-25] - Fix toàn bộ 13 bugs backend & security
### Đã sửa
- **BUG-001**: Race condition admin đầu tiên → Cloud Function `initFirstAdmin` + Transaction
- **BUG-003**: Xóa dead code `submissions`, thống nhất sang `criteriaSubmissions`
- **BUG-006**: Duplicate penalty → Transaction + composite key trong `createPenalty`
- **BUG-008/009**: Tighten Firestore rules cho `criteriaSubmissions` (isUnit, status draft check)
- **BUG-011**: `publishPeriodResults` tính điểm tổng trước khi công bố
- **BUG-013**: Race condition draft 2 tabs → composite ID + `setDoc({ merge: true })`
### Đã thêm
- Cloud Function `initFirstAdmin` trong `functions/index.js`
- Export `publishPeriodResults` và `initFirstAdmin` trong `src/firebase/functions.js`
### File bị ảnh hưởng
- `functions/index.js`
- `src/context/AuthContext.jsx`
- `src/firebase/criteriaFirestore.js`
- `src/firebase/functions.js`
- `src/components/criteria/PeriodsManagePage.jsx`
- `firestore.rules`

## [2026-04-24] - Khởi tạo tài liệu dự án
### Trạng thái hiện tại
- Đã hoàn thiện toàn bộ luồng đánh giá Criteria, nộp Proof.
- Tính năng Authentication vã Routing cơ bản (Unit Role phân tách với Admin Role).
- Tính năng Auto-Penalty và Dashboard phân tích dữ liệu hoạt động.
- Framework UI dùng Tailwind + Components tái sử dụng (Skeleton, Modals, Badges).
- Tích hợp Firestore rules bảo mật data (`criteriaSubmissions` chặt chẽ, `criteriaAssignments` chống nộp/chỉnh sửa khi bị thu hồi).

### Hướng dẫn cập nhật
Sau mỗi session làm việc, thêm block mới theo format:

## [YYYY-MM-DD] - Tên tính năng / công việc
### Đã thêm
- ...
### Đã sửa
- ...
### Đã xóa
- ...
### File bị ảnh hưởng
- đường dẫn file 1
- đường dẫn file 2
