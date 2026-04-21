# PROMPT XÂY DỰNG MODULE QUẢN LÝ CHỈ TIÊU & KẾ HOẠCH
## Tích hợp vào dự án `banphongtraotdhp` hiện có

---

## 🎯 BỐI CẢNH DỰ ÁN

Dự án hiện tại đã có sẵn các thành phần sau, **KHÔNG được thay đổi**:

- **Stack**: React + Vite + TailwindCSS + Firebase (Firestore, Auth, Storage)
- **Auth**: `src/context/AuthContext.jsx` — quản lý role: `admin` | `manager` | `member`
- **Firestore helpers**: `src/firebase/firestore.js` — dùng `onSnapshot` realtime
- **Routing**: `src/App.jsx` — có `ProtectedRoute`, `PublicRoute`, `PendingRoute`
- **Layout**: `src/components/layout/Sidebar.jsx` — đọc `NAV_ITEMS` từ `src/utils/constants.js`
- **Cloud Functions**: `functions/index.js` — có sẵn `createUser`, `setUserRole`
- **Firestore Rules**: `firestore.rules` — có sẵn rules cho `users`, `tasks`, `penalties`, `config`
- **Constants**: `src/utils/constants.js` — có `ROLES`, `NAV_ITEMS`, `ORG_NAME`

Nhiệm vụ: **Tích hợp thêm 2 module mới** vào webapp hiện tại mà không ảnh hưởng code cũ:
1. **Module Chỉ tiêu** — Thành đoàn tạo bộ tiêu chí, các đơn vị cấp dưới nộp minh chứng + tự chấm điểm, Thành đoàn chấm lại
2. **Module Kế hoạch** — Thành đoàn đăng kế hoạch/thông báo/cuộc thi, đơn vị nhận thông báo và nộp hồ sơ dự thi

---

## 👥 NHÓM NGƯỜI DÙNG MỚI: ĐƠN VỊ CẤP DƯỚI

### Role mới: `unit`
Thêm role `unit` vào hệ thống. Tài khoản `unit` đại diện cho 1 đơn vị Đoàn cơ sở (xã/phường/đặc khu).

### Thay đổi trong `src/utils/constants.js`
```js
// Thêm vào ROLES:
unit: { label: 'Đơn vị cơ sở', color: 'teal' },

// Thêm NAV_ITEMS cho module mới (nội bộ):
{ path: '/criteria', icon: 'MdFactCheck', label: 'Chỉ tiêu đơn vị', roles: ['admin', 'manager', 'member'] },
{ path: '/plans', icon: 'MdArticle', label: 'Kế hoạch & Thông báo', roles: ['admin', 'manager', 'member'] },
{ path: '/units', icon: 'MdCorporateFare', label: 'Quản lý đơn vị', roles: ['admin'] },
```

### Thay đổi trong `src/context/AuthContext.jsx`
- Sau khi đăng nhập, nếu `role === 'unit'`:
  - Đọc thông tin từ collection `units` (thay vì `users`)
  - Redirect sang `/unit` thay vì `/`
- Thêm vào context value: `isUnit`, `unitProfile`
- Giữ nguyên toàn bộ logic hiện tại cho các role khác

### Thay đổi trong `src/App.jsx`
```jsx
// Thêm UnitRoute — chỉ cho role='unit' truy cập
const UnitRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userProfile?.role !== 'unit') return <Navigate to="/" replace />;
  return children;
};

// Thêm các route mới:
// --- Giao diện đơn vị cấp dưới ---
<Route path="/unit" element={<UnitRoute><UnitLayout /></UnitRoute>}>
  <Route index element={<UnitDashboard />} />
  <Route path="submit/:periodId" element={<UnitSubmitPage />} />
  <Route path="results/:periodId" element={<UnitResultsPage />} />
  <Route path="plans" element={<UnitPlansPage />} />
  <Route path="plans/:planId" element={<UnitPlanDetailPage />} />
  <Route path="plans/:planId/apply" element={<UnitApplyPage />} />
  <Route path="settings" element={<UnitSettingsPage />} />
</Route>

// --- Giao diện nội bộ mới (thêm vào trong MainLayout hiện tại) ---
<Route path="criteria" element={<CriteriaOverviewPage />} />
<Route path="criteria/:periodId" element={<CriteriaDetailPage />} />
<Route path="criteria/periods" element={<ProtectedRoute roles={['admin']}><PeriodsManagePage /></ProtectedRoute>} />
<Route path="criteria/sets" element={<ProtectedRoute roles={['admin']}><CriteriaSetsPage /></ProtectedRoute>} />
<Route path="plans" element={<PlansPage />} />
<Route path="plans/:planId" element={<PlanDetailPage />} />
<Route path="units" element={<ProtectedRoute roles={['admin']}><UnitsPage /></ProtectedRoute>} />
```

