# Changelog

## [2026-05-12b] - Search & Filter Enhancements for Admin Pages

### Đã thêm (Features)
- **UnitsPage - Tìm kiếm đơn vị**: Thêm ô tìm kiếm (search bar) theo tên đơn vị, username, tên khối, tên loại hình. Kết hợp với filter theo khối hiện có, hiển thị số lượng kết quả khi đang lọc.
- **PlansManagePage - Lọc theo khối đối tượng**: Thêm dropdown lọc kế hoạch theo khối đối tượng (UNIT_BLOCKS). Tìm kiếm bổ sung match cả trường mô tả. Thêm nút xoá nội dung search (clear button) và hiển thị số lượng kết quả.
- **CriteriaSetsPage**: Đã có đầy đủ chức năng tìm kiếm và lọc, không cần thay đổi.

### Cải thiện UX
- Tất cả search input đều có icon kính lúp và nút xoá nhanh (X) khi có nội dung
- Hiển thị counter "Hiển thị X/Y" khi đang lọc để admin biết đang xem bao nhiêu kết quả
- Logic filter được memo hoá bằng `useMemo` để tối ưu hiệu năng

### File bị ảnh hưởng
- `src/components/criteria/UnitsPage.jsx` — Thêm searchQuery state, cập nhật filteredUnits, thêm search input
- `src/components/criteria/PlansManagePage.jsx` — Thêm blockFilter state, cập nhật filteredPlans (useMemo), thêm dropdown khối

---

## [2026-05-12] - Export Unit List & Bulk Selection by Block

### Đã thêm (Features)
- **Xuất danh sách đơn vị**: Nút "Xuất danh sách" tại `UnitsPage` cho phép Admin tải file Excel chứa đầy đủ thông tin các đơn vị (Tên, Username, Mật khẩu, Khối, Loại, Trạng thái) để phân phối tài khoản.
- **Chọn hàng loạt theo khối**: Tại phần giao bộ tiêu chí (`CriteriaSetDetailPage`), thêm toolbar chọn nhanh:
  - Nút "Chọn tất cả" / "Bỏ chọn tất cả" đơn vị khả dụng
  - Các nút chọn theo từng khối đối tượng (UNIT_BLOCKS), toggle on/off, hiển thị số lượng đơn vị mỗi khối
  - Hiển thị tên khối trên mỗi checkbox đơn vị (responsive, ẩn trên mobile)

### File bị ảnh hưởng
- `src/utils/exportExcel.js` — Thêm hàm `exportUnitsToExcel()`
- `src/components/criteria/UnitsPage.jsx` — Thêm nút xuất danh sách, import mới
- `src/components/criteria/CriteriaSetDetailPage.jsx` — Toolbar chọn hàng loạt theo khối, import `UNIT_BLOCKS`

---

## [2026-05-07d] - Unit Authentication Migration (Username/Password)

### Da thay doi (Features)
- **Unit Authentication Migration**: Chuyen doi phuong thuc dang nhap cua Đơn vị cơ sở tu Google OAuth sang Custom Token dua tren Username va Password. Staff/Admin van tiep tuc su dung Google OAuth binh thuong.
- **Dual-tab Login UI**: Nâng cấp trang `/login` thành 2 tab tách biệt rõ ràng cho Đơn vị và Nội bộ.
- **First-time Password Change**: Yêu cầu các đơn vị phải đổi mật khẩu ở lần đăng nhập đầu tiên (hoặc khi admin reset mật khẩu). Sử dụng `ChangePasswordModal` chặn hoàn toàn ứng dụng nếu chưa đổi.
- **Admin Unit Management**: Đổi giao diện quản lý đơn vị tại `UnitsPage`, loại bỏ Email, hiển thị Username và Password (có toggle ẩn hiện). Bổ sung nút Reset Password cho quản trị viên.

### Da don dep (Data Cleanup)
- **Excel Template**: Thay đổi logic xuất và nhập file Excel, xóa bỏ cột Email và thêm vào 2 cột Username và Password cho việc import hàng loạt.
- Tự động hóa logic sinh username và password mặc định khi import Excel mà bỏ trống (Username = `ten.khong.dau.tdhp`, Password = `abc@123.`).

