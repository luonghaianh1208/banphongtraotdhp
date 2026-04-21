# Xây dựng Module Chỉ tiêu & Kế hoạch - Implementation Plan

Dự án mở rộng thêm 2 module mới: Quản lý Chỉ tiêu và Kế hoạch dành cho Đơn vị Đoàn cơ sở.

## User Review Required

> [!IMPORTANT]
> - Có 2 nhóm giao diện hoàn toàn tách biệt: Giao diện cơ sở (`/unit/*`) và Giao diện Quản trị (`/criteria/*`, `/plans/*`).
> - Tài khoản role `unit` sẽ không sử dụng chung cơ sở dữ liệu `users` hiện tại mà sẽ có collection `units` riêng biệt để quản lý tốt hơn (như trong mô tả).

## Proposed Changes

### 1. Core Configuration & Authentication
Cập nhật các thành phần cốt lõi để hỗ trợ role mới (`unit`).
#### [MODIFY] [constants.js](file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/src/utils/constants.js)
Thêm cấu hình role `unit` và các route mới cho sidebar nội bộ.
#### [MODIFY] [AuthContext.jsx](file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/src/context/AuthContext.jsx)
Cập nhật luồng đăng nhập. Nếu role là `unit`, đọc thông tin từ `units` collection và redirect đến `/unit`.
#### [MODIFY] [App.jsx](file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/src/App.jsx)
Bổ sung `UnitRoute` bảo vệ các route `/unit/*`, đồng thời thêm tất cả các route mới vào application router.

### 2. Backend & Cloud Functions
Triển khai cơ sở dữ liệu và các hàm tự động hoá.
#### [MODIFY] [index.js](file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/functions/index.js)
Bổ sung Cloud Functions: `createUnit` (tạo tài khoản cơ sở), `lockSubmissionPeriod` (khóa đợt chấm), và `publishPeriodResults` (công bố kết quả sơ bộ).
#### [MODIFY] [firestore.rules](file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/firestore.rules)
Tích hợp policy cho 6 collections mới: `units`, `criteriaSets`, `submissionPeriods`, `submissions`, `plans`, và `contestEntries`.
#### [NEW] [criteriaFirestore.js](file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/src/firebase/criteriaFirestore.js)
Module Firestores API biệt lập cho chức năng Chỉ tiêu & Kế hoạch. Tránh làm phình to `firestore.js` gốc.

### 2a. Data Layer (Hooks)
#### [NEW] Các trang trong `src/hooks/`
Tạo các custom hooks tương ứng với từng Firestore function mới để các trang UI dễ gọi mà không vi phạm cấu trúc (như `useSubmissions`, `useCriteriaSets`, `usePlans`,...).

### 3. Đơn vị cơ sở (Unit Interface)
#### [NEW] [UnitLayout.jsx](file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/src/components/unit/UnitLayout.jsx) 
Layout riêng biệt cho cấp cơ sở (không dùng Sidebar nội bộ).
#### [NEW] Shared Components trong `src/components/unit/` và `src/components/criteria/`
Xây dựng các linh kiện dùng chung như `ConditionRow`, `EvidenceUpload`, `GradeInputCard` để tái sử dụng mã nguồn.
#### [NEW] Các trang trong `src/pages/unit/`
Bao gồm: `UnitDashboard.jsx`, `UnitSubmitPage.jsx`, `UnitResultsPage.jsx`, `UnitPlansPage.jsx`, `UnitPlanDetailPage.jsx`, `UnitApplyPage.jsx`, `UnitSettingsPage.jsx`.
#### [NEW] Các trang trong `src/pages/unit/`
Bao gồm: `UnitDashboard.jsx`, `UnitSubmitPage.jsx`, `UnitResultsPage.jsx`, `UnitPlansPage.jsx`, `UnitPlanDetailPage.jsx`, `UnitApplyPage.jsx`, `UnitSettingsPage.jsx`.

### 4. Giao diện nội bộ (Admin/Manager/Member Interface)
#### [NEW] Các trang trong `src/pages/criteria/`
Bao gồm: `CriteriaOverviewPage.jsx`, `CriteriaDetailPage.jsx`, `PeriodsManagePage.jsx`, `CriteriaSetsPage.jsx` (cây tiêu chí 3 cấp) để quản trị đợt nộp và chấm điểm.
> [!NOTE]
> Thêm chức năng **Import Excel** trong `CriteriaSetsPage.jsx`. Sử dụng thư viện `xlsx` (đã có sẵn trong package.json) để đọc và tự động tạo cấu trúc tiêu chí từ file mẫu.
#### [NEW] Các trang trong `src/pages/plans/` và `UnitsPage.jsx`
Gồm `PlansPage.jsx`, `PlanDetailPage.jsx`, `PlanFormPage.jsx` để ban hành kế hoạch/thông báo và `UnitsPage.jsx` để quản trị danh sách đơn vị.

## Verification Plan

### Automated Tests
- Kiểm tra tính ổn định của `AuthContext` với test scripts giả lập role `unit` vs các role hiện hành.
- Bổ sung cấu hình **Firebase Emulator** (`emulators`) vào `firebase.json` và `.firebaserc` trước khi test.
- Khởi chạy Firebase Emulator để test FireStore rules đối với từng module trước khi deploy thực tế.

### Manual Verification
- Login bằng tài khoản Admin để truy cập quản lý Hệ thống Chỉ tiêu. Thử tạo 1 bộ criteriaSet có cấu trúc 3 cấp và mở 1 đợt thu.
- Login bằng tài khoản Đơn vị (Unit). Verify layout nội dung hiển thị ở `/unit/` thay vì dashboard mặc định. Test Upload minh chứng và Nộp tự chấm điểm.
- Login bằng tài khoản chấm điểm, thử lưu nháp chấm thi và Verify luồng khoá/publish.
