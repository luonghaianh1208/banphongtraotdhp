// Xuất Excel
import * as XLSX from 'xlsx';
import { formatDateTime } from './dateUtils';
import { getTaskDisplayStatus } from './statusUtils';
import { PRIORITIES, UNIT_BLOCKS } from './constants';

// ======================================
// CRITERIA — Export template & Import & Export
// ======================================

// 9 cột mới: Tiêu chí | Nội dung | Mục | Điều kiện | Yêu cầu MC | Tổ theo dõi | Khung điểm | Thời hạn | Đơn vị
const CRITERIA_HEADERS = [
  'Tiêu chí',
  'Nội dung đánh giá',
  'Mục (STT)',
  'Điều kiện chấm điểm',
  'Yêu cầu minh chứng & nguyên tắc chấm',
  'Tổ theo dõi',
  'Khung điểm',
  'Thời hạn nộp minh chứng',
  'Đơn vị áp dụng',
];

/**
 * Xuất file Excel mẫu để nhập bộ tiêu chí.
 */
export const exportCriteriaTemplate = () => {
  const rows = [];

  // Row hướng dẫn
  const guide = {};
  guide[CRITERIA_HEADERS[0]] = '(1) Nhập tên tiêu chí ở cột A. Các muc cùng tiêu chí để trống.';
  guide[CRITERIA_HEADERS[1]] = '(2) Nhập nội dung đánh giá (nhóm con). Cùng nội dung để trống.';
  guide[CRITERIA_HEADERS[2]] = '(3) Số thứ tự mục: 1, 2, 3...';
  guide[CRITERIA_HEADERS[3]] = '(4) Điều kiện chấm';
  guide[CRITERIA_HEADERS[4]] = '(5) Yêu cầu minh chứng chi tiết';
  guide[CRITERIA_HEADERS[5]] = '(6) VD: PT, TTNTH';
  guide[CRITERIA_HEADERS[6]] = '(7) Điểm tối đa (số)';
  guide[CRITERIA_HEADERS[7]] = '(8) VD: 30/10/2026';
  guide[CRITERIA_HEADERS[8]] = '(9) VD: Khối Xã, Phường, Đặc khu';
  rows.push(guide);

  // Row trống
  const empty = {};
  CRITERIA_HEADERS.forEach(h => { empty[h] = ''; });
  rows.push(empty);

  // Sample data
  const makeRow = (tc, nd, stt, dk, yc, to, diem, han, dv) => {
    const r = {};
    r[CRITERIA_HEADERS[0]] = tc;
    r[CRITERIA_HEADERS[1]] = nd;
    r[CRITERIA_HEADERS[2]] = stt;
    r[CRITERIA_HEADERS[3]] = dk;
    r[CRITERIA_HEADERS[4]] = yc;
    r[CRITERIA_HEADERS[5]] = to;
    r[CRITERIA_HEADERS[6]] = diem;
    r[CRITERIA_HEADERS[7]] = han;
    r[CRITERIA_HEADERS[8]] = dv;
    return r;
  };

  rows.push(makeRow('Tiêu chí 1: Tổ chức, cán bộ Đoàn - Hội - Đội', '1. Công tác tổ chức', 1, 'Đoàn các xã, phường...', '- Có quyết định: 03 điểm\n- Không có: 0 điểm', 'PT', 3, '30/10/2026', 'Khối Xã, Phường, Đặc khu'));
  rows.push(makeRow('', '', 2, 'Ban chấp hành Đoàn...', '- Đạt 100%: 04 điểm\n- Dưới 70%: 0 điểm', 'PT', 4, '30/6/2026', ''));
  rows.push(makeRow('', '2. Công tác cán bộ', 3, 'Tổ chức đào tạo...', '- Có hoạt động: 03 điểm', 'TTNTH', 3, '30/11/2026', ''));
  rows.push(makeRow('', '', 4, 'Công tác thi đua...', '- Đạt yêu cầu: 3 điểm', 'TTNTH', 3, '30/11/2026', ''));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 40 }, { wch: 35 }, { wch: 10 }, { wch: 40 },
    { wch: 45 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bộ Tiêu Chí');
  XLSX.writeFile(wb, 'mau_bo_tieu_chi.xlsx');
};

// Helper: parse số điểm
const parseScore = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  // Try direct number first
  const direct = Number(s);
  if (!isNaN(direct) && direct !== 0) return direct;
  if (s === '0') return 0;
  // Strip non-numeric (keep . for decimals)
  const cleaned = s.replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
};

// Helper: extract năm từ deadline
const extractYear = (str) => {
  if (!str) return null;
  const m = String(str).match(/20\d{2}/);
  return m ? m[0] : null;
};

/**
 * Parse file Excel → array of { tieuChi (single TC object), year, units[] }
 * Mỗi tiêu chí trả về riêng để lưu thành 1 criteria set riêng.
 */