### Backend (Cloud Functions)
- **`loginUnit`**: Hàm đăng nhập xác thực thông tin từ database và trả về Custom Token để client tự động đăng nhập Firebase Auth.
- **`createUnit`**: Tạo hoặc cập nhật thông tin credentials (username, password thô) trên Firestore thay vì tạo tài khoản Firebase Auth.
- **`changeUnitPassword`**: Cho phép đơn vị thay đổi mật khẩu và cập nhật `mustChangePassword = false`.
- **`resetUnitPassword`**: Dành cho quản trị viên khôi phục mật khẩu tài khoản đơn vị về mặc định.

### File bi anh huong
- `functions/index.js` — Thêm 3 hàm mới, cập nhật hàm tạo đơn vị
- `src/firebase/auth.js` — Cập nhật logic lấy Token cho Unit
- `src/context/AuthContext.jsx` — Listener theo dõi cờ báo đổi mật khẩu realtime
- `src/pages/LoginPage.jsx` — UI Đăng nhập tab
- `src/App.jsx` — Thêm route chặn Modal đổi mật khẩu
- `src/components/criteria/UnitsPage.jsx` — Admin Dashboard mới
- `src/utils/exportExcel.js` — Template Excel mới

---

## [2026-05-07c] - Navigation Freeze Fix (BUG-023)

### Da sua (Bugfix)
- **Navigation freeze**: Click chuyen tab trong sidebar, URL doi nhung FE khong cap nhat. Nguyen nhan: `usePresence` bat `window click` goi `updateDoc(lastActiveAt)` moi click → AuthContext `onSnapshot` fire → `setUserProfile(newObj)` re-render toan bo tree → React Router route change bi nuot.
- **Fix usePresence**: Bo `click`/`keydown` listener, chi giu heartbeat 1 gio + `visibilitychange`. Online status van hoat dong binh thuong.
- **Fix AuthContext**: `onSnapshot` callback so sanh shallow cac field quan trong (role, status, displayName...), skip re-render khi chi `lastActiveAt` thay doi.
- **Fix MainLayout**: Them `<Suspense>` boc `<Outlet>` de lazy-loaded pages co fallback dung khi chuyen route.

### Toi uu (Performance)
- **Heartbeat 60s → 1 gio**: Giam 98% Firestore writes (~2,400 vs ~144,000 writes/thang voi 10 user).
- **Online threshold 2 phut → 65 phut**: Khop voi heartbeat 1 gio.

### File bi anh huong
- `src/hooks/usePresence.js` — Heartbeat 1 gio + visibilitychange
- `src/context/AuthContext.jsx` — Shallow compare trong onSnapshot
- `src/components/layout/MainLayout.jsx` — Them Suspense boc Outlet
- `src/pages/MembersPage.jsx` — Online threshold 65 phut

---

## [2026-05-07b] - Members Tab for All Roles + Online Presence

### Da them (Features)
- **Tab Thanh vien cho tat ca roles**: Member va Manager gio truy cap duoc `/members` de xem danh sach thanh vien phong ban (view-only). Admin van giu full quyen quan ly.
- **Online Presence Tracking**: Hook `usePresence` cap nhat `lastActiveAt` moi phut vao Firestore. Hien thi cham xanh Messenger-style khi user dang hoat dong.
- **MembersPage card layout**: Chuyen tu table sang responsive card grid voi avatar, online dot, vai tro, va "X phut/gio truoc".
- **Tim kiem thanh vien**: Thanh search filter theo ten hoac email.

### File bi anh huong
- `src/hooks/usePresence.js` — MOI: online heartbeat
- `src/pages/MembersPage.jsx` — Rewrite hoan toan
- `src/App.jsx` — Mo route cho member/manager
- `src/utils/constants.js` — NAV_ITEMS update
- `src/components/layout/MainLayout.jsx` — Tich hop usePresence

---

## [2026-05-07] - Cascade Delete + UI Progress Notes & Justification Enhancement

