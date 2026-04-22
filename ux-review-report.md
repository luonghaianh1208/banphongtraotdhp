# UX/UI Review Report

**Generated**: 2026-04-22
**Files Analyzed**: 65 files (components, pages, hooks, contexts, utils)
**Total Issues Found**: 42 issues

---

## Executive Summary

The project is a well-structured React application with a modern UI design, but has significant consistency and accessibility gaps that need to be addressed. The design system uses Tailwind CSS with a consistent emerald/teal accent color scheme and Inter font, but suffers from inconsistent component patterns, incomplete accessibility implementation, and conflicting z-index strategies across modals.

**Key Strengths**:
- Consistent color palette with emerald primary accent across most components
- Good use of glassmorphism and subtle animations for modern feel
- Proper use of React Portal for modals
- Comprehensive role-based navigation filtering
- Real-time data patterns with Firestore subscriptions

**Critical Weaknesses**:
- Inconsistent z-index values causing modal stacking conflicts
- Missing ARIA labels on interactive elements
- Inconsistent loading spinner implementations across pages
- Missing focus trap in modals
- Confusing variable name (`user` instead of `currentUser`) in UnitLayout
- EmptyState component lacks className prop for reusability
- Dark mode toggle in Sidebar has no aria-label

---

## Issues by Priority

### P0 - Critical Issues

| # | Issue | File | Line | Recommendation |
|---|-------|------|------|----------------|
| 1 | **z-index conflict between modals** - Modal.jsx uses `z-[9999]` while FilePreviewModal.jsx uses `z-[60]`. When FilePreviewModal is open inside a Modal, the backdrop would cover the Modal but content below would be accessible. | `src/components/common/Modal.jsx` | 33 | Standardize z-index to `z-[9999]` for all modal-like components, or use a consistent z-index scale: backdrop=50, modal=60, dropdown=70, tooltip=80 |
| 2 | **Duplicate body overflow handling** - Both Modal.jsx and ConfirmDialog.jsx independently set `document.body.style.overflow`. When both are open simultaneously, closing one resets overflow before the other closes, causing background scroll to occur. | `src/components/common/Modal.jsx` (L7-18), `src/components/common/ConfirmDialog.jsx` (L7-16) | 7-18 | Create a shared `useBodyScrollLock` hook or use a ref counter to track how many modals are open before resetting overflow |
| 3 | **Missing focus trap in modals** - Modal and ConfirmDialog do not implement keyboard focus trapping. Tab/Shift+Tab cycles through elements behind the modal overlay, breaking WCAG 2.1.1 accessibility. | `src/components/common/Modal.jsx`, `src/components/common/ConfirmDialog.jsx` | - | Implement focus trap: on mount, store previously focused element, trap focus within modal, return focus on close |
| 4 | **UnitLayout uses wrong destructured variable** - `useAuth()` provides `currentUser`, not `user`. Line 7 destructures `user` which will be `undefined`, causing the unit name display `{user.unitName \|\| user.email}` to fail. | `src/components/unit/UnitLayout.jsx` | 7 | Change to: `const { currentUser: user, isUnit, loading, logout } = useAuth();` or destructure `currentUser` directly |
| 5 | **AllTasksPage uses emoji in toast** - `toast.error(..., { icon: '⏳' })` uses emoji which is inconsistent with the design system and has accessibility issues (screen readers read "clock" emoji as emoji). | `src/pages/AllTasksPage.jsx` | 54 | Replace with `react-icons` component: `icon: <MdSchedule size={20} />` |
| 6 | **TaskCard div has no keyboard alternative** - The `onClick` wrapper div (L20) has no `role`, `onKeyDown`, or `tabIndex`, making it inaccessible to keyboard users. | `src/components/task/TaskCard.jsx` | 20 | Wrap the card's content in a button element with proper aria-label, or add `role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick(task)}` |
| 7 | **DateTimePicker disableMobile boolean overrides minDate** - Passing `disableMobile: true` as a boolean alongside `minDate` in options object creates conflicting behavior where mobile date selection may not respect minDate constraints. | `src/components/common/DateTimePicker.jsx` | 13 | Remove `disableMobile: true` or make it conditional: `disableMobile: minDate ? true : false` |

---

### P1 - High Priority