export const importCriteriaExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // Skip guide row + empty rows
        const dataRows = jsonRows.filter((row, idx) => {
          if (idx === 0) return false; // guide row
          const vals = Object.values(row).map(v => String(v).trim());
          return vals.some(v => v.length > 0);
        });

        if (dataRows.length === 0) {
          reject(new Error('File Excel không có dữ liệu hợp lệ.'));
          return;
        }

        // Auto-detect columns by header keywords
        const keys = Object.keys(dataRows[0]);
        const findCol = (keywords) => {
          for (const kw of keywords) {
            const found = keys.find(k => k.toLowerCase().includes(kw.toLowerCase()));
            if (found) return found;
          }
          return null;
        };

        const colTC = findCol(['Tiêu chí', 'tieu chi']) || keys[0];
        const colND = findCol(['Nội dung', 'noi dung']) || keys[1];
        const colSTT = findCol(['Mục', 'STT', 'muc']) || keys[2];
        const colDK = findCol(['Điều kiện', 'dieu kien']) || keys[3];
        const colYC = findCol(['Yêu cầu', 'yeu cau', 'minh chứng']) || keys[4];
        const colTo = findCol(['Tổ theo dõi', 'to theo doi', 'Tổ']) || keys[5];
        const colDiem = findCol(['Khung điểm', 'khung diem', 'Điểm', 'diem']) || keys[6];
        const colDeadline = findCol(['Thời hạn', 'thoi han', 'hạn nộp']) || keys[7];
        const colUnit = findCol(['Đơn vị', 'don vi', 'áp dụng']) || keys[8] || null;

        // Build flat rows for editable table + structure
        const flatRows = [];
        let currentTCTitle = '';
        let currentNDTitle = '';
        let firstYear = null;

        for (const row of dataRows) {
          const tcVal = String(row[colTC] || '').trim();
          const ndVal = String(row[colND] || '').trim();
          const sttVal = row[colSTT];
          const dkVal = String(row[colDK] || '').trim();
          const ycVal = String(row[colYC] || '').trim();
          const toVal = String(row[colTo] || '').trim();
          const diemRaw = row[colDiem];
          const diemVal = parseScore(diemRaw);
          const deadlineVal = String(row[colDeadline] || '').trim();
          const unitVal = colUnit ? String(row[colUnit] || '').trim() : '';

          if (tcVal) currentTCTitle = tcVal;
          if (ndVal) currentNDTitle = ndVal;
          if (!firstYear && deadlineVal) firstYear = extractYear(deadlineVal);

          flatRows.push({
            tieuChi: tcVal || '',
            _tcTitle: currentTCTitle,
            noiDung: ndVal || '',
            _ndTitle: currentNDTitle,
            stt: sttVal ? Number(sttVal) : '',
            dieuKienCham: dkVal,
            yeucauMinhChung: ycVal,
            toTheoDoi: toVal,
            khungDiem: diemVal,
            khungDiemRaw: diemRaw,
            deadline: deadlineVal,
            donVi: unitVal,
          });
        }

        const suggestedYear = firstYear || String(new Date().getFullYear());

        resolve({ flatRows, suggestedYear });
      } catch (err) {
        reject(new Error('Không thể đọc file Excel: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file.'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Chuyển flatRows thành mảng criteria sets (mỗi tiêu chí = 1 set).
 * Trả về: { title, academicYear, units, tieuChi (1 TC obj), totalMaxScore }[]
 */
export const buildCriteriaSetsFromRows = (flatRows, year) => {
  const groupedByTC = [];
  let currentTC = null;
  let currentND = null;
  let tcIdx = 0, ndIdx = 0, mucIdx = 0;

  for (const row of flatRows) {
    // New TC?
    if (row.tieuChi || (!currentTC && row._tcTitle)) {
      const title = row.tieuChi || row._tcTitle;
      if (!currentTC || currentTC._title !== title) {
        tcIdx++;
        ndIdx = 0;
        currentTC = { _title: title, noiDung: [], units: new Set() };
        groupedByTC.push(currentTC);
        currentND = null;
      }
    }
    if (!currentTC) continue;

    // Collect units
    if (row.donVi) currentTC.units.add(row.donVi);

    // New ND?
    if (row.noiDung || (!currentND && row._ndTitle)) {
      const ndTitle = row.noiDung || row._ndTitle;
      if (!currentND || currentND._title !== ndTitle) {
        ndIdx++;
        currentND = { _title: ndTitle, muc: [] };
        currentTC.noiDung.push(currentND);
      }
    }
    if (!currentND) {
      ndIdx++;
      currentND = { _title: 'Nội dung chung', muc: [] };
      currentTC.noiDung.push(currentND);
    }

    // Add mục
    mucIdx++;
    currentND.muc.push({
      id: `m_${mucIdx}`,
      stt: row.stt || mucIdx,
      dieuKienCham: row.dieuKienCham,
      yeucauMinhChung: row.yeucauMinhChung,
      toTheoDoi: row.toTheoDoi,
      khungDiem: row.khungDiem,
      deadline: row.deadline,
    });
  }

  // Convert to criteria sets
  return groupedByTC.map((tc, i) => {
    let totalScore = 0;
    const noiDungArr = tc.noiDung.map((nd, j) => {
      const mucArr = nd.muc.map(m => { totalScore += (Number(m.khungDiem) || 0); return m; });
      return { id: `nd_${i + 1}_${j + 1}`, title: nd._title, muc: mucArr };
    });

    return {
      title: tc._title,
      academicYear: year,
      description: '',
      targetBlocks: [],
      targetTypes: [],
      donViText: [...tc.units].join(', '),
      tieuChi: [{
        id: `tc_${i + 1}`,
        title: tc._title,
        totalScore,
        assignedTo: null,
        noiDung: noiDungArr,
      }],
      totalMaxScore: totalScore,
      isActive: true,
    };
  });
};


/**
 * Export bộ tiêu chí hiện có ra file Excel (9 cột)
 */
export const exportCriteriaSetToExcel = (criteriaSet) => {
  const rows = [];

  (criteriaSet.tieuChi || []).forEach(tc => {
    let isFirstRowOfTC = true;
    (tc.noiDung || []).forEach(nd => {
      let isFirstRowOfND = true;
      (nd.muc || []).forEach(m => {
        const r = {};
        r[CRITERIA_HEADERS[0]] = isFirstRowOfTC ? tc.title : '';
        r[CRITERIA_HEADERS[1]] = isFirstRowOfND ? nd.title : '';
        r[CRITERIA_HEADERS[2]] = m.stt || '';
        r[CRITERIA_HEADERS[3]] = m.dieuKienCham || '';
        r[CRITERIA_HEADERS[4]] = m.yeucauMinhChung || '';
        r[CRITERIA_HEADERS[5]] = m.toTheoDoi || '';
        r[CRITERIA_HEADERS[6]] = m.khungDiem || 0;
        r[CRITERIA_HEADERS[7]] = m.deadline || '';
        r[CRITERIA_HEADERS[8]] = '';
        rows.push(r);
        isFirstRowOfTC = false;
        isFirstRowOfND = false;
      });
    });
  });

  if (rows.length === 0) {
    const r = {};
    r[CRITERIA_HEADERS[0]] = '(Bộ tiêu chí trống)';
    rows.push(r);
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 40 }, { wch: 35 }, { wch: 10 }, { wch: 40 },
    { wch: 45 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bộ Tiêu Chí');
  const safeName = (criteriaSet.title || 'bo-tieu-chi').replace(/[^a-zA-Z0-9\u00C0-\u1EF9 ]/g, '').trim().replace(/\s+/g, '_');
  XLSX.writeFile(wb, `${safeName}.xlsx`);
};


// ======================================
// UNITS — Export template
// ======================================

export const exportUnitTemplate = () => {
  const rows = [];
  let stt = 1;

  rows.push({
    'STT': 'Hướng dẫn',
    'Tên đơn vị': '(Nhập tên cơ sở)',
    'Email': '(Email Google để đăng nhập)',
    'Khối': '(Chọn khối)',
    'Loại': '(Chọn theo Khối)',
    'Ghi chú': '',
  });

  rows.push({ 'STT': '', 'Tên đơn vị': '', 'Email': '', 'Khối': '', 'Loại': '', 'Ghi chú': '' });

  const sampleData = [
    { name: 'Đoàn TN xã An Hưng', block: 'Khối Xã, Phường, Đặc khu', type: 'Xã' },
    { name: 'Đoàn TN phường Nam Đồ Sơn', block: 'Khối Xã, Phường, Đặc khu', type: 'Phường' },
    { name: 'Đoàn TN Đại học Hàng Hải', block: 'Khối Đại học - Cao đẳng', type: 'Đại học' },
    { name: 'Đoàn TN các cơ quan Đảng TP', block: 'Khối Công nhân viên chức', type: 'Công nhân viên chức' },
    { name: 'Đoàn Bộ chỉ huy quân sự TP', block: 'Khối Lực lượng vũ trang', type: 'Lực lượng vũ trang' },
  ];

  sampleData.forEach(item => {
    rows.push({ 'STT': stt++, 'Tên đơn vị': item.name, 'Email': '', 'Khối': item.block, 'Loại': item.type, 'Ghi chú': '' });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 38 }, { wch: 30 }, { wch: 35 }, { wch: 25 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách Đơn vị');
  XLSX.writeFile(wb, 'mau_danh_sach_don_vi.xlsx');
};

// ======================================
// TASKS — Export
// ======================================

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
    { wch: 5 }, { wch: 40 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
    { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Công việc');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`);
};
