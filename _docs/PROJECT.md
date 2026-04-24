# Project Overview: HubConnect 

## Tổng Quan
- **Tên dự án**: HubConnect (Quản lý công việc và Tiêu chí đánh giá)
- **Mục tiêu**: Hệ thống theo dõi công việc nội bộ và gửi/đánh giá tiêu chí cho các đơn vị.
- **Đối tượng sử dụng**:
  - **Admin / Manager**: Giao việc, giao bộ tiêu chí, chấm điểm, quản lý người dùng và cấu hình phạt.
  - **Unit**: Nhận dự án/tiêu chí, nộp bài báo cáo thành tích/chứng minh, nộp kế hoạch.
  - **Member**: Nhận và báo cáo tiến độ công việc được giao.

## Tech Stack (package.json)
- **Core**: React `^19.2.4`, React DOM `^19.2.4`
- **Build tool**: Vite `^8.0.4`
- **Routing**: `react-router-dom` `^7.14.0`
- **Database & Auth**: Firebase `^12.12.0` (Firestore, Storage, Auth, Functions)
- **Styling**: Tailwind CSS `^3.4.19`, Autoprefixer `^10.4.27`, PostCSS `^8.5.9`
- **UI Libraries**: 
  - `react-icons` `^5.6.0` (Icons)
  - `react-hot-toast` `^2.6.0` (Notifications)
  - `flatpickr` / `react-flatpickr` (Date/Time picker)
  - `recharts` `^3.8.1` (Charts)
- **Utilities**:
  - `date-fns` `^4.1.0` (Date manipulation)
  - `jspdf` & `jspdf-autotable` (PDF Export)
  - `xlsx` `^0.18.5` (Excel Export)

## Biến môi trường (.env)
Dự án sử dụng Firebase, nên cần thiết lập các biến sau dựa vào `.env` hoặc cấu hình `src/firebase/config.js`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Lệnh Chạy Cục Bộ (NPM Scripts)
- **`npm run dev`**: Khởi chạy server development (Vite).
- **`npm run build`**: Build ứng dụng cho môi trường production.
- **`npm run preview`**: Chạy thử bản build production local.
- **`npm run lint`**: Chạy ESLint để kiểm tra code quality.

## Cây Thư Mục (Code structure)
```text
src/
├── components/          # Reusable UI components
│   ├── common/          # Modals, Spinners, Dialogs, etc
│   ├── criteria/        # Criteria management features (Sets, Evidence)
│   ├── layout/          # Header, Sidebar, MainLayout
│   ├── task/            # Task cards, forms, badges
│   └── unit/            # Forms and pages specific to "unit" role
├── context/             # Global React Contexts
│   ├── AuthContext.jsx  # Handles user auth & role logic
│   ├── NotificationContext.jsx # Inbox / alerts 
│   └── TaskConfigContext.jsx   # Global dynamic settings
├── firebase/            # Firebase Config & Wrappers (Auth, Firestore, Storage)
├── functions/           # Cloud Functions (Backend atomicity & logic)
│   └── index.js         # Core logic: initFirstAdmin, publishPeriodResults, etc.
├── hooks/               # Custom React hooks referencing Firestore data
├── pages/               # Main route pages (Dashboard, Login, Tasks, Settings, etc)
└── utils/               # Helper functions (dates, statuses, exports, errors)
```

## Các Quyết định Kỹ thuật (Data Integrity & Security)
- **Atomicity**: Sử dụng Firestore Transactions trong Cloud Functions (`initFirstAdmin`, `createPenalty`) để tránh race conditions.
- **Idempotency**: Sử dụng Composite Document IDs (`criteriaSetId_unitId`) cho `criteriaSubmissions` để tránh tạo bản trùng khi lưu nháp nhanh.
- **Server-side Logic**: Các phép tính điểm tổng (`publishPeriodResults`) được thực hiện tại backend (Cloud Functions) để đảm bảo tính chính xác và không bị can thiệp bởi client.
- **Security Rules**: Phân quyền nghiêm ngặt theo role (`isUnit`, `isAdminOrManager`) trực tiếp tại `firestore.rules`.


## Các file KHÔNG được sửa tùy tiện khi làm tính năng mới
- `src/firebase/config.js`: Setup core, tránh đụng vào nếu không thay đổi Firebase instance.
- `firestore.rules`: Luật bảo mật Firestore (nếu có update cần phải check kĩ security trước khi push).
- Configuration cơ bản của Tailwind / Vite (`tailwind.config.js`, `vite.config.js`).
