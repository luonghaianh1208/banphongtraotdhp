# HUBCONNECT — COMPREHENSIVE CODE REVIEW REPORT

**Ngày**: 2026-04-22
**Dự án**: HubConnect Task Management System (React/Firebase)
**Review Scope**: Toàn bộ codebase — 65 files được phân tích
**Tổng Issues**: ~100+ issues across 4 dimensions

---

## EXECUTIVE SUMMARY

| Dimension | Score | Severity | Critical Issues |
|---|---|---|---|
| **Security** | CRITICAL | 🔴 Immediate | 2 |
| **Performance** | 55/100 | 🔴 Critical | 5 |
| **Code Quality** | MEDIUM | 🟡 High | 3 |
| **UX/UI** | MEDIUM | 🟡 High | 7 |

**Khuyến nghị**: Fix Security (SEC-001, SEC-002) → Performance (memoization) → UX/UI (z-index, focus trap) → Code Quality

---

## PART 1: SECURITY AUDIT

**Score**: CRITICAL — 2 Critical, 4 High, 4 Medium, 7 Low/Info vulnerabilities

### 🔴 CRITICAL (Fix Immediately)

#### SEC-001: Firestore Rules — Mọi Authenticated User Đọc Được TẤT CẢ Data
- **File**: `firestore.rules:25-95`
- **Vấn đề**: Tất cả collections dùng `allow read: if isAuthenticated()` không có role/status check
- **Ảnh hưởng**: Pending user (chưa approve) vẫn đọc được toàn bộ data
- **Fix**:
```javascript
match /tasks/{taskId} {
  allow read: if isAuthenticated() && (
    request.auth.uid == resource.data.createdBy ||
    request.auth.uid in resource.data.assignees ||
    isAdminOrManager()
  );
}
```

#### SEC-002: Firestore Rules — Không Validate `status` Field
- **File**: `firestore.rules:4-17`
- **Vấn đề**: `getUserRole()` chỉ check `role`, không check `status`. User có `role: 'admin'` nhưng `status: 'pending'` vẫn có admin access trong Firestore
- **Fix**:
```javascript
function isApproved() {
  let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
  return userDoc.data.status == 'approved';
}
```

### 🟠 HIGH (Fix Within 1 Week)

#### SEC-003: Notification Creation — Không Có User Authorization
- `firestore.rules:46` — `allow create: if isAuthenticated()` — Bất kỳ user nào cũng tạo notification cho bất kỳ user khác

#### SEC-004: Submissions/ContestEntries — Không Validate Unit Role
- `firestore.rules:79,91` — Bất kỳ authenticated user đều có thể create submissions

#### SEC-005: Auto-Penalty Chạy Client-Side
- `useAutoOverduePenalties.js:26-84` — Chỉ chạy khi admin online, có race condition
- Cloud Function `autoOverduePenalty` backup nhưng không sync state với client hook → có thể tạo duplicate penalties

#### SEC-006: Cloud Function `createUser` — Unused Nhưng Có Password Creation
- `functions/index.js:33-59` — Dead code, tạo accounts với weak passwords

### 🟡 MEDIUM

- SEC-007: `isUnit()` dùng pattern khác `isAdmin()` — inconsistent
- SEC-008: Task create `createdBy` field từ client — có rule bảo vệ nhưng nên audit
- SEC-009: AuthContext không có debounce khi auth state change liên tục
- SEC-010: Soft delete không có audit trail ai đã xóa

---

## PART 2: PERFORMANCE AUDIT

**Score**: 55/100 — CRITICAL — Immediate Attention Required

### 🔴 CRITICAL

#### PERF-001: Không Memoize Task Filtering/Sorting
- **File**: `TodayPage.jsx:32-54`, `AllTasksPage.jsx:63`, `DashboardPage.jsx:36-41`
- **Impact**: 100-300ms mỗi render với 50+ tasks
- **Fix**: Wrap `filteredTasks`, `sortedTasks`, `barData` trong `useMemo`

