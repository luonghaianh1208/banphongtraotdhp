# He Thong Kien Truc va Logic

Cap nhat lan cuoi: 2026-05-05

## 1. Luong dang nhap va dieu huong

```text
[Nguoi dung vao app]
      |
      v
  AuthContext nghe onAuthStateChanged
      |
      +-- Chua dang nhap -> /login
      |
      +-- Da dang nhap:
            |
            +-- Tim profile trong users/{uid}
            |     |
            |     +-- Khong co -> check units theo email
            |     |     |
            |     |     +-- Neu khop unit -> dung profile tu units/{uid}
            |     |     +-- Neu khong -> tao users/{uid} mac dinh member
            |     |
            |     +-- Co profile -> subscribe realtime vao users/{uid} hoac units/{uid}
            |
            +-- role=unit va status=approved -> /unit/dashboard
            +-- status=pending -> /pending
            +-- con lai -> route noi bo qua MainLayout
```

Ghi chu:
- UI hien tai chi mo luong dang nhap Google tren `src/pages/LoginPage.jsx`.
- Helper dang nhap email/password van ton tai trong `src/firebase/auth.js` nhung khong duoc dung tu giao dien chinh.
- `AuthContext` suy dien `status` tu `isActive` neu document khong co field `status`.

## 2. Nhom route chinh

- `src/App.jsx` chia app thanh 3 nhom:
- Public: `/login`
- Pending-only: `/pending`
- Internal staff: `/`, `/tasks`, `/dashboard`, `/members`, `/trash`, `/task-config`, `/penalties`, `/settings`, `/system-info`, `/criteria-*`, `/plans-*`, `/units`
- Unit portal: `/unit/dashboard`, `/unit/submissions`, `/unit/submit/:criteriaSetId`, `/unit/plans`, `/unit/plans/:planId`

## 3. Module nghiep vu

- Task management:
  - CRUD task, soft delete, restore, permanent delete
  - submit for approval, approve, revert approve, remind, extend deadline
  - attachment upload qua Firebase Storage
- Member management:
  - pending approval, role change, delete account qua Cloud Functions
- Penalty management:
  - config penalty types trong `config/penaltyTypes`
  - auto overdue penalty qua `useAutoOverduePenalties`
  - manual mark paid / undo / delete
- Criteria management:
  - tao va sua `criteriaSets`
  - giao criteria cho nhieu `units` qua `criteriaAssignments`
  - unit nop bai vao `criteriaSubmissions`
  - admin/manager cham diem va nhan xet
- Plan and contest workflow:
  - admin/manager tao `plans`
  - unit nop ho so vao `contestEntries`
  - admin xem chi tiet va cap nhat trang thai

## 4. Firestore collections dang duoc dung

- `users`: profile noi bo, role `admin|manager|member`, status `pending|approved|rejected`
- `units`: profile don vi, role co dinh `unit`
- `tasks`: task noi bo, co `status` nghiep vu (`active|extended|pending_approval|completed`)
- `penalties`: phieu phat
- `notifications`: inbox realtime theo `userId`
- `config`: categories, priorities, penaltyTypes
- `criteriaSets`: bo tieu chi
- `criteriaAssignments`: map criteria set -> unit
- `criteriaSubmissions`: bai nop theo criteria set cua unit
- `submissionPeriods`: dot bao cao; hien co helper va rules, nhung UI quan ly dot dang khong duoc route vao app
- `plans`: ke hoach / hoi thi
- `contestEntries`: ho so don vi nop cho plan
- `system`: metadata he thong, hien dung cho `firstAdminAssigned`

## 5. Storage va file upload

- Task attachments: `tasks/<taskId>/...`
- Criteria / plan evidence: `evidence/...`
- Rules hien tai nam trong `storage.rules`
- Gioi han kich thuoc:
  - task attachments: 10MB/file
  - evidence: 25MB/file

## 6. Context va custom hooks quan trong

- `AuthContext`
  - quan ly `currentUser`, `userProfile`, role helpers, pending state
  - goi Cloud Function `initFirstAdmin`
- `NotificationContext`
  - subscribe `notifications`
  - mark read / unread / all read
- `TaskConfigContext`
  - load realtime `categories`, `priorities`, `penaltyTypes`
- `useTasks`
  - admin/manager load tat ca task active
  - member load task duoc giao
- `useTaskCRUD`, `useTaskActions`
  - gom logic tao/sua task va approve/extend/remind
- `useAssignments`, `useCriteriaSets`, `usePlans`, `useUnits`, `useContestEntries`
  - wrapper subscribe firestore cho module criteria/unit/plan

## 7. Quy tac nghiep vu quan trong

- Display status cua task duoc tinh dong trong `src/utils/statusUtils.js`
  - `completed`
  - `pending_approval`
  - `extended`
  - hoac tinh theo deadline: `not_due`, `near_due`, `urgent`, `overdue`
- Overdue penalty client-side:
  - `useAutoOverduePenalties` loc task overdue
  - goi Cloud Function `createPenaltyIdempotent` de tranh duplicate
- Approve task:
  - client thu goi Cloud Function `approveTask`
  - sau do van update Firestore truc tiep de dam bao UI dong bo
- Unit criteria submission:
  - draft duoc luu bang composite id `${criteriaSetId}_${unitId}`
  - submit xong thi chuyen sang read-only o frontend
- First admin bootstrap:
  - `functions/index.js` su dung transaction tren `system/firstAdminAssigned`

## 8. Cloud Functions dang co

- `createUser`
- `setUserRole`
- `approveTask`
- `extendDeadline`
- `disableUser`
- `sendDeadlineReminders`
- `autoTaskReminder`
- `autoOverduePenalty`
- `autoDataRetention`
- `lockSubmissionPeriod`
- `publishPeriodResults`
- `createUnit`
- `deleteUser`
- `deleteUnit`
- `initFirstAdmin`
- `createPenaltyIdempotent`

## 9. Diem can luu y khi doc code

- `src/hooks/useSubmissions.js` dang import API khong ton tai trong `src/firebase/criteriaFirestore.js`; hook nay hien khong duoc route/module nao dung.
- `src/components/criteria/PeriodsManagePage.jsx` ton tai trong source nhung khong duoc route vao `src/App.jsx`.
- Module unit hien phu thuoc manh vao shape profile trong `AuthContext`; xem them `_docs/BUGS.md` cho cac diem lech dang mo.
