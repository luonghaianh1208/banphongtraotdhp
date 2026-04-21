# 📋 Quản Lý Công Việc — Ban Phong Trào Thành Đoàn Hải Phòng

Ứng dụng web quản lý công việc nội bộ cho tổ nhóm 5-7 người, hỗ trợ theo dõi task realtime, phân quyền 3 cấp, gửi email nhắc deadline, xuất báo cáo.

## 🚀 Tech Stack

- **Frontend**: React 19 + Vite + TailwindCSS v3
- **Database & Auth**: Firebase (Firestore + Authentication)
- **File Storage**: Firebase Storage
- **Cloud Functions**: Node.js 18 (Nodemailer cho email)
- **Charts**: Recharts
- **Export**: SheetJS (xlsx) + jsPDF (PDF)
- **Deploy**: Netlify

## 📦 Cài đặt

### 1. Clone project

```bash
git clone <repository-url>
cd app-task-list
npm install
```

### 2. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới
3. **Upgrade lên Blaze plan** (cần cho Cloud Functions + Storage)
   - Thêm payment method (thẻ Visa/Mastercard)
   - ⚠️ Team 5-7 người **vẫn trong hạn mức miễn phí**
4. Thiết lập **Budget Alert** (khuyến nghị $5/tháng):
   - Google Cloud Console → Billing → Budgets & alerts → Create budget

### 3. Bật các dịch vụ Firebase

#### Authentication
- Firebase Console → Authentication → Sign-in method
- Bật **Email/Password**

#### Firestore Database
- Firebase Console → Firestore → Create database
- Chọn location gần nhất (asia-southeast1 cho Việt Nam)
- Start in **production mode**

#### Storage
- Firebase Console → Storage → Get started

### 4. Tạo Web App

- Firebase Console → Project Settings → Your apps → Add app → Web
- Copy config vào file `.env`

### 5. Cấu hình biến môi trường

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với config từ Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaxxxxx
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
VITE_ORG_NAME="Ban Phong Trào Thành Đoàn Hải Phòng"
```

### 6. Deploy Firestore Rules

```bash
firebase login
firebase use --add  # chọn project
firebase deploy --only firestore:rules,storage
```

### 7. Seed tài khoản Tổ trưởng (Admin)

Vào Firebase Console → Authentication → Add user → nhập email/password.

Sau đó vào Firestore → Tạo collection `users` → Thêm document:

```
Document ID: <uid từ Auth>
Fields:
  email: "admin@example.com"
  displayName: "Tổ Trưởng"
  role: "admin"
  isActive: true
  createdAt: <server timestamp>
  updatedAt: <server timestamp>
```

### 8. Deploy Cloud Functions (tuỳ chọn)

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

> Nếu chưa deploy Cloud Functions, app vẫn hoạt động bình thường — các thao tác admin sẽ fallback sang client-side.

## 🖥️ Chạy local

```bash
npm run dev
```

Mở http://localhost:5173

## 🌐 Deploy lên Netlify

### Cách 1: CLI

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

### Cách 2: Git-based deploy

1. Push code lên GitHub
2. Netlify → New site from Git → chọn repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Thêm Environment Variables trên Netlify (giống `.env`)

## 👥 Phân quyền

| Vai trò | Tạo task | Giao task | Duyệt xong | Quản lý thành viên | Dashboard |
|---------|:---:|:---:|:---:|:---:|:---:|
| **Tổ trưởng** (admin) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Phụ trách** (manager) | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Nhân viên** (member) | ✅ (cho bản thân) | ❌ | ❌ | ❌ | ❌ |

## 🚦 Trạng thái công việc

| Badge | Trạng thái | Điều kiện |
|-------|-----------|-----------|
| 🟢 | Chưa đến hạn | Còn > 3 ngày |
| 🟡 | Gần đến hạn | Còn 1-3 ngày |
| 🔴 | Cần hoàn thành gấp | Còn < 24 giờ |
| 🔴 | Cần hoàn thành gấp | Còn < 24 giờ |
| ⚫ | Quá hạn | Đã qua deadline |
| 🔵 | Gia hạn | Đã gia hạn deadline |
| ✅ | Hoàn thành | Tổ trưởng đã duyệt |

## 📊 Module Chỉ tiêu & Kế hoạch (Mới)

Bản cập nhật v2 hỗ trợ cấp Cơ sở nộp và quản lý Chỉ tiêu/Kế hoạch:
- **Cơ sở (Unit)**: Đăng nhập tại `/login` bằng tài khoản Unit. Nộp minh chứng và điểm số tự chấm dựa trên các Bộ Tiêu Chí (Criteria Sets) hoặc nộp danh sách Kế Hoạch/Hội Thi.
- **Nội bộ (Admin/Manager)**:
  - Cấu hình khung điểm Bộ Tiêu Chí, mở đợt chấm điểm.
  - Quản trị Kế hoạch & Hồ sơ dự thi từ các trường/liên đội gửi lên.
  - Chấm điểm thẩm định.

## 📁 Cấu trúc dự án

```
src/
├── components/         # UI components tái sử dụng
│   ├── layout/         # Sidebar, Header, MainLayout
│   ├── task/           # TaskCard, TaskForm, TaskDetail
│   └── common/         # Modal, ConfirmDialog, EmptyState
├── pages/              # LoginPage, TodayPage, AllTasksPage, Dashboard, Members, Settings
├── hooks/              # useTasks, useUsers (realtime listeners)
├── firebase/           # Config, Auth, Firestore, Storage, Functions helpers
├── utils/              # dateUtils, statusUtils, exportExcel, exportPdf, constants
├── context/            # AuthContext, NotificationContext
└── App.jsx             # Root with routing

functions/              # Firebase Cloud Functions
├── index.js            # 6 functions: createUser, setRole, approveTask, extendDeadline, disableUser, sendReminders
└── package.json
```

## 📧 Cấu hình Email nhắc deadline

Nếu muốn bật email tự động:

1. Tạo App Password cho Gmail: Google Account → Security → App passwords
2. Set env cho Cloud Functions:

```bash
firebase functions:config:set smtp.email="your@gmail.com" smtp.password="your-app-password"
```

3. Deploy functions: `firebase deploy --only functions`

## © 2026 Ban Phong Trào Thành Đoàn Hải Phòng