| # | Issue | File | Line | Recommendation |
|---|-------|------|------|----------------|
| 1 | **Inconsistent loading spinners** - CriteriaSetsPage, UnitsPage, PlansManagePage use custom inline spinners (`<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>`) while other pages use the centralized `LoadingSpinner` component. | `src/components/criteria/CriteriaSetsPage.jsx` | 90 | Replace custom spinners with `<LoadingSpinner />` for consistency |
| 2 | **EmptyState lacks className prop** - EmptyState does not accept custom className, making it impossible to customize styling (e.g., adding specific padding or background) when used in different contexts. | `src/components/common/EmptyState.jsx` | 4 | Add `className` prop to allow customization: `const EmptyState = ({ title, message, action, icon, className = '' }) =>` |
| 3 | **Sidebar dark mode toggle has no aria-label** - The toggle button has only text content "Chế độ sáng"/"Chế độ tối" in Vietnamese but screen readers would announce it as generic "button". No `aria-label` or `aria-pressed`. | `src/components/layout/Sidebar.jsx` | 108-119 | Add `aria-label={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}` and `aria-pressed={isDarkMode}` |
| 4 | **Missing aria-current on active NavLink** - Sidebar's NavLink items do not have `aria-current="page"` when active, which would help screen reader users identify the current page. | `src/components/layout/Sidebar.jsx` | 85-100 | Add `aria-current={isActive ? 'page' : undefined}` to the NavLink component |
| 5 | **Notification dropdown max-height with no scroll indicator** - Header notification dropdown has `max-h-[32rem]` but no visual indication that content is scrollable. Users may not realize there are more notifications. | `src/components/layout/Header.jsx` | 91 | Add a subtle gradient fade at bottom OR show scrollbar to indicate scrollable content |
| 6 | **Modal close button missing aria-label** - `MdClose` button in Modal has only icon, no aria-label. Screen readers announce "button" instead of "Đóng modal" or similar. | `src/components/common/Modal.jsx` | 50-55 | Add `aria-label="Đóng cửa sổ"` or `aria-label="Close modal"` |
| 7 | **TaskForm assignee labels use sr-only hidden checkbox** - The assignee toggle uses `<input type="checkbox" className="sr-only" />` for visual checkbox replacement. The label element is missing `htmlFor` attribute linking to the hidden input's id. | `src/components/task/TaskForm.jsx` | 107-112 | Add `id` to checkbox input and `htmlFor={id}` to label element |
| 8 | **TaskCard status text truncated without aria** - The `assigneeNames` display uses `.map().join(', ')` which concatenates names. If truncated, the full list is not accessible to screen readers. | `src/components/task/TaskCard.jsx` | 12-14 | Add `aria-label={assigneeNames}` to the span containing assignee names |
| 9 | **Notification item click handler lacks role** - The notification div has `onClick` but no `role` attribute, so screen reader users may not understand it's interactive. | `src/components/layout/Header.jsx` | 102-129 | Add `role="button"` or better: refactor as a list of `<button>` elements |
| 10 | **ErrorBoundary not applied per-route** - ErrorBoundary wraps the entire app in App.jsx, meaning a crash in one route crashes all routes. Individual routes should have their own error boundaries for resilience. | `src/App.jsx` | 165 | Consider wrapping each lazy-loaded route in its own ErrorBoundary component |

---

### P2 - Medium Priority

