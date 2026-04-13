// Xuất danh sách task ra file PDF
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDateTime } from './dateUtils';
import { getTaskDisplayStatus } from './statusUtils';
import { PRIORITIES, ORG_NAME } from './constants';

export const exportToPdf = (tasks, users, filename = 'bao-cao-cong-viec') => {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  // Map userId → tên hiển thị
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.displayName; });

  // Header báo cáo
  doc.setFontSize(18);
  doc.setTextColor(11, 110, 79); // Xanh Đoàn
  doc.text('BÁO CÁO CÔNG VIỆC TỔ', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(ORG_NAME, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Ngày xuất: ${formatDateTime(new Date())}`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

  // Line separator
  doc.setDrawColor(11, 110, 79);
  doc.setLineWidth(0.5);
  doc.line(14, 31, doc.internal.pageSize.getWidth() - 14, 31);

  // Dữ liệu bảng
  const tableData = tasks.map((task, index) => {
    const status = getTaskDisplayStatus(task);
    const assigneeNames = (task.assignees || []).map(id => userMap[id] || '?').join(', ');

    return [
      index + 1,
      task.title,
      assigneeNames,
      PRIORITIES[task.priority]?.label || '',
      formatDateTime(task.deadline),
      status.label,
      task.completedAt ? formatDateTime(task.completedAt) : '-',
    ];
  });

  doc.autoTable({
    startY: 35,
    head: [['STT', 'Tiêu đề', 'Người thực hiện', 'Ưu tiên', 'Thời hạn', 'Trạng thái', 'Ngày HT']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [11, 110, 79],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 40 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35 },
      5: { cellWidth: 30, halign: 'center' },
      6: { cellWidth: 35 },
    },
    // Tô màu cột trạng thái theo badge
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const status = data.cell.text[0];
        if (status === 'Quá hạn') {
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fillColor = [55, 65, 81];
        } else if (status === 'Cần hoàn thành gấp') {
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fillColor = [239, 68, 68];
        } else if (status === 'Gần đến hạn') {
          data.cell.styles.textColor = [120, 53, 15];
          data.cell.styles.fillColor = [254, 243, 199];
        } else if (status === 'Hoàn thành') {
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fillColor = [5, 150, 105];
        }
      }
    },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Trang ${i}/${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Xuất
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`${filename}_${dateStr}.pdf`);
};