---

## 🗂️ CẤU TRÚC DỮ LIỆU FIRESTORE MỚI

### Collection: `units`
Lưu thông tin tài khoản đơn vị cấp dưới (song song với `users`).
```
{
  id: string,              // = uid Firebase Auth
  unitName: string,        // "Đoàn xã Hoa Động"
  unitCode: string,        // "XP001"
  contactName: string,     // Tên bí thư / người phụ trách
  contactPhone: string,
  email: string,
  role: 'unit',
  isActive: boolean,
  status: 'pending' | 'approved',
  createdAt: Timestamp,
  createdBy: string        // uid admin tạo tài khoản
}
```

### Collection: `criteriaSets` — Bộ tiêu chí
Thành đoàn tạo và quản lý. Cấu trúc đa cấp: Tiêu chí → Nội dung → Điều kiện.
```
{
  id: string,
  name: string,            // "Bộ Tiêu chí năm 2026 - Khối Xã, Phường, Đặc Khu"
  description: string,     // "Gồm 08 tiêu chí, 15 nội dung, 46 điều kiện, 275 điểm"
  isActive: boolean,
  createdAt: Timestamp,
  createdBy: string,

  criteria: [              // Mảng tiêu chí (level 1)
    {
      id: string,
      name: string,        // "Tiêu chí 1: Công tác tuyên truyền, giáo dục"
      order: number,
      totalMaxScore: number,

      contents: [          // Nội dung đánh giá (level 2)
        {
          id: string,
          name: string,    // "1. Học tập và làm theo tư tưởng, đạo đức..."
          order: number,

          conditions: [    // Điều kiện chấm điểm (level 3 — hàng trong bảng)
            {
              id: string,
              muc: number,               // Cột "Mục" (số thứ tự điều kiện)
              dieuKienChamDiem: string,  // Điều kiện chấm điểm của Thành đoàn
              yeuCauMinhChung: string,   // Yêu cầu minh chứng và nguyên tắc chấm
              toTheo: string,           // "TG" | "PT" | ... (cột Tổ theo)
              khungDiem: number,         // Điểm tối đa điều kiện này (VD: 4)
              thoiGianNopMinhChung: string, // "10/11/2026"
              order: number
            }
          ]
        }
      ]
    }
  ]
}
```

### Collection: `submissionPeriods` — Đợt nộp chỉ tiêu
```
{
  id: string,
  name: string,            // "Học kỳ 1 năm học 2025-2026"
  criteriaSetId: string,   // Tham chiếu bộ tiêu chí dùng cho đợt này
  status: 'draft' | 'open' | 'locked' | 'published',
  openAt: Timestamp,       // Ngày mở nộp
  lockAt: Timestamp,       // Ngày khóa (đơn vị không sửa được nữa)
  publishAt: Timestamp,    // Ngày công bố kết quả
  createdAt: Timestamp,
  createdBy: string,

  // Phân công: thành viên nào chấm đơn vị nào
  // key = unitId, value = mảng userId được phân công
  unitAssignments: {
    [unitId]: string[]
  }
}
```

