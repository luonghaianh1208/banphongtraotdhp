// Hằng số & label tiếng Việt cho toàn app

export const ORG_NAME = import.meta.env.VITE_ORG_NAME || 'Ban Phong Trào Thành Đoàn Hải Phòng';

// Vai trò người dùng
export const ROLES = {
  admin: { label: 'Tổ trưởng', color: 'red' },
  manager: { label: 'Phụ trách', color: 'amber' },
  member: { label: 'Nhân viên', color: 'blue' },
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
  COMPLETED: { label: 'Hoàn thành', color: 'complete', iconName: 'checkCircle', badgeClass: 'badge-complete' },
};

// Sidebar navigation items
export const NAV_ITEMS = [
  { path: '/', icon: 'MdToday', label: 'Hôm nay', roles: ['admin', 'manager', 'member'] },
  { path: '/tasks', icon: 'MdAssignment', label: 'Tất cả công việc', roles: ['admin', 'manager', 'member'] },
  { path: '/dashboard', icon: 'MdDashboard', label: 'Dashboard', roles: ['admin', 'manager'] },
  { path: '/members', icon: 'MdGroup', label: 'Quản lý thành viên', roles: ['admin'] },
  { path: '/task-config', icon: 'MdTune', label: 'Cấu hình công việc', roles: ['admin'] },
  { path: '/trash', icon: 'MdDeleteSweep', label: 'Thùng rác', roles: ['admin'] },
  { path: '/settings', icon: 'MdPerson', label: 'Hồ sơ', roles: ['admin', 'manager', 'member'] },
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
