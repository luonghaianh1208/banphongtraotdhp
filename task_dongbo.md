# Task List: Xây dựng Module Chỉ tiêu & Kế hoạch

- [x] 1. Cập nhật `constants.js` → thêm role `unit` và NAV_ITEMS mới
- [x] 2. Cập nhật `AuthContext.jsx` → xử lý auth flow cho role `unit`
- [x] 3. Tạo `src/firebase/criteriaFirestore.js` chứa các Firestore API mới
- [x] 4. Tạo các custom hooks trong `src/hooks/` tương ứng với từng Firestore function mới
- [x] 5. Cập nhật `firestore.rules` → thêm rule cho các collection mới
- [x] 6. Cập nhật `functions/index.js` → thêm `createUnit`, `lockSubmissionPeriod`, `publishPeriodResults`
- [x] 7. Kiểm tra và bổ sung emulator config vào `firebase.json` phục vụ test
- [x] 18. Chạy kiểm tra final (`check_all` script nếu có)
- [x] 8. Tạo UI Cơ sở: `UnitLayout.jsx` và các shared components trong `src/components/unit/` và `src/components/criteria/`
- [x] 9. Tạo UI các trang cấp Cơ sở (`/unit/*`)
- [x] 10. Tạo UI Nội bộ (Admin): `CriteriaSetsPage.jsx` (bao gồm tính năng Import Excel) và `PeriodsManagePage.jsx` (Quản lý đợt)
- [x] 11. Tạo UI Nội bộ (Chấm điểm): `CriteriaOverviewPage.jsx` và `CriteriaDetailPage.jsx`
- [x] 12. Tạo UI Nội bộ (Kế hoạch): `PlansPage.jsx`, `PlanDetailPage.jsx`
- [x] 13. Tạo UI Nội bộ (Quản lý Đơn vị): `UnitsPage.jsx`
- [x] 14. Cập nhật `App.jsx` → tích hợp routes mới
- [x] 15. Cập nhật `Sidebar.jsx` (Giao diện Nội bộ) → hiển thị menu mới
- [x] 16. Cập nhật `firestore.indexes.json`
- [x] 17. Cập nhật `README.md`