### Collection: `submissions` — Bài nộp của đơn vị
Mỗi document = 1 đơn vị nộp cho 1 đợt.
```
{
  id: string,
  periodId: string,
  unitId: string,
  unitName: string,
  unitCode: string,
  status: 'draft' | 'submitted' | 'grading' | 'graded',
  submittedAt: Timestamp | null,
  lastEditedAt: Timestamp,

  // Dữ liệu đơn vị tự nhập — key = conditionId
  responses: {
    [conditionId]: {
      selfScore: number,         // Điểm tự chấm của đơn vị
      note: string,              // Ghi chú của đơn vị
      attachments: [             // File minh chứng upload lên
        {
          name: string,
          url: string,
          path: string,          // Firebase Storage path
          type: string,          // 'pdf' | 'image' | 'word'
          size: number,
          uploadedAt: string
        }
      ]
    }
  },

  // Điểm Thành đoàn chấm — key = conditionId
  scores: {
    [conditionId]: {
      score: number,             // Điểm được chấm (cột "Được chấm")
      comment: string,           // Nhận xét
      gradedBy: string,          // userId người chấm
      gradedAt: Timestamp
    }
  },

  // Tổng kết
  totalSelfScore: number,        // Tổng điểm tự chấm
  totalOfficialScore: number,    // Tổng điểm Thành đoàn chấm
  maxTotalScore: number,
  classification: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' | null,
  overallComment: string,        // Nhận xét tổng thể

  // Thành viên được phân công chấm đơn vị này
  assignedGraders: string[]
}
```

### Collection: `plans` — Kế hoạch & Thông báo
```
{
  id: string,
  title: string,
  type: 'plan' | 'announcement' | 'contest',
                             // plan = kế hoạch thường
                             // announcement = thông báo
                             // contest = cuộc thi (cho phép nộp hồ sơ)
  content: string,           // Nội dung chi tiết (rich text hoặc markdown)
  attachments: [             // File đính kèm từ Thành đoàn
    { name, url, path, type, size }
  ],
  status: 'draft' | 'published',
  publishedAt: Timestamp,
  deadline: Timestamp | null,       // Hạn nộp hồ sơ (nếu là cuộc thi)
  contestConfig: {                  // Chỉ có khi type = 'contest'
    allowedFileTypes: string[],     // Loại file được phép nộp
    maxFilesPerEntry: number,
    requiredDocs: string[]          // Danh sách hồ sơ bắt buộc: ['baiViet', 'nhanSu', 'keHoach', 'pheDuyet']
  },
  createdAt: Timestamp,
  createdBy: string,
  targetUnitTypes: string[]  // [] = tất cả đơn vị
}
```

### Collection: `contestEntries` — Hồ sơ dự thi
```
{
  id: string,
  planId: string,            // Kế hoạch cuộc thi
  unitId: string,
  unitName: string,
  unitCode: string,
  status: 'draft' | 'submitted',
  submittedAt: Timestamp | null,
  lastEditedAt: Timestamp,

  // Hồ sơ nộp
  docs: {
    baiViet:   { name, url, path, type, size } | null,
    nhanSu:    { name, url, path, type, size } | null,
    keHoach:   { name, url, path, type, size } | null,
    pheDuyet:  { name, url, path, type, size } | null,
    other:     [{ name, url, path, type, size }]
  },
  note: string               // Ghi chú thêm của đơn vị
}
```

---

## 🖥️ CÁC TRANG CẦN TẠO

### A. Giao diện đơn vị cấp dưới (`/unit/*`)

Tạo `src/components/unit/UnitLayout.jsx` — layout riêng, KHÔNG dùng Sidebar nội bộ.
Có header đơn giản hiển thị tên đơn vị + nút đăng xuất + menu: Trang chủ | Chỉ tiêu | Kế hoạch | Hồ sơ cá nhân.

**`/unit` — UnitDashboard.jsx**
- Thống kê nhanh: số đợt đang mở, số kế hoạch mới, điểm tự chấm kỳ gần nhất
- Danh sách đợt chỉ tiêu đang mở với trạng thái nộp của đơn vị
- Danh sách kế hoạch/thông báo mới nhất (3-5 mục)

