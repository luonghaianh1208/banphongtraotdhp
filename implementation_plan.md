# Xây dựng Module Chỉ tiêu & Kế hoạch - Implementation Plan

Dự án mở rộng thêm 2 module mới: Quản lý Chỉ tiêu và Kế hoạch dành cho Đơn vị Đoàn cơ sở.

## Giai đoạn 2 (Phase 2): Bổ sung Khối, Excel Template & Sửa lỗi Đăng nhập

### User Review Required
> [!IMPORTANT]
> - Cấu trúc `Khối` (Blocks) và `Loại` (Types) sẽ được thêm vào `constants.js` để làm tuỳ chọn khi cấu hình Đơn vị (Unit).
> - Tính năng tài khoản Unit đăng nhập bằng Google sẽ quét trực tiếp email trong danh sách `units`, thay vì tạo account `member` rác.

### 1. Phân loại Khối & Cấp Đơn vị (Units, Criteria, Plans)
Hệ thống cần chia các đơn vị vào đúng "Khối" để có thể giao chỉ tiêu hoặc kế hoạch riêng biệt.
#### [MODIFY] [constants.js](file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/src/utils/constants.js)
Thêm cấu hình `UNIT_BLOCKS` chứa danh sách các Khối (Xã/Phường, Đại học/Cao đẳng, CNVC, Lực lượng vũ trang) và các `Loại` phân cấp bên trong.
#### [MODIFY] Giao diện UnitsPage.jsx
Thêm 2 Dropdown (Select) chọn Khối & Loại vào modal thêm/sửa Đơn vị.
#### [MODIFY] Giao diện CriteriaSetsPage.jsx & PlansManagePage.jsx
Bổ sung tuỳ chọn "Giao cho Khối/Loại nào" (Target Blocks/Types) để lọc Đơn vị nào được phép xem và nộp criteria/plan đó.

### 2. Hoàn thiện Import Excel & Tải File Mẫu
#### [MODIFY] Components hỗ trợ Upload Excel (UnitsPage, CriteriaSetsPage)
- Thiết kế thêm nút **Tải File Mẫu (Download Template)**.
- Khi bấm vào, sử dụng thư viện `xlsx` để sinh ra một file Excel mẫu kèm theo cấu trúc cột chuẩn (ví dụ: STT, Tên đơn vị, Mã Đơn vị, Email, Khối, Loại) để người dùng tải về điền số liệu.

### 3. Sửa lỗi Authentication (Google Login cho Đơn vị)
#### [MODIFY] [auth.js](file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/src/firebase/auth.js) & [AuthContext.jsx](file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/src/context/AuthContext.jsx)
- Cập nhật hàm `loginWithGoogle()`: Khi Google trả về kết quả, trước khi tự động tạo tài khoản trong bảng `users`, hệ thống sẽ `getDocs` từ collection `units` với `where('email', '==', user.email)`.
- Nếu email trùng khớp với một Đơn vị đã được cấp quyền, hệ thống sẽ gán họ đúng role `unit` và bỏ qua việc khởi tạo profile bên cơ sở dữ liệu nội bộ (`users`).
- Nhờ vậy, Unit Login sẽ truy cập thẳng vào giao diện `/unit/*`.

## Verification Plan cho Giai đoạn 2

### Automated Tests
- Kiểm tra tính ổn định của `AuthContext` đảm bảo cả account Admin/Member (trong `users`) và Unit (trong `units`) đều login Google mượt mà không xung đột.

### Manual Verification
1. **Kiểm tra Mẫu Excel**: Đăng nhập Admin, mở Quản lý Đơn vị, bấm "Tải file mẫu" xem file tải về có chuẩn template XLSX không. Sau đó điền thử và Import lại xem data có vào bảng không.
2. **Kiểm tra Phân Khối**: Tạo một "Kế hoạch A" chỉ dành cho "Khối Đại học, Cao đẳng". Vào tài khoản đơn vị thuộc Khối Phường Xã xem có bị ẩn đi không.
3. **Kiểm tra Google Login**: Lấy 1 email (giả lập đơn vị). Dùng tài khoản Admin thêm Đơn vị với email đó. Đăng xuất. Dùng tính năng Sign In With Google chọn email đó. Hệ thống phải đưa thẳng user vào Dashboard của Đơn vị cơ sở (Unit Layout).

