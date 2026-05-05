# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-05

## Muc tieu session

Cai thien UX trang don vi: compact evidence list, hien thi diem cham va nhan xet cua cap tren.

## Da lam trong session nay
 
 - Redesign EvidenceUpload tu grid cards sang compact list voi icon, ten file dep, badge extension.
 - Them 2 cot "Cap tren" va "Nhan xet" vao bang tieu chi phia don vi (chi hien khi status = graded).
 - Hien thi tong diem cap tren cham va nhan xet chung o thanh sticky.
 - Thu nho padding/min-width cac cot cu de co them khong gian cho cot moi.
 - Xac nhan Firestore rules da cho phep unit doc grading data (khong can sua backend).
 - Hoan thien phan quyen truy cap Bo Tieu Chi: Admin co toan quyen, Member chi duoc xem (View-Only).
 - Hoan thien phan quyen cham diem: Admin duoc cham tat ca, Manager va Member chi duoc cham nhung tieu chi duoc phan cong.
 - Doc doi chieu codebase voi 6 file trong `/_docs`
 - Xac dinh nhieu noi dung cu khong con dung voi source hien tai
 - Cap nhat lai:
   - `ARCHITECTURE.md`
   - `BUGS.md`
   - `CHANGELOG.md`
   - `CONTEXT.md`
   - `PROJECT.md`
   - `TASKS.md`

## Ket qua quan trong

- Tai lieu cu danh dau "13/13 bugs fixed" khong con dung.
- Da mo lai cac loi van ton tai trong code:
  - BUG-002
  - BUG-005
  - BUG-014
  - BUG-015
  - BUG-016
  - BUG-017
  - BUG-018
  - BUG-019
- Architecture docs da doi tu "mo ta du an ly tuong" sang "anh chup he thong dang chay".

## Khong lam trong session nay

- Khong sua source code app
- Khong deploy Firebase / Netlify
- Khong chay build hay lint vi chi thay doi tai lieu

## Quyet dinh ky thuat da chot cho tai lieu

- Chi ghi "fixed" khi co the verify truc tiep tu code hien tai.
- Changelog duoc giu vai tro lich su, nhung se co entry moi neu mot bug cu can mo lai.
- Module legacy / orphan se duoc ghi ro la "khong duoc route" thay vi tiep tuc xem nhu feature dang hoat dong.

## Nhung diem can nho neu tiep tuc session sau

- Neu bat dau sua code, nen uu tien theo thu tu:
  1. BUG-002: pending approval bypass
  2. BUG-005 + BUG-014: unit portal dang co loi shape profile va logout
  3. BUG-017: plan detail field mismatch
  4. BUG-018 / BUG-019: data integrity va notification reliability
- Sau moi dot sua code, cap nhat lai:
  - `_docs/BUGS.md`
  - `_docs/TASKS.md`
  - `_docs/CHANGELOG.md`
