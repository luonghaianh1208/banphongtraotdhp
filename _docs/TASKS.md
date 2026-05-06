# Task Board

Cap nhat lan cuoi: 2026-05-05

## Dang uu tien tiep theo

- [ ] Sua BUG-002: Google login khong duoc tu approve user noi bo moi
- [ ] Sua BUG-005 + BUG-014: dong bo shape profile unit va fix logout trong Unit portal
- [x] Sua BUG-017: thong nhat field cua plan detail (`type` / `attachments` / `contestEntries`) - 2026-05-06
- [ ] Sua BUG-018: restore task can xu ly penalty lien quan
- [ ] Sua BUG-019: thong bao can co co che bao loi ro hon thay vi fire-and-forget

## Cong viec can don dep ky thuat

- [ ] Xoa hoac noi lai `src/components/criteria/PeriodsManagePage.jsx`
- [ ] Xoa hoac sua `src/hooks/useSubmissions.js` de khong con import API khong ton tai
- [ ] Rasoat lai module unit de thay het `userProfile.unitId` bang shape profile thuc te

## Da hoan thanh

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