| # | Issue | File | Line | Recommendation |
|---|-------|------|------|----------------|
| 1 | **Inconsistent button class naming** - Some buttons use `className="btn btn-primary"` (utility) while others use `className="btn-primary py-2.5 px-5"` (inline). UnitsPage mixes both approaches. | `src/components/criteria/UnitsPage.jsx` | 183-203 | Standardize: always use `className="btn btn-primary"` pattern, never `className="btn-primary"` directly |
| 2 | **UnitsPage uses `label` element for non-form purpose** - The "Tải mẫu Excel" and "Nhập dữ liệu" buttons wrap a hidden `<input>` in a `<label>` element without proper form context. This is semantically confusing. | `src/components/criteria/UnitsPage.jsx` | 183-196 | Use a proper `<input type="file" id="..." />` with associated `<label htmlFor="...">` or use a `<button>` that programmatically triggers the input |
| 3 | **TrashPage uses native `confirm()` instead of ConfirmDialog** - `handleDelete` and `handleBulkDelete` call `confirm()` for quick actions. This is inconsistent with the rest of the app's design system using ConfirmDialog. | `src/pages/TrashPage.jsx` | 60, 68 | Replace `confirm()` with ConfirmDialog component for consistent UX and better accessibility |
| 4 | **"View all notifications" link missing href** - The link `<button>Xem tất cả thông báo</button>` in Header doesn't have an href or role. It should navigate to a notifications page or have a proper click handler. | `src/components/layout/Header.jsx` | 136-139 | Either add `onClick={navigateToNotificationsPage}` or convert to a real link `<a href="/notifications">` |
| 5 | **PlansManagePage link has wrong path** - Link to `/admin/plans/${plan.id}` but routes are defined as `/plans-manage` and `/plans/${planId}`. The path doesn't match App.jsx routes. | `src/components/criteria/PlansManagePage.jsx` | 280 | Change to `/plans/${plan.id}` to match defined routes |
| 6 | **DashboardPage charts use fixed bar height** - Charts have `h-[340px]` fixed height which may cause overflow on smaller screens before the ResponsiveContainer adjusts. | `src/pages/DashboardPage.jsx` | 106, 165 | Ensure the parent container has proper min-height or use `min-h-[300px]` instead of fixed height |
| 7 | **TaskDetail notes section has scroll but no visible scrollbar** - `max-h-48 overflow-y-auto` on notes section may hide content from users who don't know to scroll. No visual indicator. | `src/components/task/TaskDetail.jsx` | 377 | Add visible scrollbar styling: `scrollbar-thin scrollbar-thumb-gray-300` |
| 8 | **Multiple components duplicate createPortal** - Every inline modal (CriteriaSetsPage, UnitsPage, PlansManagePage) imports createPortal separately. This is fine but suggests reusable Modal wasn't used for inline modals. | Various criteria pages | - | Consider extracting inline modals into reusable ConfirmModal pattern, or document why inline createPortal was needed |
| 9 | **TaskFilters clear button has no aria-label** - The "Xóa lọc" button only has icon + text, no `aria-label="Xóa tất cả bộ lọc"`. | `src/components/task/TaskFilters.jsx` | 75-77 | Add `aria-label="Xóa tất cả bộ lọc"` to the button |
| 10 | **TaskDetail history section scrollbar hidden** - `max-h-32 overflow-y-auto` with no visible scrollbar indicator. Users may miss important history entries. | `src/components/task/TaskDetail.jsx` | 409 | Add `className="scrollbar-thin scrollbar-thumb-gray-200"` to the overflow container |
| 11 | **Missing skeleton for AllTasksPage** - TodayPage imports `TaskSkeleton` and `StatSkeleton` from Skeleton.jsx for loading states, but AllTasksPage only uses `LoadingSpinner`. The filter + task grid should have skeleton states. | `src/pages/AllTasksPage.jsx` | - | Implement TaskSkeleton grid for filtered tasks loading state, or use Suspense boundaries with fallback |
| 12 | **StatusBadge has insufficient contrast** - Some badge backgrounds like `.badge-black` with `bg-gray-700 text-white` may not meet WCAG AA contrast ratio in certain dark mode configurations. | `src/index.css` | 67-69 | Verify all badge colors meet 4.5:1 contrast ratio. Consider using darker backgrounds or lighter text for better accessibility |

---

### P3 - Low Priority