**`/unit/submit/:periodId` — UnitSubmitPage.jsx**
- Hiển thị countdown đến ngày khóa
- Render toàn bộ bộ tiêu chí theo cấu trúc: Tiêu chí → Nội dung → Điều kiện
- Với mỗi **Điều kiện** (hàng trong bảng), hiển thị:
  - Cột trái (do Thành đoàn set, chỉ đọc): Mục | Điều kiện chấm điểm | Yêu cầu minh chứng & nguyên tắc | Tổ theo | Khung điểm | Thời gian nộp
  - Cột phải (đơn vị điền): ô upload file/ảnh/văn bản minh chứng | ô nhập điểm tự chấm (không vượt khung điểm) | ô ghi chú
- Nút **Lưu nháp** (lưu không cần điền đủ) và nút **Nộp chính thức** (xác nhận, sau khi nộp không sửa được khi đã locked)
- Khi đợt đã bị khóa (`status = 'locked'`): chỉ xem, không sửa

**`/unit/results/:periodId` — UnitResultsPage.jsx**
- Chỉ hiển thị khi `status = 'published'`
- Bảng so sánh: Điểm tự chấm vs Điểm được chấm cho từng điều kiện
- Nhận xét của người chấm
- Tổng điểm + xếp loại cuối cùng

**`/unit/plans` — UnitPlansPage.jsx**
- Danh sách kế hoạch/thông báo đã được publish, mới nhất trước
- Filter theo type: Tất cả | Kế hoạch | Thông báo | Cuộc thi
- Badge "Cuộc thi" nổi bật với deadline đếm ngược

**`/unit/plans/:planId` — UnitPlanDetailPage.jsx**
- Nội dung đầy đủ + file đính kèm từ Thành đoàn
- Nếu `type = 'contest'`: hiển thị nút **Nộp hồ sơ dự thi**

**`/unit/plans/:planId/apply` — UnitApplyPage.jsx**
- Form nộp hồ sơ dự thi theo `contestConfig.requiredDocs`:
  - Bài viết: upload file
  - Nhân sự: upload file
  - Kế hoạch: upload file
  - Văn bản phê duyệt: upload file
  - Ghi chú thêm: textarea
- Nút Lưu nháp / Nộp chính thức

**`/unit/settings` — UnitSettingsPage.jsx**
- Xem và chỉnh sửa thông tin đơn vị (tên, người liên hệ, số điện thoại)
- Đổi mật khẩu

---

### B. Giao diện nội bộ — Module Chỉ tiêu (`/criteria/*`)

**`/criteria` — CriteriaOverviewPage.jsx** (admin/manager/member)
- Danh sách các đợt chỉ tiêu: tên đợt | bộ tiêu chí | trạng thái | hạn khóa | tiến độ nộp
- Bảng tổng hợp: đơn vị nào đã nộp / chưa nộp / đã chấm
- Filter theo: đợt | trạng thái | đơn vị
- Nút xuất Excel/PDF toàn bộ kết quả đợt

**`/criteria/:periodId` — CriteriaDetailPage.jsx** (admin/manager/member)
- Danh sách tất cả đơn vị trong đợt + trạng thái nộp + tổng điểm tự chấm / điểm được chấm
- Click vào đơn vị → mở modal/panel chấm điểm:
  - Hiển thị từng điều kiện, bên cạnh là:
    - File minh chứng đơn vị đã upload (click xem được)
    - Điểm tự chấm của đơn vị
    - Ô nhập **điểm được chấm** + ô nhập **nhận xét** (chỉ enabled nếu user được phân công chấm đơn vị đó, hoặc là admin/manager)
  - Nút **Lưu chấm điểm**
  - Ô nhận xét tổng thể
- Chỉ admin mới thấy nút **Khóa đợt** và **Công bố kết quả**

**`/criteria/periods` — PeriodsManagePage.jsx** (admin only)
- Danh sách đợt chỉ tiêu: CRUD
- Form tạo/sửa đợt: tên | chọn bộ tiêu chí | ngày mở | ngày khóa | ngày công bố
- Phân công chấm điểm: chọn thành viên (member/manager) phụ trách từng đơn vị
- Nút: Mở đợt → Khóa đợt → Công bố kết quả (theo trình tự, có xác nhận)

