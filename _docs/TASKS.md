# Task Board

Cap nhat lan cuoi: 2026-05-12

## Dang uu tien tiep theo

(Khong co task uu tien)

## Cong viec can don dep ky thuat

- [ ] Rasoat lai module unit de thay het `userProfile.unitId` bang shape profile thuc te

## Da hoan thanh

- [x] UnitSubmitPage: An cot theo tab (bTC an giai trinh, giaiTrinh an To/Han nop/Danh gia), doi ten "Diem cap tren" -> "Diem duoc cham", bo sticky cot Tieu chi/Noi dung - 2026-05-12
- [x] CriteriaOverviewPage + CriteriaDetailPage: Dong bo doi ten "Diem cap tren (truoc GT)" -> "Diem duoc cham", bo sticky cot gay che khuat - 2026-05-12
- [x] Bo sung chuc nang tim kiem va loc cho 3 trang quan ly admin - 2026-05-12
  - UnitsPage: Them o tim kiem theo ten don vi, username, khoi, loai + hien thi ket qua loc
  - PlansManagePage: Them loc theo khoi doi tuong, them nut xoa noi dung search, hien thi ket qua loc
  - CriteriaSetsPage: Da du chuc nang (khong can thay doi)
- [x] Xuat danh sach don vi (ten, username, password, khoi, loai, trang thai) ra Excel tu UnitsPage - 2026-05-12
- [x] Chon hang loat theo khoi doi tuong + chon tat ca khi giao bo tieu chi tai CriteriaSetDetailPage - 2026-05-12
- [x] Tính năng Điểm danh (Attendance) — full module cho cả cấp trên và cơ sở - 2026-05-07
  - Backend: attendancePrograms/attendanceRecords collections, Firestore/Storage rules, autoDeleteExpiredAttendance Cloud Function
  - Frontend: AttendanceManagePage (internal), UnitAttendancePage (unit), hooks, CRUD helpers
  - Features: Tạo/sửa/xoá chương trình, gia hạn, form điểm danh (đại diện, SĐT, giờ, số lượng, upload ảnh), popup chi tiết, auto-delete sau 30 ngày
- [x] Sửa lỗi 403 (Forbidden) khi Đơn vị đăng nhập: Cập nhật mật khẩu mặc định từ abc@123. thành abc@123, xoá dữ liệu cũ và deploy lại Cloud Functions - 2026-05-07
- [x] Chuyen doi xac thuc don vi tu Google sang Username/Password + Custom Token - 2026-05-07
  - Backend: createUnit (username/password), loginUnit (Custom Token), changeUnitPassword, resetUnitPassword
  - Frontend: LoginPage dual-tab (Don vi | Noi bo), ChangePasswordModal, UnitsPage (username/password columns + reset)
  - Excel: Template va import doi Email thanh Username/Password
  - Deploy: Cloud Functions 19/19 + Netlify production
- [x] Cloud Functions da deploy day du 16/16 functions tren production (da verify) - 2026-05-07
- [x] Fix BUG-023: navigation freeze do usePresence click handler race condition voi AuthContext onSnapshot - 2026-05-07
- [x] Toi uu heartbeat presence tu 60s len 1 gio, giam 98% Firestore writes - 2026-05-07
- [x] Sua BUG-018: restore task can xu ly penalty lien quan - 2026-05-07
- [x] Cascade delete khi xoa don vi + progress notes UI + justification cho don vi chua nop - 2026-05-07
- [x] Plan Access Control: Member chi thay plan minh tao, Admin thay tat ca. Guard redirect tren PlanDetailPage - 2026-05-06
- [x] Refactor module Ke hoach: fix link dieu huong, them upload file vao form tao KH, bang Excel full-width theo doi nop ho so - 2026-05-06
- [x] Implement multi-wave justification workflow: floating bar + DatePicker deadline + auto-lock expired + deadline column across all 3 pages - 2026-05-06
- [x] Dong bo Excel template/import/export (xoa STT, doi Khung diem -> Diem toi da, 8 cot) + them checkbox Y/C Giai trinh vao CriteriaOverviewPage - 2026-05-06
- [x] Dong bo CriteriaOverviewPage + CriteriaDetailPage du 14 cot giong UnitSubmitPage (xoa STT, doi ten Max/YC/Diem, them cot Danh gia/Giai trinh/Diem sau GT) - 2026-05-06
- [x] Doi ten Chi tieu thanh Bo tieu chi o sidebar ca 2 cong, tach Giai trinh thanh tab sidebar rieng, dong bo admin page - 2026-05-06
- [x] Bo cot STT va Y/C Giai trinh khoi UnitSubmitPage, thu nho cot Minh chung, dong bo CriteriaDetailPage - 2026-05-06
- [x] Chuan hoa bang 16 cot dong bo UnitSubmitPage + CriteriaDetailPage, fix syntax bug handleSubmit - 2026-05-06
- [x] Hoan thien phan quyen Role-Based (Admin, Manager, Member) cho chuc nang Bo Tieu Chi va Cham diem - 2026-05-05
- [x] Tích hợp `react-textarea-autosize` và điều hướng bàn phím cho các bảng nhập liệu tiêu chí - 2026-05-05
- [x] Audit lai toan bo `/_docs` theo source code hien tai - 2026-05-05
- [x] Cap nhat `ARCHITECTURE.md`, `PROJECT.md`, `CONTEXT.md` theo hien trang - 2026-05-05
- [x] Mo lai cac bug trong docs bi danh dau nham la "fixed" - 2026-05-05
- [x] Fix transaction `initFirstAdmin` - 2026-04-25
- [x] Fix duplicate overdue penalty bang idempotent Cloud Function - 2026-04-25
- [x] Tighten rules cho `criteriaSubmissions` - 2026-04-25

## Da bo / khong uu tien

- Port toan bo React components sang TypeScript
- Refactor modal/portal chi de lam dep code khi chua co bug cu the