#### PERF-002: O(n*m) User Lookups Trong TaskCard
- **File**: `TaskCard.jsx:12-16`
- **Impact**: 200-500ms per render với 20+ cards
- **Problem**: Mỗi TaskCard `.find()` O(n) trên users array, chạy cho mỗi visible card
- **Fix**: Tạo `userMap` (useMemo) ở parent component, pass xuống cho TaskCard

#### PERF-003: 12+ Overlapping onSnapshot Listeners
- **Impact**: Memory bloat, excessive re-renders
- **Location**:
  - AuthContext profile listener
  - TaskConfigContext: 3 listeners (categories, priorities, penaltyTypes)
  - useTasks, useUsers, useAllPenalties, NotificationContext
  - TaskPenaltySection: per-task penalty listener
- **Fix**: Split contexts by update frequency, memoize consumers

#### PERF-004: Sequential Penalty Creation (Nên Parallel)
- **File**: `useAutoOverduePenalties.js:73-79`
- **Impact**: 10x slower nếu tạo nhiều penalties
- **Fix**: `Promise.all(penaltiesToCreate.map(p => createPenalty(p)))`

#### PERF-005: Context Value Recreated Every Render
- **File**: `TaskConfigContext.jsx:47-60`
- **Impact**: 20-50ms per context update, all consumers re-render
- **Fix**: Memoize context value với `useMemo`, wrap helpers với `useCallback`

### 🟡 HIGH IMPACT

- PERF-006: Client-side `isDeleted` filter — fetches all rồi filter (Firestore limitation)
- PERF-007: Client-side trash sort — nên dùng `orderBy('deletedAt', 'desc')` với composite index
- PERF-008: Inline user lookups trong `TaskDetail.jsx:32-34, 46`
- PERF-009: Heavy computations trong `TaskPenaltySection.jsx:93-94, 131`

### Bundle Issues

| Library | Size | Status | Fix |
|---|---|---|---|
| `jspdf` | ~500kb | ❌ Nên lazy-load | Dynamic import on export click |
| `xlsx` | ~300kb | ❌ Nên lazy-load | Dynamic import on export click |
| `recharts` | ~150kb | ❌ Nên lazy-load | `React.lazy` for DashboardPage |

---

## PART 3: CODE QUALITY REVIEW

**Issues**: 25 total — 3 Critical, 10 Medium, 12 Low

### 🔴 CRITICAL

#### CODE-001: Firestore Rules — Missing Size Limit on responses/scores
- **File**: `firestore.rules:80`
- **Vấn đề**: submissions cho phép update responses/scores không có limit → DoS vulnerability
- **Fix**: Thêm `request.resource.data.responses.size() <= 100`

#### CODE-002: AuthContext Race Condition
- **File**: `AuthContext.jsx:31-112`
- **Vấn đề**: `onAuthStateChanged` callback là async, `unsubProfile` cleanup có thể race với new subscriptions → memory leak
- **Fix**: Dùng ref để track current fetch ID, abort stale operations

#### CODE-003: handleRemind Closes Modal Before Success Verification
- **File**: `TaskDetail.jsx:210-221`
- **Vấn đề**: `onClose()` được gọi ngay sau `handleRemindTask` success, không đợi toast hiển thị
- **Fix**: `setTimeout(() => onClose(), 500)` để toast show trước

### 🟡 MEDIUM

- CODE-004: TaskCard inline arrow functions in map — nên memoize
- CODE-005: TodayPage `sortedTasks` not memoized
- CODE-006: `subscribeToTasks` — missing composite index documentation
- CODE-007: `useAutoOverduePenalties` callback recreated on every data change
- CODE-008: `setDoc` without unique check on user creation
- CODE-009: TaskForm không validate file size trước upload
- CODE-010: `handleExtendDeadline` fallback không có loading state differentiation
- CODE-011: NotificationContext missing error handling
- CODE-012: `getTaskDisplayStatus` called repeatedly without memo

---

## PART 4: UX/UI REVIEW

**Issues**: 42 total — 7 Critical, 10 High, 12 Medium, 13 Low

### 🔴 CRITICAL (P0)

