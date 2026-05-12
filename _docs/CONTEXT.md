# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-12

## Muc tieu session

Fix loi dang nhap don vi (loginUnit) va bo sung cascade delete day du cho deleteUnit.

## Da lam trong session nay

- Fix loginUnit: xu ly edge case `auth/email-already-exists` khi fakeEmail bi chiem boi Auth user cu (UID khac). Logic moi: tim Auth user cu theo email → xoa → tao lai dung UID.
- Fix loginUnit: sua `unitData.name` (field khong ton tai) thanh `unitData.unitName` cho displayName.
- Fix deleteUnit cascade: bo sung xoa Firebase Auth user (ca bang uid va fakeEmail), xoa contestEntries, xoa attendanceRecords. Loai bo logic sai xoa plans theo unitId (plans la collection chung).

## Ket qua quan trong

- Don vi co the dang nhap lai sau khi bi xoa va tao lai voi cung username.
- deleteUnit gio clean toan bo: Auth user + criteriaSubmissions + criteriaAssignments + contestEntries + attendanceRecords + Firestore doc.
- Khong con du lieu rac khi admin xoa va tao lai don vi.

## Quyet dinh ky thuat da chot

- Tat ca quyet dinh tu session truoc van con hieu luc (xem CHANGELOG.md).
- **[PATTERN] Modal/Popup phai dung `createPortal`** — Xem chi tiet tai `_docs/PATTERNS.md` muc "Portal Modal".
- **[PATTERN] DateTimePicker/TimePicker** — Toan he thong dung Flatpickr. Xem chi tiet tai `_docs/PATTERNS.md` muc "Flatpickr".
- **[PATTERN] Search/Filter** — Su dung `useMemo` cho logic loc, ket hop nhieu dieu kien (text + dropdown). Hien thi counter "Hien thi X/Y" khi dang loc.
- **[FIX] loginUnit** — Khi createUser gap `email-already-exists`, tim Auth user cu theo fakeEmail, xoa, tao lai. Luon dung `unitData.unitName` cho displayName.
- **[FIX] deleteUnit** — Cascade delete: Auth user (uid + fakeEmail) → criteriaSubmissions → criteriaAssignments → contestEntries → attendanceRecords → Firestore doc.

## Cau truc file da thay doi

- `functions/index.js` — Fix loginUnit (dong ~708-742), fix deleteUnit (dong ~828-920)
