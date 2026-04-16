// Hook tự động nhắc việc cho tất cả nhân viên có task đang hoạt động
// Client-side: chỉ chạy khi admin mở app, kiểm tra giờ cấu hình, nhắc tối đa 1 lần/ngày
// Dùng localStorage (không phải sessionStorage) để flag tồn tại khi đóng/mở lại trình duyệt
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTaskConfig } from '../context/TaskConfigContext';
import { useTasks } from './useTasks';
import { addNotification } from '../firebase/firestore';
import { getTaskDisplayStatus } from '../utils/statusUtils';
import { TASK_DISPLAY_STATUS } from '../utils/constants';

// Key lưu localStorage — tránh nhắc nhiều lần trong cùng 1 ngày
const getStorageKey = () => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `autoReminder_${today}`;
};

// Dọn key cũ (ngày hôm qua trở về trước) để không rác localStorage
const cleanOldReminderKeys = () => {
  const todayKey = getStorageKey();
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('autoReminder_') && key !== todayKey) {
      localStorage.removeItem(key);
    }
  }
};

export const useAutoReminder = () => {
  const { currentUser, isAdmin } = useAuth();
  const { reminderConfig } = useTaskConfig();
  const { tasks } = useTasks();
  const isProcessingRef = useRef(false);

  const sendReminders = useCallback(async () => {
    if (!isAdmin || !currentUser) return;
    if (isProcessingRef.current) return;

    // Kiểm tra đã nhắc hôm nay chưa (localStorage)
    const storageKey = getStorageKey();
    if (localStorage.getItem(storageKey)) return;

    // Lọc tasks đang hoạt động (chưa hoàn thành, chưa xóa)
    const activeTasks = tasks.filter(task => {
      if (task.isCompleted || task.isDeleted) return false;
      const status = getTaskDisplayStatus(task);
      // Nhắc cho: quá hạn, cần gấp, gần hạn
      return [
        TASK_DISPLAY_STATUS.OVERDUE,
        TASK_DISPLAY_STATUS.URGENT,
        TASK_DISPLAY_STATUS.NEAR_DUE,
      ].includes(status);
    });

    if (activeTasks.length === 0) return;

    isProcessingRef.current = true;

    try {
      // Nhóm tasks theo assignee
      const tasksByUser = {};
      activeTasks.forEach(task => {
        (task.assignees || []).forEach(userId => {
          if (!tasksByUser[userId]) tasksByUser[userId] = [];
          tasksByUser[userId].push(task);
        });
      });

      // Gửi 1 notification tổng hợp cho mỗi nhân viên
      let sentCount = 0;
      for (const [userId, userTasks] of Object.entries(tasksByUser)) {
        // Không gửi cho chính admin
        if (userId === currentUser.uid) continue;

        const overdueCount = userTasks.filter(t => getTaskDisplayStatus(t) === TASK_DISPLAY_STATUS.OVERDUE).length;
        const urgentCount = userTasks.filter(t => getTaskDisplayStatus(t) === TASK_DISPLAY_STATUS.URGENT).length;
        const nearDueCount = userTasks.filter(t => getTaskDisplayStatus(t) === TASK_DISPLAY_STATUS.NEAR_DUE).length;

        const parts = [];
        if (overdueCount > 0) parts.push(`${overdueCount} quá hạn`);
        if (urgentCount > 0) parts.push(`${urgentCount} cần gấp`);
        if (nearDueCount > 0) parts.push(`${nearDueCount} gần hạn`);

        const message = `Bạn hiện có ${userTasks.length} công việc cần xử lý (${parts.join(', ')}). Vui lòng kiểm tra và cập nhật tiến độ!`;

        try {
          await addNotification(
            userId,
            '⏰ Nhắc việc tự động',
            message,
            overdueCount > 0 ? 'urgent' : 'warning',
            null
          );
          sentCount++;
        } catch (err) {
          console.error(`[AutoReminder] Lỗi gửi nhắc cho user ${userId}:`, err);
        }
      }

      // Đánh dấu đã nhắc hôm nay + dọn key cũ
      localStorage.setItem(storageKey, 'true');
      cleanOldReminderKeys();
      console.log(`[AutoReminder] Đã gửi nhắc việc cho ${sentCount} nhân viên.`);
    } finally {
      isProcessingRef.current = false;
    }
  }, [isAdmin, currentUser, tasks]);

  // Kiểm tra: cấu hình BẬT + giờ hiện tại >= giờ cấu hình → gửi nhắc
  useEffect(() => {
    if (!isAdmin || !currentUser || tasks.length === 0) return;
    if (!reminderConfig?.enabled) return;

    // Kiểm tra đã nhắc hôm nay chưa (tránh re-render loop)
    const storageKey = getStorageKey();
    if (localStorage.getItem(storageKey)) return;

    // So sánh giờ hiện tại với giờ cấu hình
    const now = new Date();
    const [configHour, configMin] = (reminderConfig.time || '08:00').split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const configMinutes = configHour * 60 + configMin;

    // Chỉ gửi nếu giờ hiện tại >= giờ cấu hình (admin mở app sau giờ nhắc)
    if (currentMinutes >= configMinutes) {
      const timeout = setTimeout(() => {
        sendReminders();
      }, 3000); // Chờ 3s để data load đầy đủ

      return () => clearTimeout(timeout);
    }
  }, [isAdmin, currentUser, tasks, reminderConfig, sendReminders]);
};
