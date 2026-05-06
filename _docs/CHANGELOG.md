# Changelog

## [2026-05-06 PM8] - Refactor module Ke hoach: workflow hoan chinh

### Da sua
- **PlansManagePage.jsx**: Fix link sai `/admin/plans/${id}` thanh `/plans/${id}` (BUG-017 link regression). Them `EvidenceUpload` vao modal tao ke hoach de cap tren upload tai lieu dinh kem + dan link Drive. Doi label "Mo ta ngan gon" thanh "Yeu cau cu the ve ho so".
- **PlanDetailPage.jsx**: Rewrite toan bo — bo sidebar review, chuyen sang layout full-width. Phan tren: noi dung ke hoach + tai lieu dinh kem (EvidenceUpload readOnly). Phan duoi: bang Excel danh sach don vi nop ho so (STT, Don vi, Trang thai, Ngay nop, Ho so dinh kem click-to-download).

### File bi anh huong
- `src/components/criteria/PlansManagePage.jsx`
- `src/components/criteria/PlanDetailPage.jsx`

## [2026-05-06 PM7] - Fix BUG-017 Admin Plan Detail

### Da sua
- **criteriaFirestore.js**: Ham `createOrUpdateContestEntry` tra ve `entryId` truc tiep thay vi promise ngam de giup UI capture id tuc thi.
- **UnitPlanDetail.jsx**: Cap nhat luong submit de dung ID truc tiep, tranh tinh trang click luu sau do click nop thi bao loi document thieu ID.
- **PlanDetailPage.jsx**: Dung `useUnits` va `useMemo` de cross-check danh sach entries voi tong danh sach tat ca don vi, hien thi duoc tat ca don vi kem trang thai "Chua nop", "Dang nhap" hoac "Da nop". Dong thoi doc dung array `docs` thay vi dung logic participants cu de tranh bang rong.

### File bi anh huong
- `src/firebase/criteriaFirestore.js`
- `src/components/unit/UnitPlanDetail.jsx`
- `src/components/criteria/PlanDetailPage.jsx`

## [2026-05-06 PM6] - Multi-wave Justification Workflow

### Them moi
- **react-datepicker**: Tich hop chon ngay deadline giai trinh dep, thay the input date tho
- **sendJustificationRequest()**: Ham Firestore batch de gui yeu cau giai trinh cho nhieu don vi cung luc
- **Floating Justification Bar**: Thanh dieu khien noi o CriteriaOverviewPage va CriteriaDetailPage voi DatePicker + nut gui
- **Cot "Thoi han GT"**: Hien thi deadline voi badge "Het han" khi qua han, o ca 3 trang
- **Auto-lock**: UnitSubmitPage tu dong khoa textarea giai trinh khi qua deadline
- **Filter giaiTrinh tab**: Chi hien muc co `justificationDeadline` (admin da gui yeu cau), khong hien tat ca

### File bi anh huong
- `src/firebase/criteriaFirestore.js` (them sendJustificationRequest)
- `src/components/criteria/CriteriaOverviewPage.jsx`
- `src/components/criteria/CriteriaDetailPage.jsx`
- `src/components/unit/UnitSubmitPage.jsx`
- `package.json` (them react-datepicker)

## [2026-05-06 PM5] - Dong bo Excel + Them Y/C Giai trinh

### Da sua
- exportExcel.js: Xoa cot STT khoi template/import/export, doi "Khung diem" -> "Diem toi da", giam tu 9 cot xuong 8 cot
- CriteriaOverviewPage: Them cot checkbox Y/C Giai trinh (dong bo voi CriteriaDetailPage)
- Import van tuong thich ca file cu (9 cot) va moi (8 cot) nho keyword matching

## [2026-05-06 PM4] - Dong bo bang cap tren voi cong co so

### Da sua
- CriteriaOverviewPage: Xoa cot STT, doi "Max" → "Diem toi da", them cot "Danh gia cua don vi", "Noi dung giai trinh", "Diem sau GT". Dong bo du 14 cot giong UnitSubmitPage
- CriteriaDetailPage: Doi "YC minh chung" → "Yeu cau minh chung", "Diem" → "Diem toi da"
- Ca 2 trang cap tren hien dung thu tu va ten cot giong cong co so

## [2026-05-06 PM3] - Doi ten sidebar + Tach tab Giai trinh

### Da sua
- **constants.js**: Doi label sidebar `Chi tieu` thanh `Bo tieu chi` o cong cap tren.
- **UnitLayout.jsx**: Doi label sidebar `Chi tieu` thanh `Bo tieu chi` o cong co so. Them item sidebar moi `Giai trinh` dung query param `?tab=giaiTrinh`. Cap nhat active state logic.
- **UnitSubmitPage.jsx**: Bo 2 subtab buttons ben trong trang, thay bang doc `tab` tu URL searchParams (`useSearchParams`). Giao dien trang giờ chi hien tab tuong ung — khong con subtab.
- **UnitSubmissionsList.jsx**: Doi tieu de trang tu `Bao cao Chi tieu Thi dua` thanh `Bo tieu chi Thi dua`.

### File bi anh huong
- `src/utils/constants.js`
- `src/components/unit/UnitLayout.jsx`
- `src/components/unit/UnitSubmitPage.jsx`
- `src/components/unit/UnitSubmissionsList.jsx`

## [2026-05-06 PM2] - Bo cot STT, thu nho Evidence, dong bo 2 trang

### Da sua
- **UnitSubmitPage**: Bo cot STT (khong can thiet khi tieu chi da co cau truc ro rang). Bo cot "Y/C Giai trinh" khoi tab Bo tieu chi (da co tab Giai trinh rieng).
- **CriteriaDetailPage**: Bo cot STT de dong bo voi UnitSubmitPage. Giu cot "Y/C Giai trinh" checkbox de admin van co the danh dau.
- Thu nho cot Minh chung (min-w giam tu 160px xuong 100px, file name compact hon).
- Giam min-width bang tu 1600px xuong 1400px de toi uu khong gian ngang.

### File bi anh huong
- `src/components/unit/UnitSubmitPage.jsx`
- `src/components/criteria/CriteriaDetailPage.jsx`

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
