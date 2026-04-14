// Utility functions cho ngày tháng
import { formatDistanceToNow, isToday, isThisWeek, isThisMonth, differenceInHours, differenceInDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { vi } from 'date-fns/locale';

const TZ = 'Asia/Ho_Chi_Minh';

// Format ngày hiển thị
export const formatDate = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return formatInTimeZone(d, TZ, 'dd/MM/yyyy', { locale: vi });
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
  const now = new Date();

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
