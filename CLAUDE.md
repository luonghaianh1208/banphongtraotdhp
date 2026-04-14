# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vietnamese-language internal task management app for "Ban Phong Trào Thành Đoàn Hải Phòng" (a youth organization). Built for small teams (5-7 people) with role-based access control and real-time collaboration.

## Commands

```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build → /dist
npm run lint       # ESLint
npm run preview    # Preview production build

# Firebase
firebase deploy --only firestore:rules    # Deploy security rules
firebase deploy --only storage            # Deploy storage rules
firebase deploy --only functions          # Deploy Cloud Functions

# Netlify deployment
npx netlify deploy --prod --dir=dist
```

## Architecture

**Stack:** React 19 + Vite + TailwindCSS v3 + Firebase (Auth, Firestore, Storage, Functions)

**Data flow:** Firestore `onSnapshot` listeners → Context providers → Custom hooks → Components

### Three React Contexts
- **AuthContext** — Auth state, user profile (with realtime listener), role/permission checks (`isAdmin`, `isPending`, `canManageTasks`, etc.)
- **TaskConfigContext** — Realtime categories & priorities from `config` collection, provides `getCategoryById`/`getPriorityById`
- **NotificationContext** — User notifications with unread count

### Role System (3 roles)
- `admin` (Tổ trưởng) — Full access: approve tasks, manage users, trash, config
- `manager` (Phụ trách) — Create/assign tasks, view dashboard
- `member` (Nhân viên) — View only own assigned tasks

### Approval Flow for New Users
New Google sign-in → profile created with `status: 'pending'` → shown PendingPage → admin approves in MembersPage → realtime listener auto-redirects user to main app.

### Firestore Collections
- `tasks` — Soft-delete via `isDeleted` flag (not `deleteDoc`). Fields: `assignees[]`, `priority`, `category`, `notes[]`, `editHistory[]`, `attachments[]`
- `users` — `role`, `status` (pending/approved), `isActive`, `avatar`
- `config/categories` and `config/priorities` — Admin-configurable with colors
- `notifications` — Per-user, `userId` + `isRead`

### Key Patterns
- **Soft-delete:** Tasks use `isDeleted: true` instead of hard delete. All queries must filter `!isDeleted`
- **`array-contains` for member tasks:** `subscribeToMyTasks` uses `where('assignees', 'array-contains', userId)` — Firestore limits this to one `array-contains` per query, so `isDeleted` is filtered client-side
- **Client-server fallback:** `useTaskActions.js` tries Cloud Functions first, falls back to direct Firestore `updateDoc` if CF not deployed
- **Realtime everywhere:** All data subscriptions use `onSnapshot` with error callbacks, never one-time `getDocs` for display data
- **`writeBatch`** for bulk operations (bulk delete, bulk restore, mark-all-read)

### Route Protection (App.jsx)
`ProtectedRoute` checks: loading → not authenticated → not yet profiled → `isPending` redirect → role-based access. `PendingRoute` only renders for pending users.

## Conventions

- **All UI text in Vietnamese.** Comments also in Vietnamese.
- **`uploadFile` returns an object** `{ name, url, path, type, size, uploadedBy }` — use `result.url` when you need the URL string
- Firestore security rules require admin role for writes to `config`, `tasks` delete, and user management
- Composite indexes defined in `firestore.indexes.json` — deploy with `firebase deploy --only firestore:indexes`
- Storage rules enforce 10MB max, images/PDF/Word only
