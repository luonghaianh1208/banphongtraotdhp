# Task Board

Cap nhat lan cuoi: 2026-05-07

## Dang uu tien tiep theo

(Khong co task uu tien)

## Cong viec can don dep ky thuat

- [ ] Rasoat lai module unit de thay het `userProfile.unitId` bang shape profile thuc te

## Da hoan thanh

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