**`/criteria/sets` — CriteriaSetsPage.jsx** (admin only)
- Danh sách bộ tiêu chí: CRUD
- Form tạo/sửa bộ tiêu chí với editor cây 3 cấp:
  - Level 1: Tiêu chí (thêm/sửa/xóa/sắp xếp)
  - Level 2: Nội dung đánh giá (con của Tiêu chí)
  - Level 3: Điều kiện (hàng trong bảng) với các trường:
    - Mục (số thứ tự)
    - Điều kiện chấm điểm của Thành đoàn
    - Yêu cầu minh chứng và nguyên tắc chấm điểm
    - Tổ theo (dropdown: TG / PT / ...)
    - Khung điểm (số)
    - Thời gian nộp minh chứng (date picker)
- Nút **Import từ Excel** (đọc file Excel có cấu trúc giống ảnh mẫu và tự parse vào form)

---

### C. Giao diện nội bộ — Module Kế hoạch (`/plans/*`)

**`/plans` — PlansPage.jsx** (admin/manager/member)
- Danh sách kế hoạch đã publish, mới nhất trước
- Filter: Tất cả | Kế hoạch | Thông báo | Cuộc thi
- Admin/Manager thấy thêm: bản nháp + nút tạo mới
- Với cuộc thi: hiển thị số đơn vị đã nộp hồ sơ

**`/plans/:planId` — PlanDetailPage.jsx**
- Xem nội dung đầy đủ
- Admin/Manager: nút Sửa | Publish | Xóa
- Nếu `type = 'contest'`: tab **Hồ sơ dự thi** — xem danh sách đơn vị đã nộp + xem chi tiết từng hồ sơ + tải file

**`/units` — UnitsPage.jsx** (admin only)
- Danh sách tất cả đơn vị + trạng thái
- Tạo tài khoản đơn vị mới: gọi Cloud Function `createUnit` với `{ email, password, unitName, unitCode, contactName, contactPhone }`
- Duyệt / vô hiệu hóa tài khoản đơn vị
- Sửa thông tin đơn vị

---

## ⚙️ CLOUD FUNCTIONS MỚI (thêm vào `functions/index.js`)

```js
// === TẠO TÀI KHOẢN ĐƠN VỊ ===
exports.createUnit = onCall(async (request) => {
  // Tương tự createUser nhưng:
  // - role = 'unit', isActive = true, status = 'approved'
  // - Tạo document trong collection 'units' thay vì 'users'
});

// === KHÓA ĐỢT CHẤM ĐIỂM ===
exports.lockSubmissionPeriod = onCall(async (request) => {
  // Chỉ admin mới gọi được
  // Cập nhật status = 'locked' trong submissionPeriods
  // Gửi thông báo cho tất cả đơn vị biết đợt đã bị khóa
});

// === CÔNG BỐ KẾT QUẢ ===
exports.publishPeriodResults = onCall(async (request) => {
  // Chỉ admin mới gọi được
  // Tính totalOfficialScore và classification cho tất cả submissions của đợt
  // Cập nhật status = 'published'
  // Gửi thông báo cho các đơn vị
  // Phân loại: >= 90% → Tốt | >= 70% → Khá | >= 50% → Đạt | < 50% → Chưa đạt
});
```

---

## 🔒 FIRESTORE RULES MỚI (thêm vào `firestore.rules`)

```
// Thêm helper function:
function isUnit() { 
  return exists(/databases/$(database)/documents/units/$(request.auth.uid)); 
}
function getUnitId() { return request.auth.uid; }

// Collection units
match /units/{unitId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && isAdmin();
  allow update: if isAuthenticated() && (
    isAdmin() || 
    (request.auth.uid == unitId && 
     request.resource.data.diff(resource.data).affectedKeys()
       .hasOnly(['contactName', 'contactPhone', 'updatedAt']))
  );
  allow delete: if false;
}

// Collection criteriaSets
match /criteriaSets/{setId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}

// Collection submissionPeriods
match /submissionPeriods/{periodId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin();
}

// Collection submissions
match /submissions/{submissionId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && isUnit() && 
    request.resource.data.unitId == getUnitId();
  allow update: if isAuthenticated() && (
    isAdminOrManager() ||
    // Đơn vị chỉ sửa được khi đợt chưa locked và là submission của mình
    (isUnit() && resource.data.unitId == getUnitId() &&
     resource.data.status != 'submitted' /* sau khi công bố không sửa */)
  );
  allow delete: if false;
}

// Collection plans
match /plans/{planId} {
  allow read: if isAuthenticated();
  allow write: if isAdminOrManager();
}

// Collection contestEntries
match /contestEntries/{entryId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && isUnit() && 
    request.resource.data.unitId == getUnitId();
  allow update: if isAuthenticated() && (
    isAdminOrManager() ||
    (isUnit() && resource.data.unitId == getUnitId() && 
     resource.data.status == 'draft')
  );
  allow delete: if false;
}
```

