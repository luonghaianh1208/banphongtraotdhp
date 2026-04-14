// Xuất danh sách task ra file PDF — hỗ trợ tiếng Việt qua html2canvas
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDateTime } from './dateUtils';
import { getTaskDisplayStatus } from './statusUtils';
import { PRIORITIES, ORG_NAME } from './constants';

export const exportToPdf = async (tasks, users, filename = 'bao-cao-cong-viec') => {
  // Map userId → tên hiển thị
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.displayName; });

  // Tạo bảng HTML ẩn để render (hỗ trợ Unicode tiếng Việt hoàn hảo)
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:1100px;background:#fff;padding:32px;font-family:system-ui,-apple-system,sans-serif;';

  // Dữ liệu bảng
  const rows = tasks.map((task, i) => {
    const status = getTaskDisplayStatus(task);
    const assigneeNames = (task.assignees || []).map(id => userMap[id] || '?').join(', ');
    return { index: i + 1, task, status, assigneeNames };
  });

  const statusColorMap = {
    'Quá hạn': { bg: '#374151', color: '#fff' },
    'Cần hoàn thành gấp': { bg: '#ef4444', color: '#fff' },
    'Gần đến hạn': { bg: '#fef3c7', color: '#78350f' },
    'Hoàn thành': { bg: '#059669', color: '#fff' },
  };

  container.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;">
      <h1 style="color:#0b6e4f;font-size:22px;margin:0 0 4px;">BÁO CÁO CÔNG VIỆC TỔ</h1>
      <p style="color:#666;font-size:14px;margin:0 0 4px;">${ORG_NAME}</p>
      <p style="color:#999;font-size:12px;margin:0;">Ngày xuất: ${formatDateTime(new Date())}</p>
      <hr style="border:none;border-top:2px solid #0b6e4f;margin-top:12px;" />
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr style="background:#0b6e4f;color:#fff;">
          <th style="padding:8px 6px;text-align:center;width:40px;">STT</th>
          <th style="padding:8px 6px;text-align:left;">Tiêu đề</th>
          <th style="padding:8px 6px;text-align:left;">Người thực hiện</th>
          <th style="padding:8px 6px;text-align:center;">Ưu tiên</th>
          <th style="padding:8px 6px;text-align:center;">Thời hạn</th>
          <th style="padding:8px 6px;text-align:center;">Trạng thái</th>
          <th style="padding:8px 6px;text-align:center;">Ngày HT</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(({ index, task, status, assigneeNames }) => {
          const sc = statusColorMap[status.label] || { bg: '#e5e7eb', color: '#374151' };
          return `
            <tr style="background:${index % 2 === 0 ? '#f5f7fa' : '#fff'};border-bottom:1px solid #eee;">
              <td style="padding:6px;text-align:center;">${index}</td>
              <td style="padding:6px;">${task.title}</td>
              <td style="padding:6px;">${assigneeNames}</td>
              <td style="padding:6px;text-align:center;">${PRIORITIES[task.priority]?.label || ''}</td>
              <td style="padding:6px;text-align:center;">${formatDateTime(task.deadline)}</td>
              <td style="padding:6px;text-align:center;">
                <span style="background:${sc.bg};color:${sc.color};padding:2px 8px;border-radius:4px;font-size:11px;">${status.label}</span>
              </td>
              <td style="padding:6px;text-align:center;">${task.completedAt ? formatDateTime(task.completedAt) : '-'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Nếu bảng dài hơn 1 trang, chia ra nhiều trang
    let yOffset = 0;
    const usableHeight = pageHeight - margin * 2;

    while (yOffset < imgHeight) {
      if (yOffset > 0) doc.addPage();
      doc.addImage(imgData, 'PNG', margin, margin - yOffset, imgWidth, imgHeight);
      yOffset += usableHeight;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Trang ${i}/${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`${filename}_${dateStr}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};
