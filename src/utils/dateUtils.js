// Utility functions cho ngày tháng
import { formatDistanceToNow, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { vi } from 'date-fns/locale';

const TZ = 'Asia/Ho_Chi_Minh';

// Format ngày hiển thị
export const formatDate = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return formatInTimeZone(d, TZ, 'dd/MM/yyyy', { locale: vi });
};

// Format ngày hiển thị an toàn cho cả Firestore Timestamp, Date, yyyy-MM-dd và dd/MM/yyyy.
export const formatDisplayDate = (date) => {
  if (!date) return '';
  if (date?.toDate || date instanceof Date) return formatDate(date);

  if (typeof date === 'string') {
    const value = date.trim();
    const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;

    const vnDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (vnDate) {
      const day = vnDate[1].padStart(2, '0');
      const month = vnDate[2].padStart(2, '0');
      return `${day}/${month}/${vnDate[3]}`;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return formatDate(parsed);
    return value;
  }

  return formatDate(date);
};

// Format ngày + giờ (tự động 24h vì dùng HH)
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return formatInTimeZone(d, TZ, 'dd/MM/yyyy HH:mm', { locale: vi });
};

// Format thời gian tương đối
export const formatRelative = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return formatDistanceToNow(d, { addSuffix: true, locale: vi });
};

// Format cho input datetime-local form (hiển thị giờ VN)
export const formatForInput = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return formatInTimeZone(d, TZ, "yyyy-MM-dd'T'HH:mm");
};

// Ép parse input string string ('2024-05-20T14:30') thành giờ VN
export const parseVNTime = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  if (dateInput.toDate) return dateInput.toDate();
  // Datetime-local (vd. yyyy-MM-ddThh:mm)
  if (typeof dateInput === 'string' && dateInput.length === 16) {
    return new Date(`${dateInput}+07:00`);
  }
  return new Date(dateInput);
};

// Kiểm tra task trong khoảng thời gian
export const isTaskInRange = (task, filter) => {
  const deadline = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline);

  switch (filter) {
    case 'today':
      return isToday(deadline);
    case 'week':
      return isThisWeek(deadline, { locale: vi, weekStartsOn: 1 });
    case 'month':
      return isThisMonth(deadline);
    case 'all':
    default:
      return true;
  }
};

// Lấy khoảng thời gian cho filter
export const getDateRange = (filter) => {
  const now = new Date();
  switch (filter) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    default:
      return null;
  }
};

// Parse chuỗi ngày linh hoạt (yyyy-MM-dd, dd/MM/yyyy, hoặc chuỗi khác) thành Date.
// Trả về null nếu rỗng hoặc không parse được — dùng làm `selected` cho DatePicker.
export const parseFlexibleDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const d = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const vnMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vnMatch) {
    const [, day, month, year] = vnMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