---

## 📁 CẤU TRÚC FILE MỚI CẦN TẠO

```
src/
  pages/
    unit/
      UnitDashboard.jsx
      UnitSubmitPage.jsx         ← Trang nộp chỉ tiêu (quan trọng nhất)
      UnitResultsPage.jsx
      UnitPlansPage.jsx
      UnitPlanDetailPage.jsx
      UnitApplyPage.jsx          ← Nộp hồ sơ dự thi
      UnitSettingsPage.jsx
    criteria/
      CriteriaOverviewPage.jsx
      CriteriaDetailPage.jsx     ← Xem + chấm điểm từng đơn vị
      PeriodsManagePage.jsx
      CriteriaSetsPage.jsx       ← Editor bộ tiêu chí 3 cấp
    plans/
      PlansPage.jsx
      PlanDetailPage.jsx
      PlanFormPage.jsx           ← Tạo/sửa kế hoạch
    UnitsPage.jsx

  components/
    unit/
      UnitLayout.jsx             ← Layout riêng cho đơn vị
      UnitHeader.jsx
      ConditionRow.jsx           ← 1 hàng điều kiện trong bảng nộp
      SelfScoreInput.jsx         ← Ô tự chấm điểm
      EvidenceUpload.jsx         ← Upload minh chứng cho 1 điều kiện
      GradeInputCard.jsx         ← Card chấm điểm (nội bộ)
      PlanCard.jsx
      ContestBadge.jsx
    criteria/
      CriteriaTree.jsx           ← Hiển thị cây tiêu chí 3 cấp
      CriteriaSetEditor.jsx      ← Editor tạo/sửa bộ tiêu chí
      SubmissionStatusBadge.jsx
      PeriodStatusBadge.jsx
      ScoreCompareRow.jsx        ← So sánh tự chấm vs được chấm

  firebase/
    criteriaFirestore.js         ← Tất cả Firestore functions cho module mới
                                    (KHÔNG sửa firestore.js cũ)

  hooks/
    useSubmissions.js
    useCriteriaSets.js
    useSubmissionPeriods.js
    usePlans.js
    useContestEntries.js
    useUnits.js
```

---

## 📋 FIRESTORE FUNCTIONS MỚI (`src/firebase/criteriaFirestore.js`)

Tạo file mới, viết đầy đủ các hàm sau:

```
// === UNITS ===
subscribeToUnits(callback, onError)
getUnit(unitId)
updateUnit(unitId, updates)

// === CRITERIA SETS ===
subscribeToCriteriaSets(callback, onError)
getCriteriaSet(setId)
createCriteriaSet(data)
updateCriteriaSet(setId, data)
deleteCriteriaSet(setId)

// === SUBMISSION PERIODS ===
subscribeToSubmissionPeriods(callback, onError)
getSubmissionPeriod(periodId)
createSubmissionPeriod(data)
updateSubmissionPeriod(periodId, updates)
updateUnitAssignment(periodId, unitId, graderIds)

// === SUBMISSIONS ===
subscribeToAllSubmissions(periodId, callback, onError)
subscribeToUnitSubmission(periodId, unitId, callback, onError)
createOrUpdateDraftSubmission(periodId, unitId, unitData, responses)
submitSubmission(submissionId)        // Nộp chính thức
updateConditionScore(submissionId, conditionId, scoreData)  // Chấm điểm
saveOverallComment(submissionId, comment)

// === PLANS ===
subscribeToPlans(callback, onError)
subscribeToPlansByType(type, callback, onError)
getPlan(planId)
createPlan(data)
updatePlan(planId, updates)
publishPlan(planId)

// === CONTEST ENTRIES ===
subscribeToContestEntries(planId, callback, onError)
getUnitContestEntry(planId, unitId, callback, onError)
createOrUpdateContestEntry(planId, unitId, unitData, docs)
submitContestEntry(entryId)
```

