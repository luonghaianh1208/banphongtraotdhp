// Xuất danh sách task ra file Excel (.xlsx)
import * as XLSX from 'xlsx';
import { formatDateTime } from './dateUtils';
import { getTaskDisplayStatus } from './statusUtils';
import { PRIORITIES } from './constants';

export const exportToExcel = (tasks, users, filename = 'bao-cao-cong-viec') => {
  // Map userId → tên hiển thị
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.displayName; });

  // Chuyển tasks thành dữ liệu bảng
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

  // Tạo workbook
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
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

  // Xuất file
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`);
};
