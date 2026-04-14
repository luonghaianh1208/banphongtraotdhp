// Logic tính trạng thái hiển thị task dựa trên deadline
import { differenceInHours, differenceInDays } from 'date-fns';
import { TASK_DISPLAY_STATUS } from './constants';

// Tính trạng thái hiển thị dựa trên deadline và trạng thái task
export const getTaskDisplayStatus = (task) => {
  // Đã hoàn thành
  if (task.isCompleted) return TASK_DISPLAY_STATUS.COMPLETED;

  // Chờ duyệt
  if (task.status === 'pending_approval') return TASK_DISPLAY_STATUS.PENDING_APPROVAL;

  // Đã gia hạn
  if (task.status === 'extended') return TASK_DISPLAY_STATUS.EXTENDED;

  const now = new Date();
  const deadline = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline);
  const hoursLeft = differenceInHours(deadline, now);
  const daysLeft = differenceInDays(deadline, now);

  // Đã qua deadline
  if (hoursLeft < 0) return TASK_DISPLAY_STATUS.OVERDUE;

  // Còn dưới 24 giờ
  if (hoursLeft < 24) return TASK_DISPLAY_STATUS.URGENT;

  // Còn 1-3 ngày
  if (daysLeft <= 3) return TASK_DISPLAY_STATUS.NEAR_DUE;

  // Còn hơn 3 ngày
  return TASK_DISPLAY_STATUS.NOT_DUE;
};

// Đếm task theo trạng thái cho dashboard
export const countTasksByStatus = (tasks) => {
  const counts = {
    notDue: 0,
    nearDue: 0,
    urgent: 0,
    overdue: 0,
    extended: 0,
    pendingApproval: 0,
    completed: 0,
    total: tasks.length,
  };

  tasks.forEach(task => {
    const status = getTaskDisplayStatus(task);
    switch (status) {
      case TASK_DISPLAY_STATUS.NOT_DUE: counts.notDue++; break;
      case TASK_DISPLAY_STATUS.NEAR_DUE: counts.nearDue++; break;
      case TASK_DISPLAY_STATUS.URGENT: counts.urgent++; break;
      case TASK_DISPLAY_STATUS.OVERDUE: counts.overdue++; break;
      case TASK_DISPLAY_STATUS.EXTENDED: counts.extended++; break;
      case TASK_DISPLAY_STATUS.PENDING_APPROVAL: counts.pendingApproval++; break;
      case TASK_DISPLAY_STATUS.COMPLETED: counts.completed++; break;
    }
  });

  return counts;
};

// Đếm task quá hạn theo thành viên
export const getOverdueByMember = (tasks, users) => {
  const overdueTasks = tasks.filter(t => {
    const status = getTaskDisplayStatus(t);
    return status === TASK_DISPLAY_STATUS.OVERDUE;
  });

  const byMember = {};
  overdueTasks.forEach(task => {
    (task.assignees || []).forEach(uid => {
      if (!byMember[uid]) {
        const user = users.find(u => u.id === uid);
        byMember[uid] = { user: user || { displayName: 'Không rõ' }, tasks: [] };
      }
      byMember[uid].tasks.push(task);
    });
  });

  return Object.values(byMember).sort((a, b) => b.tasks.length - a.tasks.length);
};

// Lọc task theo nhiều điều kiện
export const filterTasks = (tasks, filters) => {
  return tasks.filter(task => {
    // Lọc theo người thực hiện
    if (filters.assignee && !task.assignees?.includes(filters.assignee)) return false;

    // Lọc theo phân loại
    if (filters.category) {
      const taskCat = task.category || 'other';
      if (taskCat !== filters.category) return false;
    }

    // Lọc theo trạng thái
    if (filters.status) {
      const displayStatus = getTaskDisplayStatus(task);
      if (filters.status === 'completed' && displayStatus !== TASK_DISPLAY_STATUS.COMPLETED) return false;
      if (filters.status === 'overdue' && displayStatus !== TASK_DISPLAY_STATUS.OVERDUE) return false;
      if (filters.status === 'urgent' && displayStatus !== TASK_DISPLAY_STATUS.URGENT) return false;
      if (filters.status === 'nearDue' && displayStatus !== TASK_DISPLAY_STATUS.NEAR_DUE) return false;
      if (filters.status === 'notDue' && displayStatus !== TASK_DISPLAY_STATUS.NOT_DUE) return false;
      if (filters.status === 'extended' && displayStatus !== TASK_DISPLAY_STATUS.EXTENDED) return false;
      if (filters.status === 'pendingApproval' && displayStatus !== TASK_DISPLAY_STATUS.PENDING_APPROVAL) return false;
      if (filters.status === 'active' && displayStatus === TASK_DISPLAY_STATUS.COMPLETED) return false;
    }

    // Lọc theo độ ưu tiên
    if (filters.priority && task.priority !== filters.priority) return false;

    // Lọc theo khoảng thời gian
    if (filters.dateFrom) {
      const deadline = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline);
      if (deadline < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const deadline = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline);
      if (deadline > new Date(filters.dateTo)) return false;
    }

    // Tìm kiếm theo text
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!task.title?.toLowerCase().includes(searchLower)) return false;
    }

    return true;
  });
};