Tất cả các hàm `subscribe*` dùng `onSnapshot` realtime. Tất cả các hàm async có try/catch đầy đủ.

---

## 🗂️ FIREBASE STORAGE PATHS

```
submissions/{periodId}/{unitId}/{conditionId}/{filename}   ← Minh chứng chỉ tiêu
contest/{planId}/{unitId}/{docType}/{filename}             ← Hồ sơ dự thi
plans/{planId}/attachments/{filename}                     ← File đính kèm kế hoạch
```

---

## 🧮 LOGIC NGHIỆP VỤ QUAN TRỌNG

### Tính điểm và xếp loại (khi publishPeriodResults)
```js
const percent = (totalOfficialScore / maxTotalScore) * 100;
if (percent >= 90) classification = 'Tốt';
else if (percent >= 70) classification = 'Khá';
else if (percent >= 50) classification = 'Đạt';
else classification = 'Chưa đạt';
```

### Luồng đợt chỉ tiêu
```
draft → open (admin mở) → locked (admin khóa, đơn vị không sửa được) → published (công bố kết quả)
```

### Kiểm soát quyền chấm điểm
- `admin` và `manager`: chấm được tất cả đơn vị
- `member`: chỉ chấm được đơn vị có `uid` trong `unitAssignments[unitId]` của đợt

### Validation điểm tự chấm
- `selfScore` của đơn vị không được vượt `khungDiem` của điều kiện đó
- Hiển thị lỗi inline nếu nhập vượt

---

## ✅ YÊU CẦU KỸ THUẬT

- Toàn bộ giao diện **tiếng Việt**
- Dùng `onSnapshot` realtime cho tất cả danh sách
- Loading state + skeleton loader cho mọi trang
- Toast thông báo (react-hot-toast) cho tất cả thao tác
- Error handling đầy đủ, hiển thị lỗi thân thiện tiếng Việt
- Responsive: dùng tốt trên cả máy tính lẫn điện thoại
- Code comment tiếng Việt ở các phần logic nghiệp vụ quan trọng
- Thêm Firestore indexes vào `firestore.indexes.json` cho:
  - `submissions`: `periodId ASC` + `unitId ASC`
  - `submissions`: `periodId ASC` + `status ASC`
  - `plans`: `status ASC` + `publishedAt DESC`
  - `contestEntries`: `planId ASC` + `unitId ASC`
- Cập nhật `README.md` bổ sung hướng dẫn module mới

---

## 🚀 THỨ TỰ THỰC HIỆN ĐỀ XUẤT

1. Cập nhật `constants.js` → thêm role `unit` và NAV_ITEMS mới
2. Cập nhật `AuthContext.jsx` → xử lý role `unit`
3. Tạo `src/firebase/criteriaFirestore.js` với đầy đủ Firestore functions
4. Cập nhật `firestore.rules` → thêm rules mới
5. Cập nhật `functions/index.js` → thêm `createUnit`, `lockSubmissionPeriod`, `publishPeriodResults`
6. Tạo `UnitLayout.jsx` + các trang `/unit/*`
7. Tạo `CriteriaSetsPage.jsx` + `PeriodsManagePage.jsx` (admin)
8. Tạo `CriteriaOverviewPage.jsx` + `CriteriaDetailPage.jsx` (nội bộ)
9. Tạo `PlansPage.jsx` + `PlanDetailPage.jsx` + `PlanFormPage.jsx`
10. Tạo `UnitsPage.jsx`
11. Cập nhật `App.jsx` → thêm tất cả routes mới
12. Cập nhật `Sidebar.jsx` / `constants.js` → thêm menu mới
13. Cập nhật `firestore.indexes.json`
14. Cập nhật `README.md`