### Da them (Features)
- **Cloud Function `deleteUnit`**: Cascade delete — xoa don vi se tu dong xoa sach `criteriaSubmissions`, `criteriaAssignments`, va `plans` lien quan (batch 500 docs/lan).
- **CriteriaOverviewPage UI**: Them note in nghiêng "*• x/y noi dung da nop*" hoac "*• Chua nop noi dung nao*" tren moi card don vi de cap tren theo doi tien do.
- **Justification cho don vi chua nop**: Member gio co the mo bang tham dinh va gui yeu cau giai trinh cho bat ky don vi nao duoc phan cong, ke ca don vi chua nop ho so. Nut "Xem / Y/C Giai trinh" hien thi cho don vi chua nop.

### Da don dep (Data Cleanup)
- Xoa 2 orphaned `criteriaSubmissions` va 2 orphaned `criteriaAssignments` cua don vi "test" (unitId: `idyTlU248CS269QuN4OWHcm0ZZf2`).

### File bi anh huong
- `functions/index.js` - Cascade delete logic trong `deleteUnit`
- `src/components/criteria/CriteriaOverviewPage.jsx` - Progress notes + justification cho not_submitted

---

## [2026-05-06 PM15] - Fix Justification Request Permissions & Indexes

### Da sua (Bug Fixes)
- **firestore.rules**: Staff (admin/manager/member) gio duoc phep tao moi doc trong `criteriaSubmissions` khi gui yeu cau giai trinh cho don vi chua nop. Truoc do chi `isUnit()` duoc phep create → gay loi "Missing or insufficient permissions".
- **firestore.indexes.json**: Them 2 composite indexes cho collection `criteriaAssignments`:
  - `criteriaSetId` + `assignedAt DESC` (cho `subscribeToSetAssignments`)
  - `unitId` + `status` (cho `subscribeToUnitAssignments`)

### File bi anh huong
- `firestore.rules`
- `firestore.indexes.json`

---

## [2026-05-06 PM14] - Remove Bulk Assignment for Criteria Sets

### Da xoa (Removed)
- Xoa tinh nang phan cong hang loat (bulk assignment) tren giao dien `CriteriaSetsPage.jsx` vi xung dot voi logic phan quyen va gui yeu cau giai trinh.
- Cap nhat `firestore.rules` de don gian hoa phan quyen theo role `isMember()` va isStaff().

### File bi anh huong
- `src/components/criteria/CriteriaSetsPage.jsx`
- `firestore.rules`

---

## [2026-05-06 PM13] - Criteria Permission Enforcement Fix

### Da sua (Bug Fixes)
- **BUG-021**: `isRowReadOnly` truoc day cho phep member edit tieu chi chua gan (`assignedTo = null`). Fix: member PHAI duoc gan ro rang moi edit duoc.
- **BUG-021**: Checkbox Y/C Giai trinh gio bi disabled cho tieu chi khong duoc phan cong (dong bo voi input diem).
- **BUG-021**: Backend `sendJustificationRequest` skip im lang khi doc `criteriaSubmissions` chua ton tai → tao doc moi bang `batch.set()` thay vi skip.

### File bi anh huong
- `src/components/criteria/CriteriaOverviewPage.jsx` - isRowReadOnly strict check + lock justification checkbox
- `src/components/criteria/CriteriaDetailPage.jsx` - isRowReadOnly strict check + lock justification checkbox
- `src/firebase/criteriaFirestore.js` - sendJustificationRequest tao doc khi chua ton tai

---

## [2026-05-06 PM12] - Criteria Scoring & Authorization Fixes

### Da sua (Bug Fixes)
- **BUG-020 (NEW)**: Member duoc phan cong tieu chi gio co the cham diem va gui yeu cau giai trinh. Truoc do `sendJustificationRequest` va `gradeCriteriaSubmission` hardcode `'admin'` → thay bang `userProfile.id` dong.
- **BUG-020 (OverviewPage)**: Them `isRowReadOnly()` — member chi cham tieu chi co `assignedTo === userId`, admin cham het. Input diem va nhan xet bi disabled cho tieu chi khong duoc phan cong.
- **BUG-019**: `addNotification()` rethrow error thay vi nuot im. Caller gio biet khi notification that bai.
- **BUG-014**: Nut dang xuat Unit portal da hoat dong (logout expose trong AuthContext).
- **BUG-002**: Google login tao user `status: 'pending'`, `isActive: false`.
- **BUG-005**: Cleanup fallback `unitId` khong ton tai.

