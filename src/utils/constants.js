// Hằng số & label tiếng Việt cho toàn app

export const ORG_NAME = import.meta.env.VITE_ORG_NAME || 'Ban PT TĐHP';

// Vai trò người dùng
export const ROLES = {
  admin: { label: 'Tổ trưởng', color: 'red' },
  manager: { label: 'Phụ trách', color: 'amber' },
  member: { label: 'Nhân viên', color: 'blue' },
  unit: { label: 'Đơn vị cơ sở', color: 'teal' },
};

// Độ ưu tiên (fallback mặc định khi Firestore chưa load)
export const PRIORITIES = {
  high: { label: 'Cao', color: '#EF4444', class: 'priority-high' },
  medium: { label: 'Trung bình', color: '#F59E0B', class: 'priority-medium' },
  low: { label: 'Thấp', color: '#3B82F6', class: 'priority-low' },
};

// Trạng thái hiển thị task (tính từ deadline)
export const TASK_DISPLAY_STATUS = {
  NOT_DUE: { label: 'Chưa đến hạn', color: 'green', iconName: 'schedule', badgeClass: 'badge-green' },
  NEAR_DUE: { label: 'Gần đến hạn', color: 'yellow', iconName: 'timelapse', badgeClass: 'badge-yellow' },
  URGENT: { label: 'Cần hoàn thành gấp', color: 'red', iconName: 'warning', badgeClass: 'badge-red' },
  OVERDUE: { label: 'Quá hạn', color: 'black', iconName: 'error', badgeClass: 'badge-black' },
  EXTENDED: { label: 'Gia hạn', color: 'blue', iconName: 'update', badgeClass: 'badge-blue' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', color: 'purple', iconName: 'hourglass', badgeClass: 'badge-purple' },
  COMPLETED: { label: 'Hoàn thành', color: 'complete', iconName: 'checkCircle', badgeClass: 'badge-complete' },
};

// === UNIT BLOCKS & TYPES (Khối và Loại đơn vị cơ sở) ===
export const UNIT_BLOCKS = [
  {
    id: 'xa-phuong-dac-khu',
    name: 'Khối Xã, Phường, Đặc khu',
    types: [
      { id: 'xa', name: 'Xã' },
      { id: 'phuong', name: 'Phường' },
      { id: 'dac-khu', name: 'Đặc khu' },
    ]
  },
  {
    id: 'dai-hoc-cao-dang',
    name: 'Khối Đại học - Cao đẳng',
    types: [
      { id: 'dai-hoc', name: 'Đại học' },
      { id: 'cao-dang', name: 'Cao đẳng' },
    ]
  },
  {
    id: 'cong-nhan-vien-chuc',
    name: 'Khối Công nhân viên chức',
    types: [
      { id: 'cnvc', name: 'Công nhân viên chức' },
    ]
  },
  {
    id: 'luc-luong-vu-trang',
    name: 'Khối Lực lượng vũ trang',
    types: [
      { id: 'llvt', name: 'Lực lượng vũ trang' },
    ]
  },
];

// Sidebar navigation items
export const NAV_ITEMS = [
  { path: '/', icon: 'MdToday', label: 'Hôm nay', roles: ['admin', 'manager', 'member'] },
  { path: '/tasks', icon: 'MdAssignment', label: 'Tất cả công việc', roles: ['admin', 'manager', 'member'] },
  { path: '/dashboard', icon: 'MdDashboard', label: 'Dashboard', roles: ['admin', 'manager'] },
  { path: '/penalties', icon: 'MdGavel', label: 'Quản lý Phạt', roles: ['admin', 'manager'] },
  { path: '/members', icon: 'MdGroup', label: 'Quản lý thành viên', roles: ['admin'] },
  { path: '/units', icon: 'MdCorporateFare', label: 'Quản lý Đơn vị', roles: ['admin'] },
  { path: '/criteria-sets', icon: 'MdFactCheck', label: 'Chỉ tiêu', roles: ['admin', 'manager'] },
  { path: '/periods', icon: 'MdDateRange', label: 'Đợt chấm điểm', roles: ['admin', 'manager'] },
  { path: '/plans-manage', icon: 'MdArticle', label: 'Kế hoạch', roles: ['admin', 'manager'] },
  { path: '/task-config', icon: 'MdTune', label: 'Cấu hình công việc', roles: ['admin'] },
  { path: '/trash', icon: 'MdDeleteSweep', label: 'Thùng rác', roles: ['admin'] },
  { path: '/settings', icon: 'MdPerson', label: 'Hồ sơ', roles: ['admin', 'manager', 'member'] },
  { path: '/system-info', icon: 'MdInfo', label: 'Thông tin hệ thống', roles: ['admin', 'manager', 'member'] },
];

// File types cho upload
export const ALLOWED_FILE_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'image/jpeg': 'Ảnh JPEG',
  'image/png': 'Ảnh PNG',
  'image/jpg': 'Ảnh JPG',
};

// Thời gian filter
export const TIME_FILTERS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'all', label: 'Tất cả' },
];