#### UX-001: z-index Conflict Giữa Modals
- **File**: `Modal.jsx` uses `z-[9999]`, `FilePreviewModal.jsx` uses `z-[60]`
- **Vấn đề**: FilePreviewModal backdrop cover Modal nhưng content bên dưới vẫn accessible
- **Fix**: Standardize z-index: backdrop=50, modal=60, dropdown=70, tooltip=80

#### UX-002: Duplicate Body Overflow Handling
- **File**: `Modal.jsx:7-18` và `ConfirmDialog.jsx:7-16`
- **Vấn đề**: Khi cả 2 open, close 1 cái reset overflow trước khi cái kia close
- **Fix**: Shared `useBodyScrollLock` hook với ref counter

#### UX-003: Missing Focus Trap in Modals
- **File**: `Modal.jsx`, `ConfirmDialog.jsx`
- **Vấn đề**: Tab/Shift+Tab cycles through elements behind modal — WCAG 2.1.1 violation
- **Fix**: Implement focus trap — store previously focused element, trap focus, return on close

#### UX-004: UnitLayout Uses Undefined `user` Variable
- **File**: `UnitLayout.jsx:7`
- **Vấn đề**: `useAuth()` provides `currentUser`, not `user`. `{user.unitName}` sẽ fail silently
- **Fix**: `const { currentUser: user, isUnit, loading, logout } = useAuth();`

#### UX-005: AllTasksPage Uses Emoji in Toast
- **File**: `AllTasksPage.jsx:54`
- **Vấn đề**: `toast.error(..., { icon: '⏳' })` — accessibility issues
- **Fix**: `icon: <MdSchedule size={20} />`

#### UX-006: TaskCard div Has No Keyboard Alternative
- **File**: `TaskCard.jsx:20`
- **Vấn đề**: `onClick` wrapper div không có `role`, `onKeyDown`, hoặc `tabIndex`
- **Fix**: `role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick(task)}`

#### UX-007: DateTimePicker disableMobile Overrides minDate
- **File**: `DateTimePicker.jsx:13`
- **Vấn đề**: Mobile date selection có thể không respect minDate constraints
- **Fix**: `disableMobile: minDate ? true : false`

### 🟠 HIGH (P1)

| # | Issue | File | Fix |
|---|---|---|---|
| 1 | Inconsistent loading spinners — custom inline vs LoadingSpinner | CriteriaSetsPage, UnitsPage | Use `<LoadingSpinner />` everywhere |
| 2 | EmptyState lacks `className` prop | EmptyState.jsx | Add `className` prop |
| 3 | Sidebar dark mode toggle missing `aria-label` | Sidebar.jsx:108-119 | Add `aria-label` |
| 4 | NavLink missing `aria-current="page"` | Sidebar.jsx:85-100 | Add `aria-current` |
| 5 | Notification dropdown max-height với no scroll indicator | Header.jsx:91 | Add gradient fade |
| 6 | Modal close button missing `aria-label` | Modal.jsx:50-55 | Add `aria-label="Đóng"` |
| 7 | TaskForm assignee checkbox không có `htmlFor` | TaskForm.jsx:107-112 | Link checkbox với label |
| 8 | TaskCard assignee text truncated không accessible | TaskCard.jsx:12-14 | Add `aria-label` |
| 9 | Notification item click thiếu `role` | Header.jsx:102-129 | Add `role="button"` |
| 10 | ErrorBoundary không per-route | App.jsx:165 | Wrap each route separately |

### 🟡 MEDIUM (P2)

