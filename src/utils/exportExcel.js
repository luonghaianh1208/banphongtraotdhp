// Xuất Excel
import * as XLSX from 'xlsx';
import { formatDateTime } from './dateUtils';
import { getTaskDisplayStatus } from './statusUtils';
import { PRIORITIES, UNIT_BLOCKS } from './constants';

// Xuất template Excel để import bộ tiêu chí
export const exportCriteriaTemplate = () => {
  const rows = [];
  let stt = 1;

  rows.push({
    'STT': 'Hướng dẫn',
    'Tên tiêu chí': '(Nhập tên tiêu chí)',
    'Mô tả': '(Mô tả chi tiết)',
    'Điểm tối đa': '(Số điểm)',
    'Nhóm tiêu chí': '(VD: Công tác Đoàn, Hành động mùa xuân...)',
    'Ghi chú': '',
  });

  rows.push({ 'STT': '', 'Tên tiêu chí': '', 'Mô tả': '', 'Điểm tối đa': '', 'Nhóm tiêu chí': '', 'Ghi chú': '' });

  // Sample rows cho 2 nhóm phổ biến
  const sampleGroups = ['Công tác Đoàn', 'Hành động mùa xuân', 'Sinh hoạt chính trị', 'Phong trào thanh niên'];
  sampleGroups.forEach(group => {
    rows.push({ 'STT': stt++, 'Tên tiêu chí': `Tiêu chí mẫu - ${group}`, 'Mô tả': '', 'Điểm tối đa': 10, 'Nhóm tiêu chí': group, 'Ghi chú': '' });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 35 },
    { wch: 30 },
    { wch: 15 },
    { wch: 25 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bộ Tiêu Chí');
  XLSX.writeFile(wb, 'mau_bo_tieu_chi.xlsx');
};

// Xuất template Excel để import đơn vị
export const exportUnitTemplate = () => {
  const rows = [];
  let stt = 1;

  rows.push({
    'STT': 'Hướng dẫn',
    'Tên đơn vị': '(Nhập tên cơ sở)',
    'Email': '(Email đăng nhập)',
    'Mật khẩu': '(Mật khẩu khởi tạo)',
    'Khối': '(Chọn: Xã/Phường / Đại học/Cao đẳng / Công nhân viên chức / Lực lượng vũ trang)',
    'Loại': '(Chọn theo Khối)',
    'Ghi chú': '',
  });

  rows.push({ 'STT': '', 'Tên đơn vị': '', 'Email': '', 'Mật khẩu': '', 'Khối': '', 'Loại': '', 'Ghi chú': '' });

  // Sinh sample rows cho từng block × type
  UNIT_BLOCKS.forEach(block => {
    block.types.forEach(type => {
      rows.push({
        'STT': stt++,
        'Tên đơn vị': `${type.name} - ${block.name}`,
        'Email': '',
        'Mật khẩu': '',
        'Khối': block.name,
        'Loại': type.name,
        'Ghi chú': '',
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 30 },
    { wch: 20 },
    { wch: 28 },
    { wch: 28 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách Đơn vị');
  XLSX.writeFile(wb, 'mau_danh_sach_don_vi.xlsx');
};

// Xuất danh sách task ra file Excel (.xlsx)
export const exportToExcel = (tasks, users, filename = 'bao-cao-cong-viec') => {
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.displayName; });

  const data = tasks.map((task, index) => {
    const status = getTaskDisplayStatus(task);
    const assigneeNames = (task.assignees || []).map(id => userMap[id] || 'Không rõ').join(', ');

    return {
      'STT': index + 1,
      'Tiêu đề': task.title,
      'Người thực hiện': assigneeNames,
      'Người giao': userMap[task.createdBy] || 'Không rõ',
      'Độ ưu tiên': PRIORITIES[task.priority]?.label || task.priority,
      'Thời hạn': formatDateTime(task.deadline),
      'Trạng thái': status.label,
      'Ngày tạo': formatDateTime(task.createdAt),
      'Ngày hoàn thành': task.completedAt ? formatDateTime(task.completedAt) : '',
      'Ghi chú': (task.notes || []).map(n => n.content).join(' | '),
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 },   // STT
    { wch: 40 },  // Tiêu đề
    { wch: 25 },  // Người thực hiện
    { wch: 20 },  // Người giao
    { wch: 15 },  // Độ ưu tiên
    { wch: 20 },  // Thời hạn
    { wch: 20 },  // Trạng thái
    { wch: 20 },  // Ngày tạo
    { wch: 20 },  // Ngày hoàn thành
    { wch: 40 },  // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Công việc');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`);
};
