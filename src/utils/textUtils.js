/**
 * Utility: Xử lý text tiếng Việt — bỏ dấu, sinh username
 */

/**
 * Bỏ toàn bộ dấu tiếng Việt, trả về chuỗi ASCII lowercase.
 * VD: "Đoàn phường Lê Thanh Nghị" → "doan phuong le thanh nghi"
 */
export const removeVietnameseTones = (str) => {
  if (!str) return '';
  let s = str;
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  s = s.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'a');
  s = s.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'e');
  s = s.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'i');
  s = s.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'o');
  s = s.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'u');
  s = s.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'y');
  s = s.replace(/Đ/g, 'd');
  s = s.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '');
  s = s.replace(/\u02C6|\u0306|\u031B/g, '');
  return s.toLowerCase().trim();
};

// Các prefix thường gặp trong tên đơn vị, sẽ bị lược bỏ khi sinh username
const UNIT_PREFIXES = [
  'doan tncs ho chi minh',
  'doan thanh nien cong san ho chi minh',
  'doan thanh nien',
  'doan tn',
  'doan',
  'hoi lien hiep thanh nien',
  'hoi lhtn',
  'hoi sinh vien',
  'hoi',
  'chi doan',
  'lien chi doan',
  'ban chap hanh doan',
];

/**
 * Sinh username từ tên đơn vị.
 * Loại bỏ prefix tổ chức → lấy tên riêng → viết liền không dấu → thêm .tdhp
 * VD: "Đoàn phường Lê Thanh Nghị" → "lethanhnghi.tdhp"
 *     "Đoàn TN Đại học Hàng Hải" → "daihochanhai.tdhp"
 *     "Chi đoàn 12A1" → "12a1.tdhp"
 */
export const generateUsername = (unitName) => {
  if (!unitName) return '';
  let cleaned = removeVietnameseTones(unitName);

  // Loại bỏ các prefix tổ chức (thử từ dài nhất → ngắn nhất)
  const sorted = [...UNIT_PREFIXES].sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (cleaned.startsWith(prefix + ' ')) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  // Bỏ các từ bổ nghĩa vị trí: "phuong", "xa", "thi tran", "quan", "huyen", "thanh pho", "tp"
  const locationPrefixes = [
    'thi tran', 'thanh pho', 'tp', 'phuong', 'xa', 'quan', 'huyen',
    'cac co quan', 'co quan', 'truong', 'dai hoc', 'cao dang',
    'bo chi huy', 'luc luong',
  ];
  const locSorted = [...locationPrefixes].sort((a, b) => b.length - a.length);
  for (const loc of locSorted) {
    if (cleaned.startsWith(loc + ' ')) {
      cleaned = cleaned.slice(loc.length).trim();
      break;
    }
  }

  // Viết liền không dấu, bỏ ký tự đặc biệt, giữ chữ cái và số
  const username = cleaned.replace(/[^a-z0-9]/g, '');

  return username ? `${username}.tdhp` : '';
};

export const DEFAULT_UNIT_PASSWORD = 'abc@123.';
