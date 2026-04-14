// Shared task action helpers — tập trung logic approve/extend để tránh duplicate
import { updateTask } from '../firebase/firestore';
import { approveTask as callApproveTask, extendDeadline as callExtendDeadline } from '../firebase/functions';
import { formatDateTime } from '../utils/dateUtils';
import toast from 'react-hot-toast';

// Duyệt hoàn thành task — thử Cloud Function trước, fallback Firestore trực tiếp
export const handleApproveTask = async (taskId, currentUserUid) => {
  try {
    await callApproveTask({ taskId });
  } catch {
    await updateTask(taskId, {
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
  toast.success('Đã duyệt hoàn thành');
};

// Gia hạn deadline — thử Cloud Function trước, fallback Firestore trực tiếp
export const handleExtendDeadline = async (task, newDeadline, currentUserUid) => {
  try {
    await callExtendDeadline({ taskId: task.id, newDeadline: new Date(newDeadline).toISOString() });
  } catch {
    await updateTask(task.id, {
      originalDeadline: task.originalDeadline || task.deadline,
      deadline: new Date(newDeadline),
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