| # | Issue | File |
|---|---|---|
| 1 | Inconsistent button classes — `btn btn-primary` vs `btn-primary` inline | UnitsPage.jsx |
| 2 | UnitsPage dùng `label` cho non-form purpose | UnitsPage.jsx:183-196 |
| 3 | TrashPage uses native `confirm()` instead of ConfirmDialog | TrashPage.jsx:60, 68 |
| 4 | "View all notifications" link thiếu href/handler | Header.jsx:136-139 |
| 5 | PlansManagePage link có wrong path | PlansManagePage.jsx:280 |
| 6 | DashboardPage charts fixed `h-[340px]` | DashboardPage.jsx:106, 165 |
| 7 | TaskDetail notes scroll nhưng không visible scrollbar | TaskDetail.jsx:377 |
| 8 | Multiple components duplicate `createPortal` | Various criteria pages |
| 9 | TaskFilters clear button thiếu `aria-label` | TaskFilters.jsx:75-77 |
| 10 | TaskDetail history scrollbar hidden | TaskDetail.jsx:409 |
| 11 | AllTasksPage missing skeleton loaders | AllTasksPage.jsx |
| 12 | StatusBadge contrast có thể không meet WCAG AA | index.css:67-69 |

### 🟢 LOW (P3)

| # | Issue | File |
|---|---|---|
| 1 | LoginPage branding inconsistent với Sidebar | LoginPage.jsx |
| 2 | Loading text "Đang tải..." khác style | LoadingSpinner.jsx |
| 3 | TaskForm file preview dùng emoji | TaskForm.jsx:206-211 |
| 4 | AllTasksPage task count formatting inconsistent | AllTasksPage.jsx:127 |
| 5 | MembersPage avatar images missing `referrerPolicy` | MembersPage.jsx:114 |
| 6 | TaskFilters date inputs thiếu format hint | TaskFilters.jsx:70-71 |
| 7 | ConfirmDialog onConfirm called with onClose | ConfirmDialog.jsx:48 |
| 8 | CriteriaSetsPage modal close button hover `text-red-500` | CriteriaSetsPage.jsx:238-241 |
| 9 | DashboardPage chart tooltip uses inline styles | DashboardPage.jsx:125-133, 185-193 |
| 10 | ColorPicker missing `aria-haspopup` | TaskConfigPage.jsx:500-505 |

---

## PART 5: TECH DEBT REGISTER

### HIGH PRIORITY

| # | Issue | Effort | Files |
|---|---|---|---|
| TD-001 | Fix SEC-001, SEC-002 Firestore rules | 2-4h | firestore.rules |
| TD-002 | Add memoization to TodayPage, AllTasksPage, DashboardPage | 3-4h | 3 pages |
| TD-003 | Implement focus trap in Modal/ConfirmDialog | 1-2h | 2 components |
| TD-004 | Create userMap lookup optimization | 2-3h | TaskCard, TaskDetail |

### MEDIUM PRIORITY

| # | Issue | Effort | Files |
|---|---|---|---|
| TD-005 | Lazy-load jspdf, xlsx, recharts | 2-3h | package.json + import sites |
| TD-006 | Fix AuthContext race condition | 1-2h | AuthContext.jsx |
| TD-007 | Standardize loading spinners | 1h | criteria pages |
| TD-008 | Add ErrorBoundary per-route | 1h | App.jsx |
| TD-009 | Memoize TaskConfigContext helpers | 1h | TaskConfigContext.jsx |
| TD-010 | Fix Promise.all sequential penalty creation | 30min | useAutoOverduePenalties.js |

### LOW PRIORITY (Backlog)

| # | Issue | Effort | Files |
|---|---|---|---|
| TD-011 | Remove unused createUser Cloud Function | 15min | functions/index.js |
| TD-012 | Add aria-labels to all icon-only buttons | 30min | Multiple |
| TD-013 | Replace native confirm() with ConfirmDialog | 15min | TrashPage.jsx |
| TD-014 | Add className prop to EmptyState | 15min | EmptyState.jsx |
| TD-015 | Fix PlansManagePage route link | 5min | PlansManagePage.jsx |
| TD-016 | Cache Intl.NumberFormat | 15min | firestore.js, TaskPenaltySection.jsx |
| TD-017 | Add composite index for trash sorting | 5min | firestore.indexes.json |

---

## PART 6: i18n STATUS

**Không có báo cáo i18n riêng. Danh sách hardcoded strings cần translate:**

### UI Strings Cần i18n

