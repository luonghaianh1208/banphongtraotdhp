# Thiết kế giao phụ trách kế hoạch cho nhân viên trong tổ

## Mục tiêu

Bổ sung cơ chế giao nhân viên phụ trách cho nhóm chức năng cấp trên gồm Kế Hoạch, Cuộc Thi, Hội Thi. Nhân viên được giao phải nhìn thấy kế hoạch mình phụ trách và có quyền điều chỉnh, chỉnh sửa kế hoạch trong phạm vi quản lý kế hoạch.

## Phạm vi

- Áp dụng cho collection `plans`, bao gồm các loại kế hoạch/cuộc thi/hội thi đang dùng chung màn quản lý kế hoạch.
- Không thay đổi luồng nộp của cổng cơ sở cấp dưới.
- Không thay đổi logic bộ tiêu chí, chỉ tham khảo cách giao người phụ trách hiện có ở bộ tiêu chí.

## Dữ liệu

Mỗi kế hoạch bổ sung các trường:

- `assignedStaffIds`: danh sách uid nhân viên phụ trách.
- `assignedStaffNames`: danh sách tên/email hiển thị của nhân viên phụ trách.

Mỗi bản ghi log thao tác lưu ở subcollection:

- `plans/{planId}/activityLogs/{logId}`

Thông tin log gồm:

- `action`: loại thao tác, ví dụ `create`, `update_content`, `update_status`, `update_assignees`, `update_title`, `update_attachments`.
- `message`: nội dung tiếng Việt có dấu để admin đọc nhanh, ví dụ `Nguyễn Văn A đã cập nhật nội dung kế hoạch.`
- `actorId`, `actorName`, `actorRole`.
- `createdAt`.
- `changes`: dữ liệu thay đổi ở mức vừa đủ để đối chiếu, không lưu thừa dữ liệu lớn.

## Quyền

- Admin/manager xem tất cả kế hoạch và có quyền giao nhân viên phụ trách.
- Người tạo kế hoạch xem, sửa và giao nhân viên phụ trách cho kế hoạch của mình.
- Nhân viên được giao xem được kế hoạch mình phụ trách và có quyền chỉnh sửa kế hoạch, gồm tiêu đề, trạng thái, nội dung kế hoạch, yêu cầu hồ sơ, tài liệu/link đính kèm.
- Nhân viên được giao không được xóa kế hoạch. Quyền xóa giữ cho admin/manager để tránh mất dữ liệu ngoài ý muốn.
- Firestore rules cần cho phép update kế hoạch khi `request.auth.uid` nằm trong `assignedStaffIds` của kế hoạch.

## Giao diện

Trong màn danh sách kế hoạch:

- Thêm hiển thị nhân viên phụ trách bằng tag/chip.
- Thêm thao tác `Phụ trách` để admin/manager/người tạo chọn nhiều nhân viên.
- Member không phải admin/manager sẽ thấy kế hoạch do mình tạo hoặc kế hoạch có mình trong danh sách phụ trách.

Trong màn chi tiết kế hoạch:

- Hiển thị danh sách nhân viên phụ trách.
- Nhân viên được giao có thể chỉnh sửa nội dung kế hoạch, yêu cầu hồ sơ, tài liệu/link, trạng thái như người quản lý kế hoạch.
- Thêm khu vực nhật ký thao tác để admin/manager theo dõi các thay đổi chính bằng tiếng Việt có dấu.

## Ghi log

Các thao tác cần ghi log:

- Tạo kế hoạch.
- Sửa tiêu đề.
- Sửa nội dung kế hoạch hoặc yêu cầu hồ sơ.
- Thêm/xóa tài liệu hoặc link.
- Đổi trạng thái nháp/đã giao.
- Giao hoặc thay đổi nhân viên phụ trách.

Log chỉ ghi thao tác thành công sau khi ghi Firestore thành công. Nếu cập nhật thất bại thì không tạo log.

## Kiểm thử

- Member được giao nhìn thấy kế hoạch trong danh sách.
- Member không được giao và không phải người tạo không nhìn thấy kế hoạch.
- Member được giao vào được chi tiết và chỉnh sửa được kế hoạch.
- Admin/manager thấy log thao tác tiếng Việt có dấu.
- Firestore rules không chặn thao tác update của nhân viên được giao.
- Cổng cơ sở cấp dưới không thay đổi hành vi nộp kế hoạch/minh chứng.