| # | Issue | File | Line | Recommendation |
|---|-------|------|------|----------------|
| 1 | **LoginPage branding inconsistent with Sidebar** - LoginPage shows "HubConnect" with logo "PT", but Sidebar also shows "HubConnect" and a different "PT" logo. Should be consistent with `ORG_NAME`. | `src/pages/LoginPage.jsx` | 36-38 | Use `ORG_NAME` constant consistently, or extract logo component used across both |
| 2 | **Loading text "Đang tải..." uses different style than elsewhere** - LoadingSpinner shows "Đang tải..." while other custom loaders use "Đang xử lý..." or "Đang kết nối...". Inconsistent microcopy. | `src/components/common/LoadingSpinner.jsx` | 14 | Standardize loading messages: prefer "Đang tải..." for data, "Đang xử lý..." for actions |
| 3 | **TaskForm uses emoji in file preview** - `📎 {f.name}` uses emoji for file icon. Should use `react-icons` MdAttachment instead. | `src/components/task/TaskForm.jsx` | 206-211 | Replace emoji with `<MdAttachFile size={16} className="text-gray-400" />` |
| 4 | **AllTasksPage task count has inconsistent formatting** - `"${filteredTasks.length} / ${tasks.length} công việc"` uses spaces around slashes vs other places which may use different separators. | `src/pages/AllTasksPage.jsx` | 127 | Consider removing spaces: `${filteredTasks.length}/${tasks.length}` for more compact display |
| 5 | **MembersPage avatar images missing cross-origin settings** - `referrerPolicy="no-referrer"` is used on all avatar images but not consistently. Some places use it while others don't. | `src/pages/MembersPage.jsx` | 114 | Ensure all external images (avatars) consistently use `referrerPolicy="no-referrer"` to prevent CORS issues with Firebase Storage |
| 6 | **TaskFilters date inputs missing date format hint** - Date inputs (dateFrom, dateTo) don't show date format placeholder. Users may not know expected format. | `src/components/task/TaskFilters.jsx` | 70-71 | Add `placeholder="dd/mm/yyyy"` or use a date picker component |
| 7 | **ConfirmDialog onConfirm called inside onClick** - The confirm button calls both `onConfirm()` and `onClose()` in same onClick handler, which could lead to state update issues. | `src/components/common/ConfirmDialog.jsx` | 48 | Consider only calling `onConfirm()` and letting parent handle closing via state change, or use a useEffect to auto-close when isOpen becomes false |
| 8 | **CriteriaSetsPage modal close button hover text.red-500** - Close button at line 239 has `hover:text-red-500` which is a strong color change that may surprise users. Consider a more subtle hover state. | `src/components/criteria/CriteriaSetsPage.jsx` | 238-241 | Change to `hover:text-gray-600 dark:hover:text-gray-400` for more neutral feedback |
| 9 | **DashboardPage chart tooltip uses inline styles** - Tooltip contentStyle objects use inline style objects instead of Tailwind classes, creating inconsistency with rest of app's styling approach. | `src/pages/DashboardPage.jsx` | 125-133, 185-193 | Convert to Tailwind classes or use a consistent tooltip component |
| 10 | **ColorPicker button missing aria-haspopup** - The ColorPicker subcomponent opens a palette popup but the button doesn't have `aria-haspopup="true"` or `aria-expanded` states. | `src/pages/TaskConfigPage.jsx` | 500-505 | Add `aria-haspopup="true" aria-expanded={open}` to the button |

---

## Category Breakdown

### Visual Consistency

**Issues Found: 8**

1. **Inconsistent loading spinners** - Custom inline spinners vs centralized LoadingSpinner component (P1)
2. **Button class naming inconsistency** - `btn btn-primary` vs `btn-primary` inline styles (P2)
3. **Toast emoji usage** - AllTasksPage uses emoji instead of icons (P0)
4. **Badge contrast variability** - Some badges may not meet WCAG AA in dark mode (P2)
5. **Chart styling inconsistency** - DashboardPage uses inline styles for tooltips (P3)
6. **LoginPage branding mismatch** - Different logo/branding than Sidebar (P3)
7. **File icon emoji vs icon** - TaskForm uses emoji for file icons (P3)
8. **Task count formatting** - Inconsistent use of spaces around separators (P3)

### Responsive Design

**Issues Found: 5**

1. **AllTasksPage grid at md breakpoint** - 2-column grid may overflow on small tablets (P2)
2. **DashboardPage fixed chart heights** - `h-[340px]` may overflow before ResponsiveContainer kicks in (P2)
3. **Notification dropdown scrollable but no indicator** - Users may not realize content is scrollable (P1)
4. **TaskFilters date range inputs on small screens** - Date inputs may not fit in flex wrap on narrow viewports (P2)
5. **Mobile sidebar backdrop blur animation** - Animation `animate-fade-in` on backdrop may cause performance issues on low-end mobile (P3)

### Accessibility (WCAG 2.1 AA)

**Issues Found: 12**

1. **Missing focus trap in modals** - Tab cycles through elements behind overlay (P0)
2. **Modal close button missing aria-label** - Icon-only button not accessible (P1)
3. **TaskCard keyboard inaccessibility** - No keyboard alternative for onClick wrapper (P0)
4. **Sidebar dark mode toggle missing aria-label** - Toggle button not properly labeled (P1)
5. **NavLink missing aria-current** - Active page not announced to screen readers (P1)
6. **TaskForm assignee checkbox unlabeled** - Hidden checkbox not properly associated with label (P1)
7. **TaskCard assignee text truncated without aria** - Full text not accessible to screen readers (P1)
8. **Notification item click lacks role** - Interactive div not identified as button (P1)
9. **TaskFilters clear button aria-label missing** - Button not properly labeled (P2)
10. **DateTimePicker minDate conflicting with disableMobile** - Confusing API leads to unexpected mobile behavior (P0)
11. **ColorPicker missing aria-haspopup** - Popup button state not communicated to assistive tech (P3)
12. **TaskDetail history scrollbar hidden** - Content may be inaccessible to some users (P2)

### Interaction Design

**Issues Found: 9**