### Da xoa (Dead Code)
- **BUG-015**: Xoa `src/hooks/useSubmissions.js` (hook import API khong ton tai).
- **BUG-016**: Xoa `src/components/criteria/PeriodsManagePage.jsx` (orphan screen).

### File bi anh huong
- `src/components/criteria/CriteriaOverviewPage.jsx` - Them useAuth, isRowReadOnly, dynamic userId
- `src/components/criteria/CriteriaDetailPage.jsx` - Dynamic userId cho justification va grading
- `src/firebase/firestore.js` - addNotification rethrow error
- `src/context/AuthContext.jsx` - Expose logout
- `src/firebase/auth.js` - User creation: pending + inactive

---

## [2026-05-06 PM11] - Personal Tasks + Month View on Calendar

### Da them
- **Personal Tasks**: Member tu them viec ca nhan vao thoi khoa bieu (click vao o ngay → popup nhap tieu de, gio, ghi chu). Viec ca nhan chi member tu thay, khong anh huong den admin/member khac. Phan biet truc quan: viec duoc giao (emerald) vs viec ca nhan (sky blue).
- **Month View**: Toggle xem theo tuan hoac thang. Thang hien calendar grid kieu Notion.
- **Auto Cleanup**: Personal tasks qua 30 ngay tu dong bi xoa.

### File moi
- `src/components/calendar/WeeklyCalendar.jsx` - Calendar component (week + month)
- `src/components/calendar/MiniTaskCard.jsx` - The cong viec nho
- `src/components/calendar/PersonalTaskItem.jsx` - The viec ca nhan
- `src/components/calendar/PersonalTaskPopup.jsx` - Popup them viec ca nhan
- `src/hooks/usePersonalTasks.js` - Hook CRUD personal tasks

### File bi anh huong
- `src/pages/TodayPage.jsx` - Rewrite: tich hop personal tasks + month view
- `src/firebase/firestore.js` - Them CRUD cho `users/{uid}/personalTasks`
- `firestore.rules` - Them subcollection rules

---

## [2026-05-06 PM10] - TodayPage: Weekly Timetable View

### Da thay doi
- **TodayPage.jsx**: Gop subtab "Hom nay" + "Tuan nay" thanh 1 subtab "Tuan nay (dd/MM – dd/MM/yyyy)". Thay danh sach task bang **bang thoi khoa bieu tuan** (T2 → CN). Ngay hien tai duoc highlight (emerald). Moi o ngay chua cac the cong viec nho (MiniTaskCard). Click vao the → mo chi tiet task. Desktop: grid 7 cot. Mobile: xep doc tung ngay. Tab "Tat ca" giu nguyen.

### File bi anh huong
- `src/pages/TodayPage.jsx`

---

## [2026-05-06 PM9] - Plan Access Control: Role-Based Visibility

### Da them
- **PlansManagePage.jsx**: Import `useAuth`, them `useMemo` filter — Member chi thay plans minh tao (`createdBy === uid`), Admin/Manager thay tat ca. Luu `createdBy` + `createdByName` khi tao plan moi.
- **PlanDetailPage.jsx**: Import `useAuth` + `Navigate`, them guard — Member truy cap plan cua nguoi khac se bi redirect ve `/plans-manage`.

### File bi anh huong
- `src/components/criteria/PlansManagePage.jsx`
- `src/components/criteria/PlanDetailPage.jsx`

---

## [2026-05-06 PM8] - Refactor module Ke hoach: workflow hoan chinh

### Da sua
- **PlansManagePage.jsx**: Fix link sai `/admin/plans/${id}` thanh `/plans/${id}` (BUG-017 link regression). Them `EvidenceUpload` vao modal tao ke hoach de cap tren upload tai lieu dinh kem + dan link Drive. Doi label "Mo ta ngan gon" thanh "Yeu cau cu extreme ve ho so".
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
