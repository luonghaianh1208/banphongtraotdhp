# Ngu canh Session Hien tai

Cap nhat lan cuoi: 2026-05-06

## Muc tieu session

Bo cot STT, thu nho cot Minh chung, bo cot Y/C Giai trinh khoi UnitSubmitPage (tab Bo tieu chi). Dong bo CriteriaDetailPage.

## Da lam trong session nay

- Bo cot STT o ca 2 trang (UnitSubmitPage + CriteriaDetailPage) — tieu chi da co cau truc ro, khong can STT.
- Bo cot "Y/C Giai trinh" khoi tab Bo tieu chi cua UnitSubmitPage — da co tab Giai trinh rieng.
- Giu cot "Y/C Giai trinh" checkbox o CriteriaDetailPage de admin van toggle duoc.
- Thu nho cot Minh chung: giam min-width tu 160px xuong 100px, dung max-w-[180px] de compact.
- Giam min-width bang tu 1600px xuong 1400px o ca 2 trang.
- Build thanh cong, push code len main.

## Ket qua quan trong

- UnitSubmitPage (co so): 14 cot (bo STT va Y/C Giai trinh).
- CriteriaDetailPage (cap tren): 15 cot (bo STT, giu Y/C Giai trinh checkbox).
- Tab "Bo tieu chi" va "Giai trinh" van la 2 tab ngang hang doc lap.

## Quyet dinh ky thuat da chot

- STT khong can thiet khi cot Tieu chi va Noi dung da co dinh 2 cot dau.
- Cot Y/C Giai trinh chi can thiet o phia admin (CriteriaDetailPage) de toggle.
- Co so khong can thay cot Y/C Giai trinh vi nhung tieu chi nam trong tab Giai trinh tuc la phai giai trinh roi.
- Minh chung can compact, khong de file name tran ra ngang.
## Nhung diem can nho neu tiep tuc session sau

- Nen test toan bo luong: Co so nop → Admin tham dinh (YC giai trinh) → Co so giai trinh → Admin cham lai diem sau giai trinh.
- Nen uu tien fix cac bug van con mo:
  1. BUG-002: pending approval bypass
  2. BUG-005 + BUG-014: unit portal shape profile va logout
  3. BUG-017: plan detail field mismatch
  4. BUG-018 / BUG-019: data integrity va notification reliability
