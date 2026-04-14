# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) or any AI assistant when working with code in this repository.

## 1. Project Overview

**App Name:** Quản lý công việc Ban Phong Trào (Thành Đoàn Hải Phòng)
**URL:** https://banphongtraotdhp.netlify.app
**Purpose:** Internal task management application built specifically for small teams (5-7 people) with strict role-based access control, real-time collaboration, notification, and penalty tracking mechanisms.
**Primary Language:** Vietnamese for UI and comments. Code logic in English.

## 2. Tech Stack

- **Frontend:** React 19 + Vite
- **Styling:** TailwindCSS v3/v4 + React Icons (`react-icons/md`). Custom CSS animations in `index.css`.
- **Backend / BaaS:** Firebase (Authentication, Firestore, Storage)
- **Hosting:** Netlify (using `npx netlify deploy --prod` command to deploy `/dist`)

## 3. Architecture & Data Flow

**Data flow:** Firestore `onSnapshot` listeners → Context Providers → Custom Hooks → Presentation Components.
All real-time subscriptions use `onSnapshot` with error callbacks. No one-time `getDocs` for reactive display data.

### React Contexts
- **`AuthContext`**: Manages auth state, user profile syncing, and role/permission helpers (`isAdmin`, `isManager`, `isPending`, etc.).
- **`TaskConfigContext`**: Realtime settings for categories and priorities config collection.
- **`NotificationContext`**: Syncs user notifications in real-time. Exposes unread counts, `markRead`, `markUnread`, `markAllRead`.

### Firestore Collections & Structure
- `users`: User profiles with `role`, `status` (pending/approved), `isActive`.
- `tasks`: Core objects. Uses soft-delete (`isDeleted: true`). Fields: `title`, `deadline`, `assignees[]`, `category` (from config), `attachments[]`, `priority`, `isCompleted`, `isReminded`.
- `notifications`: Personal notification feed. Required fields: `userId`, `title`, `message`, `type` (info/urgent/success/warning), `isRead`, `taskId` (optional), `createdAt`.
- `penalties`: Tracks financial penalties (tiền phạt). Fields: `userId`, `taskId`, `amount`, `reason`, `isPaid`, `createdAt`.
- `config/categories` & `config/priorities`: App-wide configuration.

### Route Protection (`App.jsx`)
- New users signing in via Google get `status: 'pending'` and are redirected to `PendingPage`.
- Admins explicitly "Approve" them from `MembersPage`, changing status to `approved`, which auto-redirects them into the main app via `onSnapshot`.
- Route guards enforce Role-Based Access Control (RBAC).

## 4. Features & Workflows

### Role System (3 Tiers)
1. **`admin` (Tổ trưởng):** Ultimate control. Can create/delete/approve tasks, remind members, create and manage financial penalties, manage users and roles, and edit configs.
2. **`manager` (Phụ trách):** Can create tasks and assign them. Can view dashboards but cannot approve users or tasks.
3. **`member` (Nhân viên):** Can only view and interact with tasks assigned to them. Can view personal fines, mark tasks as "Ready for Review" (Xin duyệt) or Ask for Extensions (Xin gia hạn).

### Notification Engine
- **Facebook-style UI:** A top-nav bell with a red badge. Dropdown lists notifications. Hovering allows toggling Read/Unread via `markUnread` / `markRead` small circular buttons.
- **Automated Triggers:** 
  - Assignment: When assigned a task.
  - Reminders: When an Admin reminds the user (`handleRemindTask`).
  - Approval: When a task is marked `isCompleted: true`.
  - Penalties: When a penalty is issued to the user.

### Feature Specifics
- **Urgent Reminder (Nhắc việc):** Admins can click "Nhắc việc". This does **not** alter the task's actual priority. Instead, it sets `isReminded: true` on the task. The UI picks this up in `TaskCard.jsx` and applies a custom `animate-blink-border` to visually flash the card with a red border. Also blasts an urgent notification.
- **Penalty Tracking (Quản lý Phạt):** A dashboard (`PenaltyManagementPage`) tracks which users were fined, for what task, and whether they paid `isPaid: true/false`. Clicking a penalty opens the task modal directly. Only Admin can issue fines.
- **Task Approval:** Task completion requires two steps. Member finishes work, Admin hits "Duyệt xong" (`handleApproveTask`). 

## 5. Development Rules & Conventions

1. **Language:** Always stick strictly to Vietnamese for all End-User UI strings, error notifications, toasts, and logic comments. Avoid mixing English in the UI.
2. **Soft Deletes:** `tasks` collection relies on `isDeleted: true`. Never use `deleteDoc` for tasks. All fetch queries filter `!isDeleted`.
3. **Array Queries:** `subscribeToMyTasks` uses `where('assignees', 'array-contains', userId)`. Firestore allows only one array-contains per query. `isDeleted` must therefore be filtered Client-Side.
4. **Tooling / Builds:**
   - Use `npm run dev` to test locally.
   - Run `npm run build` prior to any deployment.
   - Use `npx netlify deploy --prod` directly from the CLI to deploy to Production.
   - Deploy tools like indexes and rules explicitly: `firebase deploy --only firestore:rules` or `firebase deploy --only firestore:indexes`
5. **UI Consistency:** Rely heavily on existing Tailwind utilities. Stick to the design language: white spaces, `card` classes, subtle borders, and color shades from the configured palette (`primary-100` to `primary-700`).

## 6. How to Extend
- Any new features must ensure rigorous Firestore Rules verification (`firestore.rules`).
- Always add matching data to Composite Indexes for compound ordering/filtering if a new query requires it (`firestore.indexes.json`).
- Keep `TaskDetail` modal self-sufficient, capable of opening straight from a `taskId` (as done in Penalty Management).
