# HubConnect — Báo Cáo Đánh Giá Logic Hoạt Động

> Đánh giá: 2026-04-24
> Phạm vi: Authentication, Task Workflow, Auto-Penalty, Notification, Data Consistency

---

## Tổng Quan

| Module | Đánh giá | Mức độ nghiêm trọng |
|---|---|---|
| Auth flow | ⚠️ Có vấn đề | Cao |
| Task CRUD | ✅ Tốt | — |
| Task Status Engine | ⚠️ Nhỏ | Thấp |
| Auto-Penalty System | ⚠️ Có vấn đề | Cao |
| Notification System | ⚠️ Có vấn đề | Trung bình |
| Data Consistency | ⚠️ Có vấn đề | Trung bình |

---

## Chi Tiết Vấn Đề

### 1. Authentication & User Management

| # | Vấn đề | File | Dòng | Mức độ | Mô tả |
|---|---|---|---|---|---|
| 1.1 | Race condition tạo admin đầu tiên | AuthContext.jsx | 52–53 | **CAO** | Hai user login đồng thời lần đầu → cả 2 đều thành admin. Cần dùng transaction hoặc Cloud Function. |
| 1.2 | User mới hiện trên 2 danh sách cùng lúc | AuthContext.jsx | 70–73 | **TRUNG BÌNH** | Tạo user mới set `status: 'pending'` + `isActive: false` → hiện ở cả "pending" VÀ "disabled" |
| 1.3 | First user bypass pending approval | auth.js + AuthContext.jsx | 31–39 | **CAO** | `loginWithGoogle` không set `status`. AuthContext set local nhưng không persist. Refresh page → derivation chạy lại → `isActive: true` → được approve tự động dù chưa duyệt. |

### 2. Task Workflow

| # | Vấn đề | File | Dòng | Mức độ | Mô tả |
|---|---|---|---|---|---|
| 2.1 | Submit for approval không kiểm tra deadline đã quá hạn | TaskDetail.jsx | 159–191 | **THẤP** | Assignee có thể gửi duyệt task đã quá hạn. Không có validation chặn. |
| 2.2 | Approve task không verify assignee | useTaskActions.js | 8–43 | **THẤP** | Admin approve bất kỳ task nào dù không được giao. Chỉ cần `canApprove === true`. |
| 2.3 | Gia hạn có thể không xóa penalty đã tạo | useTaskActions.js + TaskDetail.jsx | 90–106, 242–257 | **TRUNG BÌNH** | `handleExtendDeadline` gọi Cloud Function → fallback Firestore có thể fail. `removeOverduePenaltiesForTask` chạy sau nhưng nếu extend fail → penalty vẫn tồn tại. |
| 2.4 | Extend deadline lưu history ngược | firestore.js | 182–199 | **THẤP** | `oldValue: formatDateTime(task.deadline)` format deadline MỚI sau parse, không phải deadline cũ. |

### 3. Task Status Engine

| # | Vấn đề | File | Dòng | Mức độ | Mô tả |
|---|---|---|---|---|---|
| 3.1 | `PENDING_APPROVAL` không có case trong switch | statusUtils.js | 49–57 | **THẤP** | `countTasksByStatus` switch không handle `PENDING_APPROVAL` → không bao giờ match → fallback `default` → không đếm. Tuy nhiên `getTaskDisplayStatus` check trước switch nên display vẫn đúng. |
| 3.2 | Extended task không re-check deadline mới | statusUtils.js | 14 | **THẤP** | Task đã gia hạn nhưng deadline mới cũng đã quá → vẫn return `EXTENDED` không phải `OVERDUE`. Có thể là behavior mong muốn (gia hạn = chấp nhận delay). |

### 4. Auto-Penalty System

| # | Vấn đề | File | Dòng | Mức độ | Mô tả |
|---|---|---|---|---|---|
| 4.1 | Duplicate penalty khi multi-admin online | useAutoOverduePenalties.js | 50–65 | **CAO** | Check `alreadyExists` từ local state. 2 admin online → cùng check lúc 2s debounce → cả 2 thấy "not exists" → tạo 2 penalty cùng loại cho cùng user/task. |
| 4.2 | `isProcessingRef` không ngăn được multi-tab | useAutoOverduePenalties.js | 67–68 | **TRUNG BÌNH** | Chỉ prevent concurrent runs trong 1 browser tab. Không ngăn được 2 tab của 2 admin cùng chạy. |

### 5. Notification System

| # | Vấn đề | File | Dòng | Mức độ | Mô tả |
|---|---|---|---|---|---|
| 5.1 | Fire-and-forget — không retry khi fail | firestore.js | 381–395 | **TRUNG BÌNH** | `addNotification` catch error nhưng không rethrow. Caller không biết notification thất bại. Không có retry mechanism. |
| 5.2 | Không có cleanup notification cũ | — | — | **THẤP** | Không có scheduled function hoặc rule xóa notification hết hạn. Collection sẽ grow vô hạn theo thời gian. |
| 5.3 | Hủy gửi duyệt không thông báo tổ trưởng | TaskDetail.jsx | 193–213 | **THẤP** | `handleCancelSubmission` không gửi notification cho `task.createdBy`. Tổ trưởng không biết nhân viên thu hồi. |

### 6. Data Consistency

| # | Vấn đề | File | Dòng | Mức độ | Mô tả |
|---|---|---|---|---|---|
| 6.1 | Restore task không xóa penalties đã tạo | firestore.js | 236–241 | **TRUNG BÌNH** | `restoreTask` chỉ set `isDeleted: false`. Penalties liên quan vẫn tồn tại. User cũ restore task sẽ thấy penalty cũ. |
| 6.2 | PenaltyManagementPage users state có thể stale | PenaltyManagementPage.jsx | 29–32 | **THẤP** | Dùng local `useState` cho users, không dùng `useUsers` hook → khi MembersPage duyệt user mới → PenaltyManagementPage (nếu đang mở) không tự cập nhật. |

### 7. Edge Cases

| # | Vấn đề | File | Dòng | Mức độ | Mô tả |
|---|---|---|---|---|---|
| 7.1 | Member approve task không được giao | useTaskActions.js | 8–43 | **THẤP** | `canApprove === true` → approve bất kỳ task nào, không cần là assignee. |
| 7.2 | Unit role không có notification context riêng | firestore.js + các page | — | **THẤP** | Unit accounts có `role: 'unit'` nhưng notification flow không có branch riêng cho unit workflow. |

---

## Thứ tự ưu tiên fix

| Ưu tiên | Vấn đề | Lý do |
|---|---|---|
| **1** | 1.1 — Race condition admin đầu tiên | Security + data integrity |
| **2** | 1.3 — First user bypass pending | Security |
| **3** | 4.1 — Duplicate penalty multi-admin | Data integrity + financial |
| **4** | 6.1 — Restore không xóa penalty | Data integrity |
| **5** | 5.1 — Notification fire-and-forget | UX (mất thông báo quan trọng) |
| **6** | 2.3 — Gia hạn có thể không xóa penalty | Data integrity |
| **7** | Còn lại | Thấp hơn |