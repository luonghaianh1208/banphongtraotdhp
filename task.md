# Task List: Giai đoạn 2 - Phân loại Khối, Excel Template & Xác thực Unit

- [ ] 1. Cập nhật `src/utils/constants.js` → Thêm cấu hình `UNIT_BLOCKS` (Khối và Loại).
- [ ] 2. Sửa Modal Thêm/Sửa Đơn vị (`UnitsPage.jsx`) → Thêm 2 dropdown chọn Khối và Loại.
- [ ] 3. Sửa `CriteriaSetsPage.jsx` và `PlansManagePage.jsx` → Thêm tuỳ chọn "Giao cho Khối/Loại nào".
- [ ] 4. Màn hình Cơ sở (`UnitPlansList.jsx`, `UnitSubmissionsList.jsx`) → Lọc hiển thị chỉ các Kế hoạch/Chỉ tiêu khớp với Khối/Loại của Đơn vị đang đăng nhập.
- [x] Fix build error (`hover:shadow-premium` undefined)
- [x] Perform final visual audit and capture screenshots
- [x] Update walkthrough artifact.
- [ ] 6. Màn hình `CriteriaSetsPage.jsx` (Quản trị) → Bổ sung thêm tính năng "Tải Mẫu Excel" cho nhập Chỉ tiêu.
- [ ] 7. Cập nhật hàm `loginWithGoogle` trong `src/firebase/auth.js` → Truy vấn bảng `units` theo email trước khi gán role.
- [ ] 8. Kiểm tra và đảm bảo tài khoản cấp đơn vị đăng nhập qua Google chuyển hướng đúng vào giao diện `/unit/*`.
