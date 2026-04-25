# Bug Tracker — HubConnect

## Hướng dẫn
Thêm bug mới theo format bên dưới.
Trạng thái: open | in-progress | fixed | wont-fix

---

## 🔴 NGHIÊM TRỌNG

## [BUG-001] Race condition tạo admin đầu tiên
- **Trạng thái**: ✅ fixed (2026-04-25)
- **Fix**: Cloud Function `initFirstAdmin` + Firestore Transaction trong `AuthContext.jsx`.

---

## [BUG-002] First user bypass pending approval sau khi refresh
- **Trạng thái**: ✅ fixed
- **Fix**: Bỏ vế fallback, chỉ dùng `status === 'approved'`.

---

## [BUG-003] Dữ liệu bài nộp lưu 2 collection khác nhau
- **Trạng thái**: ✅ fixed (2026-04-25)
- **Fix**: Xóa code cũ `submissions`, thống nhất sang `criteriaSubmissions`.

---

## [BUG-004] Field tự chấm không khớp
- **Trạng thái**: ✅ fixed (2026-04-25)
- **Fix**: Thêm fallback `responses[].selfScore` và `.notes` cho cả format mới và format cũ (`groups → conditions`) trong `CriteriaDetailPage.jsx`.

---

## [BUG-005] `userProfile.unitId` undefined
- **Trạng thái**: ✅ fixed
- **Fix**: Đổi `userProfile.unitId` → `userProfile.id` trong `UnitSubmitPage`.

---

## [BUG-006] Duplicate penalty multi-admin
- **Trạng thái**: ✅ fixed (2026-04-25)
- **Fix**: Cloud Function `createPenaltyIdempotent` + Transaction + composite key `userId_taskId_penaltyTypeId`. Hook `useAutoOverduePenalties` gọi CF thay vì `createPenalty` trực tiếp.

---

## 🟠 QUAN TRỌNG

## [BUG-007] Hủy phê duyệt không gửi Notification
- **Trạng thái**: ✅ fixed
- **Fix**: Thêm `addNotification` vào `handleCancelSubmit` trong `TaskDetail.jsx`.

---

## [BUG-008] Đơn vị sửa được bài sau khi đợt khóa
- **Trạng thái**: ✅ fixed (2026-04-25)
- **Fix**: Firestore Rules check `submissionPeriods/{periodId}.status` trước khi cho update. Thêm `periodId` vào `saveUnitCriteriaResponse`. FE guard `isPeriodLocked` trong `UnitSubmitPage.jsx`.

---

## [BUG-009] `criteriaSubmissions` Firestore Rules quá lỏng
- **Trạng thái**: ✅ fixed (2026-04-25)
- **Fix**: Thêm `isUnit()` + `unitId == request.auth.uid` vào rules.

---

## [BUG-010] Member nội bộ không thấy tiêu chí được phân công
- **Trạng thái**: ✅ fixed
- **Fix**: Sửa filter trong `CriteriaDetailPage.jsx`.

---

## [BUG-011] `publishPeriodResults` không tính điểm
- **Trạng thái**: ✅ fixed (2026-04-25)
- **Fix**: Cloud Function loop `criteriaSubmissions`, tính `totalGradedScore`, lưu vào `results`.

---

## 🟡 NHỎ

## [BUG-012] `UnitSubmissionsList` đọc sai cấu trúc tiêu chí
- **Trạng thái**: ✅ fixed
- **Fix**: Đổi path sang `tieuChi → noiDung → muc`.

---

## [BUG-013] Race condition draft 2 tabs
- **Trạng thái**: ✅ fixed (2026-04-25)
- **Fix**: Composite ID `criteriaSetId_unitId` + `setDoc({ merge: true })`.

---

## Thống kê

| Mức độ | Số lượng | Trạng thái |
|---|---|---|
| 🔴 Nghiêm trọng | 6 | 6 fixed |
| 🟠 Quan trọng | 5 | 5 fixed |
| 🟡 Nhỏ | 2 | 2 fixed |
| **Tổng** | **13** | **13 fixed** |
