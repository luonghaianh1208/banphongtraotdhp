# UX/UI Review Report

**Generated:** 2026-04-22
**Files Analyzed:** 27
**Total Issues Found:** 11

## Executive Summary

The codebase is well-structured with a consistent emerald-based design system, proper dark mode support, and good loading states. However, there are notable UX issues: form submissions rely on browser `alert()` instead of toast feedback, accessibility needs improvement for screen readers, and some responsive edge cases exist.

## Issues by Priority

### P1 - High Priority

| # | Issue | File | Line | Recommendation |
|---|-------|------|------|----------------|
| 1 | Form submission uses `alert()` instead of toast feedback | PlanDetailPage.jsx | 39 | Replace `alert()` with `toast.success()/toast.error()` |
| 2 | Form submission uses `alert()` instead of toast feedback | UnitSubmitPage.jsx | 94, 120, 127 | Replace all alert() with toast notifications |
| 3 | Form submission uses `alert()` instead of toast feedback | CriteriaSetsPage.jsx | 52, 63, 73 | Replace with toast for consistency |
| 4 | File upload error uses `alert()` | EvidenceUpload.jsx | 49 | Replace with toast |
| 5 | Missing `aria-label` on sidebar nav links with only icons | Sidebar.jsx | 91 | Add `aria-label={item.label}` to NavLink |

### P2 - Medium Priority

| # | Issue | File | Line | Recommendation |
|---|-------|------|------|----------------|
| 6 | No screen reader text for notification empty state | Header.jsx | 93 | Add `aria-live="polite"` or role="status" to empty state container |
| 7 | Loading states use basic spinners instead of Skeleton component | CriteriaSetsPage.jsx | 95 | Replace spinner with `<TaskSkeleton>` for better perceived performance |
| 8 | Missing `aria-describedby` on number input with unit suffix | ConditionRow.jsx | 51-62 | Add `aria-label` to input describing "điểm" unit |
| 9 | Notification dropdown toggle lacks `aria-expanded` and `aria-haspopup` | Header.jsx | 57 | Add attributes for screen reader accessibility |

### P3 - Low Priority

| # | Issue | File | Line | Recommendation |
|---|-------|------|------|----------------|
| 10 | Long unit name in Sidebar may overflow | Sidebar.jsx | 72 | `truncate` class already applied but column width may still cause issues |
| 11 | Logout button uses color alone to indicate danger action | Sidebar.jsx | 139 | Add `aria-label="Đăng xuất"` for screen readers |

## Category Breakdown

### Visual Consistency
- Color palette: Emerald primary (primary-600 for actions) is consistent across all components
- Typography: Inter font, consistent font weights (black/bold for headings)
- Spacing: Tailwind spacing scale used consistently
- Border radius: `rounded-2xl` for cards, `rounded-xl` for buttons/inputs
- Dark mode: Properly implemented with `dark:` prefixes

### Responsive Design
- Tables have `overflow-x-auto` preventing horizontal scroll issues (CriteriaOverviewPage line 101)
- Grid layouts use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` pattern correctly
- Mobile sidebar toggle exists with proper `lg:hidden` breakpoint

### Accessibility
- Custom focus states defined in index.css lines 219-229 (`focus-visible`)
- Reduced motion preference respected (index.css lines 204-216)
- Image elements have `referrerPolicy="no-referrer"` (correct for external avatars)
- **Issues**: Missing ARIA labels on nav items, notification button lacks expanded state

### Interaction Design
- Hover states on cards: `hover:shadow-2xl hover:scale-[1.01]` (TaskCard line 23)
- Active states: `active:scale-[0.98]` on buttons
- Loading spinners exist but inconsistent use of Skeleton component
- Toast configured in App.jsx but not used for form feedback

### Empty States
- CriteriaSetsPage (line 216-226): Good empty state with icon, text, and CTA button
- UnitSubmissionsList (line 97-108): Good empty state with helpful message
- Header notification dropdown (line 92-98): Has empty state but needs ARIA

## Files Analyzed

- src/App.jsx
- src/index.css
- src/pages/LoginPage.jsx
- src/pages/DashboardPage.jsx (referenced, not analyzed in detail)
- src/pages/TodayPage.jsx (referenced, not analyzed in detail)
- src/components/layout/Sidebar.jsx
- src/components/layout/Header.jsx
- src/components/layout/MainLayout.jsx
- src/components/criteria/CriteriaSetsPage.jsx
- src/components/criteria/CriteriaOverviewPage.jsx
- src/components/criteria/CriteriaDetailPage.jsx (referenced)
- src/components/criteria/PlanDetailPage.jsx
- src/components/criteria/PlansManagePage.jsx (referenced)
- src/components/criteria/PeriodsManagePage.jsx (referenced)
- src/components/criteria/UnitsPage.jsx (referenced)
- src/components/criteria/ConditionRow.jsx
- src/components/criteria/EvidenceUpload.jsx
- src/components/criteria/GradeInputCard.jsx (referenced)
- src/components/unit/UnitDashboard.jsx
- src/components/unit/UnitSubmissionsList.jsx
- src/components/unit/UnitSubmitPage.jsx
- src/components/unit/UnitLayout.jsx (referenced)
- src/components/task/TaskCard.jsx
- src/components/task/StatusBadge.jsx (referenced)
- src/components/common/Skeleton.jsx
- tailwind.config.js

## Recommendations Summary

1. **Replace all alert() calls with toast notifications** — Currently using browser alerts for form feedback which breaks UX flow. Use `toast.success()` and `toast.error()` from react-hot-toast.

2. **Add ARIA labels to sidebar navigation** — Screen readers cannot interpret icon-only nav items without labels.

3. **Consolidate loading states** — Use the existing Skeleton component (TaskSkeleton, StatSkeleton) instead of basic spinners for better perceived performance.

4. **Add ARIA attributes to notification dropdown** — `aria-expanded`, `aria-haspopup`, and `aria-label` on the notification bell button.

5. **Fix empty state accessibility** — Add `role="status"` or `aria-live` to notification empty state div.