// Shared task action helpers — tập trung logic approve/extend để tránh duplicate
import { updateTask, addNotification } from '../firebase/firestore';
import { approveTask as callApproveTask, extendDeadline as callExtendDeadline } from '../firebase/functions';
import { formatDateTime, parseVNTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';

// Duyệt hoàn thành task — thử Cloud Function trước, fallback Firestore trực tiếp
export const handleApproveTask = async (task, currentUserUid) => {
  try {
    await callApproveTask({ taskId: task.id });
  } catch {
    await updateTask(task.id, {
      isCompleted: true,
      status: 'completed',
      completedAt: new Date(),
      completedBy: currentUserUid,
    }, currentUserUid, {
      action: 'approve',
      field: 'isCompleted',
      oldValue: false,
      newValue: true,
    });
  }
  
  if (task.assignees && task.assignees.length > 0) {
    task.assignees.forEach(userId => {
      addNotification(
        userId,
        'Duyệt hoàn thành',
        `Công việc đã được phê duyệt: ${task.title}`,
        'success',
        task.id
      );
    });
  }

  toast.success('Đã duyệt hoàn thành');
};

// Hủy duyệt hoàn thành (Revert complete) — fallback về đang thực hiện
export const handleRevertApproveTask = async (taskId, currentUserUid) => {
  try {
    await updateTask(taskId, {
      isCompleted: false,
      status: 'active',
      completedAt: null,
      completedBy: null,
    }, currentUserUid, {
      action: 'revert_approve',
      field: 'isCompleted',
      oldValue: true,
      newValue: false,
    });
    toast.success('Đã hủy trạng thái hoàn thành');
  } catch (err) {
    toast.error('Lỗi khi hủy trạng thái: ' + err.message);
  }
};

// Nhắc việc (không đổi priority, đánh dấu isReminded và gửi thông báo)
export const handleRemindTask = async (task, currentUserUid) => {
  await updateTask(task.id, {
    isReminded: true,
  }, currentUserUid, {
    action: 'remind',
    field: 'isReminded',
    oldValue: false,
    newValue: true,
  });
  
  if (task.assignees && task.assignees.length > 0) {
    task.assignees.forEach(userId => {
      addNotification(
        userId,
        '[NHẮC NHỞ] Khẩn trương',
        `Tổ trưởng vừa NHẮC NHỞ bạn đẩy nhanh tiến độ công việc: ${task.title}. Vui lòng kiểm tra ngay!`,
        'urgent',
        task.id
      );
    });
  }
};

// Gia hạn deadline — thử Cloud Function trước, fallback Firestore trực tiếp
export const handleExtendDeadline = async (task, newDeadline, currentUserUid) => {
  try {
    await callExtendDeadline({ taskId: task.id, newDeadline: parseVNTime(newDeadline).toISOString() });
  } catch {
    await updateTask(task.id, {
      originalDeadline: task.originalDeadline || task.deadline,
      deadline: parseVNTime(newDeadline),
      status: 'extended',
    }, currentUserUid, {
      action: 'extend',
      field: 'deadline',
      oldValue: formatDateTime(task.deadline),
      newValue: newDeadline,
    });
  }
  toast.success('Đã gia hạn deadline');
};
