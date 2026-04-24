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
- **Trạng thái**: ✅ fixed
- **Fix**: Sửa `CriteriaDetailPage` đọc `submission.responses[m.id].selfScore`.

---

## [BUG-005] `userProfile.unitId` undefined
- **Trạng thái**: ✅ fixed
- **Fix**: Đổi `userProfile.unitId` → `userProfile.id` trong `UnitSubmitPage`.

---

## [BUG-006] Duplicate penalty multi-admin
- **Trạng thái**: ✅ fixed (2026-04-25)
- **Fix**: `createPenalty` dùng Transaction + composite key `taskId_userId_penaltyTypeId`.

---

## 🟠 QUAN TRỌNG

## [BUG-007] Hủy phê duyệt không gửi Notification
- **Trạng thái**: ✅ fixed
- **Fix**: Thêm `addNotification` vào `handleCancelSubmit` trong `TaskDetail.jsx`.

---

## [BUG-008] Đơn vị sửa được bài sau khi đợt khóa
- **Trạng thái**: ✅ fixed (2026-04-25)
- **Fix**: Thêm check `resource.data.status == 'draft'` vào `firestore.rules`.

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
