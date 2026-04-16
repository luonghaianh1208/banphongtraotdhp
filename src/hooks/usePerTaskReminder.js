// Hook tự động nhắc việc PER-TASK
// Mỗi task có thể bật autoReminder + đặt autoReminderTime riêng
// Nhắc 1 lần/ngày/task, lặp lại hàng ngày cho đến khi task hoàn thành
// Dùng localStorage để tránh nhắc trùng trong cùng 1 ngày
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from './useTasks';
import { addNotification } from '../firebase/firestore';

// Key localStorage cho mỗi task mỗi ngày
const getStorageKey = (taskId) => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `perTaskReminder_${taskId}_${today}`;
};

// Dọn key cũ (ngày hôm qua trở về trước)
const cleanOldKeys = () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('perTaskReminder_') && !key.endsWith(todayStr)) {
      localStorage.removeItem(key);
    }
  }
};

export const usePerTaskReminder = () => {
  const { currentUser, canManageTasks } = useAuth();
  const { tasks } = useTasks();
  const isProcessingRef = useRef(false);

  const sendPerTaskReminders = useCallback(async () => {
    if (!canManageTasks || !currentUser) return;
    if (isProcessingRef.current) return;

    // Lọc tasks có autoReminder=true và chưa hoàn thành
    const autoReminderTasks = tasks.filter(task => {
      if (task.isCompleted || task.isDeleted) return false;
      if (!task.autoReminder) return false;
      return true;
    });

    if (autoReminderTasks.length === 0) return;

    // Kiểm tra giờ hiện tại
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Lọc tasks cần nhắc (giờ hiện tại >= giờ cấu hình + chưa nhắc hôm nay)
    const tasksToRemind = autoReminderTasks.filter(task => {
      const storageKey = getStorageKey(task.id);
      if (localStorage.getItem(storageKey)) return false; // Đã nhắc hôm nay

      const [h, m] = (task.autoReminderTime || '08:00').split(':').map(Number);
      const configMinutes = h * 60 + m;
      return currentMinutes >= configMinutes;
    });

    if (tasksToRemind.length === 0) return;

    isProcessingRef.current = true;

    try {
      for (const task of tasksToRemind) {
        const assignees = (task.assignees || []).filter(id => id !== currentUser.uid);

        for (const userId of assignees) {
          try {
            await addNotification(
              userId,
              '⏰ Nhắc việc tự động',
              `Nhắc nhở hàng ngày: Công việc "${task.title}" cần được hoàn thành. Vui lòng kiểm tra và cập nhật tiến độ!`,
              'warning',
              task.id
            );
          } catch (err) {
            console.error(`[PerTaskReminder] Lỗi gửi nhắc cho user ${userId}:`, err);
          }
        }

        // Đánh dấu đã nhắc task này hôm nay
        localStorage.setItem(getStorageKey(task.id), 'true');
      }

      cleanOldKeys();
      console.log(`[PerTaskReminder] Đã nhắc ${tasksToRemind.length} task tự động.`);
    } finally {
      isProcessingRef.current = false;
    }
  }, [canManageTasks, currentUser, tasks]);

  // Reactive: chạy khi tasks thay đổi (debounce 5s)
  useEffect(() => {
    if (!canManageTasks || !currentUser || tasks.length === 0) return;

    const timeoutId = setTimeout(() => {
      sendPerTaskReminders();
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [canManageTasks, currentUser, tasks, sendPerTaskReminders]);
};