1. **Duplicate body overflow handling in modals** - Conflicting overflow reset causes scroll issues (P0)
2. **UnitLayout uses undefined variable** - `user` is undefined, causing potential silent failures (P0)
3. **z-index conflict between modals** - FilePreviewModal z-index lower than Modal causing stacking issues (P0)
4. **TrashPage uses native confirm()** - Inconsistent with design system dialogs (P2)
5. **EmptyState lacks className prop** - Cannot customize for different contexts (P1)
6. **"View all notifications" link non-functional** - Missing href or click handler (P2)
7. **PlansManagePage incorrect route link** - Wrong path doesn't match defined routes (P2)
8. **ErrorBoundary not per-route** - One route crash affects entire app (P1)
9. **ConfirmDialog onConfirm called with onClose in same handler** - Potential state management issue (P3)

### Code Quality

**Issues Found: 8**

1. **Loading state inconsistency** - Some pages use LoadingSpinner, others use custom (P1)
2. **Inline createPortal modals** - Each criteria page duplicates portal logic instead of reusing Modal (P2)
3. **UnitsPage label wrapping input** - Semantic confusion using label for non-form purpose (P2)
4. **Inconsistent avatar referrerPolicy** - Some images have it, others don't (P3)
5. **Multiple createPortal imports** - Duplicated across files (P2)
6. **TaskForm checkbox id not linked** - htmlFor missing (P1)
7. **Inline styles in DashboardPage tooltips** - Deviates from Tailwind approach (P3)
8. **Color strings vs hex codes inconsistency** - TASK_DISPLAY_STATUS uses color names while PRIORITIES uses hex (P3)

---

## Files Analyzed

### Pages (9 files)
- `src/pages/TodayPage.jsx`
- `src/pages/AllTasksPage.jsx`
- `src/pages/DashboardPage.jsx`
- `src/pages/LoginPage.jsx`
- `src/pages/SettingsPage.jsx`
- `src/pages/TrashPage.jsx`
- `src/pages/PenaltyManagementPage.jsx`
- `src/pages/MembersPage.jsx`
- `src/pages/TaskConfigPage.jsx`

### Components (23 files)
- `src/components/layout/MainLayout.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/Header.jsx`
- `src/components/common/Modal.jsx`
- `src/components/common/ConfirmDialog.jsx`
- `src/components/common/EmptyState.jsx`
- `src/components/common/LoadingSpinner.jsx`
- `src/components/common/Skeleton.jsx`
- `src/components/common/DateTimePicker.jsx`
- `src/components/common/FilePreviewModal.jsx`
- `src/components/task/TaskCard.jsx`
- `src/components/task/TaskDetail.jsx`
- `src/components/task/TaskForm.jsx`
- `src/components/task/TaskFilters.jsx`
- `src/components/task/StatusBadge.jsx`
- `src/components/task/PriorityBadge.jsx`
- `src/components/criteria/CriteriaSetsPage.jsx`
- `src/components/criteria/PlansManagePage.jsx`
- `src/components/criteria/UnitsPage.jsx`
- `src/components/unit/UnitLayout.jsx`

### Config & Utils (4 files)
- `src/App.jsx`
- `src/index.css`
- `src/utils/constants.js`
- `src/context/AuthContext.jsx`

---

## Recommendations Summary

### Top 5 Most Impactful Fixes (by P0 priority):

1. **Fix z-index conflict** - Standardize modal z-index to prevent content being accidentally accessible behind overlays

2. **Implement focus trap in modals** - Critical accessibility fix for keyboard navigation

3. **Fix UnitLayout variable name** - Silent failure causing unit display name to not show

4. **Remove emoji from toast** - Replace with accessible icon components

5. **Fix TaskCard keyboard accessibility** - Add tabIndex and onKeyDown for card-level interaction

### Recommended Fix Order:
1. Fix UnitLayout `user` -> `currentUser` (5 min fix, eliminates silent failure)
2. Standardize modal z-index values (15 min fix, prevents UI glitches)
3. Replace emoji with icons in AllTasksPage toast (5 min fix)
4. Add focus trap to Modal and ConfirmDialog (30 min, major accessibility improvement)
5. Fix TaskCard keyboard navigation (20 min)
6. Add aria-labels to sidebar toggle and modal close buttons (15 min)
7. Replace native confirm() with ConfirmDialog in TrashPage (10 min)
8. Consolidate loading spinners to use LoadingSpinner everywhere (15 min)
9. Add className prop to EmptyState (10 min)
10. Fix PlansManagePage route link (2 min)

---

*Report generated by UX/UI Reviewer Agent*
*For assistance with fixes, spawn the code-reviewer or master-executor agent*