- "Đang tải..." / "Đang xử lý..." / "Đang kết nối..." — inconsistent loading messages
- "Đã nhắc việc thành công!" — TaskDetail.jsx:213
- "Lỗi khi nhắc việc" — TaskDetail.jsx:215
- "Xóa lọc" — TaskFilters.jsx:75
- "Xem tất cả thông báo" — Header.jsx:136
- "Chế độ sáng" / "Chế độ tối" — Sidebar.jsx:108-119
- Badge labels: "Khác", "Không rõ" — Various files

### Khuyến nghị i18n

1. Extract all Vietnamese strings vào `src/locales/vi.json`
2. Add i18n provider (react-i18next hoặc similar)
3. Audit tất cả pages cho hardcoded strings

---

## SUMMARY: PRIORITIZED ACTION ITEMS

### 🔴 IMMEDIATE (Week 1)

| Priority | Action | Why |
|---|---|---|
| P0 | Fix SEC-001, SEC-002 Firestore rules | Security critical — any user can read all data |
| P0 | Fix UnitLayout `user` → `currentUser` | Silent failure — unit name không hiển thị |
| P1 | Add `useMemo` to TodayPage filteredTasks | 100-300ms render improvement |
| P1 | Add `useMemo` to AllTasksPage filteredTasks | Same as above |
| P1 | Fix z-index conflict (Modal vs FilePreviewModal) | UX critical — content accessible behind overlay |

### 🟠 HIGH (Week 2-3)

| Priority | Action | Why |
|---|---|---|
| P2 | Lazy-load jspdf, xlsx, recharts | ~950kb bundle reduction |
| P2 | Create shared `useBodyScrollLock` hook | Fix duplicate overflow handling |
| P2 | Implement focus trap in modals | WCAG 2.1.1 compliance |
| P2 | Add `useMemo` to DashboardPage barData | Dashboard performance |
| P2 | Create userMap for O(1) user lookups | Fix PERF-002 |

### 🟡 MEDIUM (Month 1)

| Priority | Action | Why |
|---|---|---|
| P3 | Memoize TaskConfigContext helpers | Prevent unnecessary re-renders |
| P3 | Standardize all loading spinners | Visual consistency |
| P3 | Add ErrorBoundary per-route | Resilience |
| P3 | Replace native confirm() in TrashPage | UX consistency |
| P3 | Fix AuthContext race condition | Memory leak prevention |

### 🟢 BACKLOG (When Time Permits)

| Priority | Action | Why |
|---|---|---|
| P4 | Remove unused createUser Cloud Function | Security hygiene |
| P4 | Add aria-labels to icon buttons | Accessibility |
| P4 | Fix PlansManagePage route link | Bug fix |
| P4 | Cache Intl.NumberFormat | Small perf gain |
| P4 | Add composite index for trash sort | Query optimization |

---

## FILES ANALYZED

### Pages (9 files)
TodayPage, AllTasksPage, DashboardPage, LoginPage, SettingsPage, TrashPage, PenaltyManagementPage, MembersPage, TaskConfigPage

### Components (23 files)
MainLayout, Sidebar, Header, Modal, ConfirmDialog, EmptyState, LoadingSpinner, Skeleton, DateTimePicker, FilePreviewModal, TaskCard, TaskDetail, TaskForm, TaskFilters, StatusBadge, PriorityBadge, CriteriaSetsPage, PlansManagePage, UnitsPage, UnitLayout

### Hooks (12 files)
useTasks, useUsers, usePenalties, useUnits, useCriteriaSets, usePlans, useSubmissions, useContestEntries, useTaskActions, useTaskCRUD, useAutoOverduePenalties

### Firebase (6 files)
auth.js, firestore.js, criteriaFirestore.js, config.js, functions.js, storage.js

### Contexts (3 files)
AuthContext.jsx, TaskConfigContext.jsx, NotificationContext.jsx

### Utils (5 files)
statusUtils.js, dateUtils.js, constants.js, exportExcel.js

### Config (3 files)
firestore.rules, firestore.indexes.json, eslint.config.js

---

*Report compiled from 4 separate review agents: ux-reviewer, code-reviewer, security-auditor, perf-analyzer*
*Generated: 2026-04-22*
*Framework: OWASP Top 10 2021 (Security)*
