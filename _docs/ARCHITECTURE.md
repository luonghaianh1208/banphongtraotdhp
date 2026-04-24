# Hệ Thống Kiến Trúc & Logic (Architecture)

## Sơ đồ luồng Authentication
```text
[Người dùng truy cập]
       |
    (Chưa đăng nhập) ----> Chuyển hướng sang `/login` 
       |                        |
       |                   [Đăng nhập bằng Email/Pass hoặc Google]
       |                        |
    (Đã đăng nhập)  <-----------+
       |
[Kiểm tra Firestore `users/{uid}`]
       |-- Nếu User mới -> Đang chờ duyệt (Trạng thái pending) -> Chuyển về màn hình Pending
       |-- Nếu Đã duyệt, lấy Role (admin, manager, member, unit):
             |-- Role: 'unit' ----> Redirect `/unit/dashboard` (Menu riêng của unit)
             |-- Default ---------> Redirect `/dashboard` (hoặc `/today`)
```

## Module & Features Chính
- **Auth & Onboarding**: Quản lý đăng nhập, cấp role, cấp quyền. Admin duyệt người dùng mới.
- **Task Management (Công Việc)**: Admin/Manager tạo công việc, giao cho Members. Track tiến độ.
- **Criteria Management (Tiêu Chí)**: Quản lý các bộ chỉ tiêu đánh giá đơn vị (criteriaSets, assignments). 
- **Unit Submissions (Nộp Báo Cáo)**: Điểm nộp cho các đơn vị cung cấp chứng minh (evidence upload).
- **Auto-Penalty System (Hệ Thống Phạt)**: Tự động phạt member nếu trễ deadline task hoặc không cập nhật quá 3 ngày.
- **Notifications**: Thông báo in-app realtime cho user.

## Quản Lý Dữ Liệu Firestore (Collections)
1. **`users`**: Người dùng hệ thống. Fields: `role` ('admin', 'manager', 'member', 'unit'), `status` ('active', 'pending'), `displayName`, vv.
2. **`tasks`**: Chứa công việc. Fields: `title`, `assignees`, `status` ('pending', 'in_progress', 'pending_approval', 'completed'), `deadline`, `createdAt`.
3. **`penalties`**: Các hình phạt trễ deadline.
4. **`notifications`**: Thông báo trong hệ thống.
5. **`units`**: Thông tin cấu hình phòng ban/đơn vị.
6. **`criteriaSets` / `criteriaAssignments` / `criteriaSubmissions`**: Data model cho việc quản lý Bộ tiêu chí -> Giao cho đơn vị -> Đơn vị nộp.
7. **`plans` / `submissions`**: Mô hình quản lý nộp hồ sơ kế hoạch riêng lẻ.
8. **`config`**: Cấu hình chung của ứng dụng (VD hạn nộp, cấu hình điểm, penalty amount).

## React Contexts
- **AuthContext**: State chứa người dùng hiện tại `currentUser` (Firebase Auth) và profil `userProfile` (từ Firestore metadata).
- **NotificationContext**: Quản lý list notification, hàm mark read và Unread Count (đã dùng useMemo).
- **TaskConfigContext**: Quản lý global setting của ứng dụng từ col `config`.

## Custom Hooks Chính
- **Data Fetching Hooks**: `useTasks`, `useUsers`, `useUnits`, `usePenalties`, `useSubmissions`, `useCriteriaSets`. Trọn bộ trả về local state lắng nghe real-time (`onSnapshot`).
- **`useTaskCRUD` / `useTaskActions`**: Logic thay đổi trạng thái, extend, delete array. 
- **`useAutoOverduePenalties`**: Lắng nghe Task, tính toán overdue, sinh doc penalties tự động.
- **`useAssignments`**: Cập nhật logic load phân công bộ tiêu chí.

## Business Logic Quan Trọng
1. **Trạng Thái Task (Task Status Engine)**: Status real của `task` không lưu chữ cứng "QUÁ HẠN". Trạng thái hiển thị (Urgent, Overdue, v.v.) được compute động trong `statusUtils.js` bằng cách so sánh `deadline` gốc và `extendDeadline` với giờ hiện tại.
2. **Tính Phạt Tự Động**: Component chạy ngầm. Quét task `!isCompleted` -> Soạn deadline thực tế. Tạo penalty nếu phát hiện chưa có. (Dùng Promise.allSettled).
3. **Phân Quyền Chấm Điểm**: Đơn vị nộp bài -> Tự động chuyển read-only. Admin/Manager chấm bài và nhập comment, gõ điểm.
4. **Hệ Thống Phân Công (Assignment)**: Cho phép chọn nhiều Đơn vị cùng 1 lúc và giao cho họ Cùng 1 Criteria Set (tạo nhiều records `criteriaAssignments`).

## Firestore Rules Giải Thích
- **Kiểm soát tạo/đọc**: Hầu hết yêu cầu `isAuthenticated()`.
- **`criteriaSubmissions`**: **Chặn** người ngoài; Chỉ đơn vị (isUnit) mới được tạo/sửa đúng bài nộp của chính mình (chặn qua Auth Uid). Admin/Manager được update bài đó để chấm điểm.
- **Tasks**: Tuỳ Role, Assignees vào mới được update. Member chỉ thay đổi file đính kèm/trạng thái. 

## Firebase Storage
- Các file đính kèm `Task` lưu ở `/task_attachments/<taskId>/`
- Avatar người dùng `/user_avatars/<userId>`
- Minh chứng tiêu chí (evidence) `/criteria_evidence/<criteriaSetId>/<unitId>/`
