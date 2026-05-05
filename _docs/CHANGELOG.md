# Changelog

## [2026-05-06] - Chuan hoa bang 16 cot dong bo & fix syntax bug

### Da sua
- **UnitSubmitPage**: Fix syntax bug — `handleSubmitJustification` bi long trong `handleSubmit` do thieu `};` dong ham.
- **UnitSubmitPage**: Them 2 cot con thieu vao bang: "Y/C Giai trinh" (hien thi trang thai checkbox cua cap tren) va "Noi dung giai trinh" (luon hien thi o ca 2 tab, chi editable o tab Giai trinh).
- Ca 2 trang UnitSubmitPage va CriteriaDetailPage gio deu hien day du 16 cot dong bo.

### File bi anh huong
- `src/components/unit/UnitSubmitPage.jsx`

## [2026-05-05 PM3] - Role-Based Access Control cho Bo tieu chi

### Đã thay đổi
- **Phân quyền Criteria**: Admin/Manager có toàn quyền tạo/sửa/xóa bộ tiêu chí.
- **Member View-Only**: Account role `member` chỉ được xem bộ tiêu chí (ẩn nút Tạo mới, Xóa, Import, Export, Checkbox).
- **Quyền chấm điểm**: Admin được chấm điểm tất cả các tiêu chí. Manager và Member chỉ được chấm điểm những tiêu chí được phân công.

### File bị ảnh hưởng
- `src/App.jsx`
- `src/utils/constants.js`
- `src/components/criteria/CriteriaSetsPage.jsx`
- `src/components/criteria/CriteriaDetailPage.jsx`

## [2026-05-05 PM2] - Compact evidence list + Grading visibility

### Đã thay đổi
- **EvidenceUpload**: Redesign từ grid cards sang compact list (icon + tên file + badge). Tên file hiển thị đẹp hơn (bỏ timestamp prefix, thay `_` thành space).
- **UnitSubmitPage**: Thêm 2 cột mới "Cấp trên" và "Nhận xét" (chỉ hiện khi status = graded). Thu nhỏ padding/min-width các cột cũ để có thêm không gian.
- **Grading summary**: Hiển thị tổng điểm cấp trên chấm và nhận xét chung ở thanh sticky trên cùng.
- Không cần sửa Firestore rules (đã allow read cho authenticated users).

### File bị ảnh hưởng
- `src/components/criteria/EvidenceUpload.jsx` (rewrite)
- `src/components/unit/UnitSubmitPage.jsx` (add grading columns + compact layout)

## [2026-05-05 PM] - Tối ưu UX bảng tiêu chí

### Đã thay đổi
- Tích hợp `react-textarea-autosize` cho các ô textarea ở `CriteriaSetDetailPage.jsx` và `UnitSubmitPage.jsx`.
- Thêm tính năng điều hướng bằng bàn phím (Enter để nhảy dòng tiếp theo, Shift+Enter để ngắt dòng).
- Thêm chú thích "Mẹo nhập liệu" trên giao diện ở trang admin và trang đơn vị.

### File bị ảnh hưởng
- `src/components/criteria/CriteriaSetDetailPage.jsx`
- `src/components/unit/UnitSubmitPage.jsx`

## [2026-05-05] - Dong bo lai thu muc `_docs` voi codebase

### Da sua tai lieu
- Viet lai `ARCHITECTURE.md` theo route, collections, hooks va Cloud Functions dang co that trong source
- Cap nhat `PROJECT.md` de phan anh dung stack, thu muc va module dang hoat dong
- Cap nhat `CONTEXT.md` va `TASKS.md` theo session audit hien tai
- Viet lai `BUGS.md` theo ket qua verify truc tiep tu code hien tai

### Da mo lai bug trong docs
- `BUG-002`: Google login van co the bypass pending approval
- `BUG-005`: `userProfile.unitId` van sai o mot phan unit module

### Da bo claim khong con dung
- "13/13 bugs fixed"
- mo ta `submissionPeriods` nhu feature dang route vao app
- data model cu cho `plans/submissions`

### File bi anh huong
- `_docs/ARCHITECTURE.md`
- `_docs/BUGS.md`
- `_docs/CHANGELOG.md`
- `_docs/CONTEXT.md`
- `_docs/PROJECT.md`
- `_docs/TASKS.md`

## [2026-04-25 PM] - Fix chi tiet BUG-004, BUG-006, BUG-008

### Da sua
- `BUG-004`: them fallback `responses[].selfScore` va `.notes` cho format cu trong `CriteriaDetailPage.jsx`
- `BUG-006`: them Cloud Function `createPenaltyIdempotent`, `useAutoOverduePenalties` goi backend thay vi tao penalty truc tiep
- `BUG-008`: them guard period lock o `UnitSubmitPage.jsx` va siet rule cho `criteriaSubmissions`

### File bi anh huong
- `src/components/criteria/CriteriaDetailPage.jsx`
- `functions/index.js`
- `src/hooks/useAutoOverduePenalties.js`
- `firestore.rules`
- `src/firebase/criteriaFirestore.js`
- `src/components/unit/UnitSubmitPage.jsx`

## [2026-04-25] - Dot fix backend va security

### Da sua
- transaction `initFirstAdmin`
- composite id / idempotent flow cho `criteriaSubmissions`
- `publishPeriodResults` tinh tong diem server-side
- mot phan Firestore rules cho `criteriaSubmissions`

### Ghi chu
- Entry nay la lich su thay doi truoc do.
- Hien trang code 2026-05-05 duoc xem la source of truth cho `_docs/BUGS.md`.

## [2026-04-24] - Khoi tao bo tai lieu `_docs`

### Da them
- `ARCHITECTURE.md`
- `BUGS.md`
- `CHANGELOG.md`
- `CONTEXT.md`
- `PROJECT.md`
- `TASKS.md`
