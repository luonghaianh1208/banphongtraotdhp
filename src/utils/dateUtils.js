// Utility functions cho ngày tháng
import { format, formatDistanceToNow, isToday, isThisWeek, isThisMonth, differenceInHours, differenceInDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';

// Format ngày hiển thị
export const formatDate = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, 'dd/MM/yyyy', { locale: vi });
};

// Format ngày + giờ
export const formatDateTime = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, 'dd/MM/yyyy HH:mm', { locale: vi });
};

// Format thời gian tương đối ("2 giờ trước", "3 ngày trước")
export const formatRelative = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return formatDistanceToNow(d, { addSuffix: true, locale: vi });
};

// Format cho input datetime-local
export const formatForInput = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, "yyyy-MM-dd'T'HH:mm");
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
