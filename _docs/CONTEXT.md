# Ngữ cảnh Session Hiện Tại

## Đang làm tính năng
Fix toàn bộ 13 bugs backend & security — **ĐÃ HOÀN THÀNH**

## Đã làm đến bước
- Fix xong 13/13 bugs
- Build thành công (`vite build`)
- Cập nhật BUGS.md, CHANGELOG.md

## Vấn đề đang gặp
Không có.

## Quyết định kỹ thuật đã chốt
- Dùng Cloud Firestore Security Rules giới hạn bảo mật thay vì check logic tại frontend.
- Composite document ID (`criteriaSetId_unitId`) cho `criteriaSubmissions` để chống race condition.
- `setDoc({ merge: true })` thay vì `addDoc` cho idempotent upsert.
- Cloud Function `initFirstAdmin` dùng Firestore Transaction để atomic assign admin đầu tiên.
- `publishPeriodResults` Cloud Function tính điểm tổng server-side trước khi set `status: 'published'`.
- Penalty creation dùng Transaction + composite key `taskId_userId_penaltyTypeId`.
- Không force migrate TypeScript để giữ tốc độ code.

## File KHÔNG được thay đổi trong session này
- `src/firebase/config.js`

## Ghi chú thêm
- Cần deploy Cloud Functions sau khi merge: `firebase deploy --only functions`
- Cần deploy Firestore Rules: `firebase deploy --only firestore:rules`
