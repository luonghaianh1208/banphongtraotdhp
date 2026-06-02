# Báo Cáo Cập Nhật Module Bộ Tiêu Chí - 02/06/2026

## Phạm Vi

Thay đổi chỉ tập trung vào module bộ tiêu chí, màn tổng quan/thẩm định bộ tiêu chí và cổng cơ sở khi nộp minh chứng bộ tiêu chí.

## 1. Quyền Member Trong Bộ Tiêu Chí

- Member được mở quyền thao tác ngang với admin trong module bộ tiêu chí.
- Member có thể tạo, sửa, xóa bộ tiêu chí ở UI.
- Member có thể thêm/sửa cấu trúc tiêu chí, nội dung, mục chấm.
- Member có thể giao bộ tiêu chí cho đơn vị.
- Member có thể chấm điểm và gửi yêu cầu giải trình.
- Firestore rules đã đổi `criteriaSets` và `criteriaAssignments` từ `isAdminOrManager()` sang `isStaff()`.

## 2. Tài Liệu Đính Kèm Cho Yêu Cầu Minh Chứng / Nguyên Tắc Chấm

- Mỗi mục chấm có thêm field `guideFiles`.
- Cấp trên có thể tải nhiều file cùng lúc.
- Định dạng cho phép: PDF, Word, Excel.
- File được lưu trên Firebase Storage dưới path `evidence/criteria-guides/...`.
- Cấp dưới và cấp trên có thể bấm xem trước ngay trong trang qua `FilePreviewModal` dùng `createPortal`.

## 3. Ngày Tháng Năm

- Thêm helper `formatDisplayDate`.
- Các deadline bộ tiêu chí dạng `yyyy-MM-dd` được hiển thị thành `dd/MM/yyyy`.
- Excel tổng quan bộ tiêu chí cũng dùng định dạng ngày `dd/MM/yyyy`.
- Bổ sung quét sau cùng: các màn kế hoạch/hội thi và export bộ tiêu chí cũng dùng helper ngày chung.
- Không còn `toLocaleDateString` hoặc `toLocaleString` trực tiếp trong `src`.

## 4. Giao Cho Đơn Vị Theo Nhóm

- Giữ chọn nhanh theo khối hiện có.
- Bổ sung chọn nhanh theo loại đơn vị trong từng khối, ví dụ Xã, Phường, Đại học, Cao đẳng.

## 5. Link Minh Chứng Của Cấp Dưới

- Ngoài Facebook, hệ thống cho phép thêm link thuộc `https://thanhdoanhaiphong.gov.vn/*`.
- Các cảnh báo ở cổng cơ sở đã đổi thành link Facebook hoặc `thanhdoanhaiphong.gov.vn`.
- Vẫn không cho tải file minh chứng ở cổng cơ sở trong luồng bộ tiêu chí.

## File Chính Đã Sửa

- `firestore.rules`
- `src/components/criteria/CriteriaSetsPage.jsx`
- `src/components/criteria/CriteriaSetDetailPage.jsx`
- `src/components/criteria/CriteriaOverviewPage.jsx`
- `src/components/criteria/CriteriaDetailPage.jsx`
- `src/components/criteria/CriteriaGuideFiles.jsx`
- `src/components/criteria/EvidenceUpload.jsx`
- `src/components/unit/UnitSubmitPage.jsx`
- `src/components/unit/UnitSubmissionsList.jsx`
- `src/pages/SystemInfoPage.jsx`
- `src/utils/criteriaTable.js`
- `src/utils/dateUtils.js`
- `src/utils/evidenceLinks.js`
- `src/utils/exportExcel.js`

## Kiểm Tra

- `git diff --check`: pass, chỉ có cảnh báo line ending CRLF/LF.
- `eslint` với rule `react-hooks/set-state-in-effect` tắt riêng: pass, còn warning cũ trong `CriteriaSetDetailPage.jsx` và `CriteriaSetsPage.jsx`.
- Full eslint vẫn vướng lỗi cũ `react-hooks/set-state-in-effect` tại `CriteriaSetDetailPage.jsx:51`.

## Lưu Ý

- Các lockfile và backup local ngoài scope không được đưa vào commit.
- Quyền Firestore mới cần deploy để member ghi được `criteriaSets` và `criteriaAssignments` trên môi trường thật.
