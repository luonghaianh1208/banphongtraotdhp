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

// Sắp xếp công việc theo mức độ cấp bách để thúc đẩy tiến độ
export const sortTasksProactively = (tasks) => {
  // Trọng số trạng thái (càng nhỏ càng ưu tiên nổi lên trên)
  const getStatusWeight = (task) => {
    const status = getTaskDisplayStatus(task);
    if (status === TASK_DISPLAY_STATUS.OVERDUE) return 1;
    if (status === TASK_DISPLAY_STATUS.URGENT) return 2;
    if (status === TASK_DISPLAY_STATUS.NEAR_DUE) return 3;
    if (status === TASK_DISPLAY_STATUS.PENDING_APPROVAL) return 4;
    // EXTENDED cũng coi như NOT_DUE nhưng ít gấp hơn xíu => 5. NOT_DUE thì 5
    if (status === TASK_DISPLAY_STATUS.NOT_DUE) return 5;
    if (status === TASK_DISPLAY_STATUS.EXTENDED) return 6;
    if (status === TASK_DISPLAY_STATUS.COMPLETED) return 7;
    return 99;
  };

  // Trọng số Priority
  const getPriorityWeight = (priorityStr) => {
    if (priorityStr === 'high') return 1;
    if (priorityStr === 'medium') return 2;
    return 3;
  };

  return [...tasks].sort((a, b) => {
    // Ưu tiên 1: Trạng thái bấp bênh thời gian
    const swA = getStatusWeight(a);
    const swB = getStatusWeight(b);
    if (swA !== swB) return swA - swB;

    // Ưu tiên 2: Mức độ ưu tiên của cấu hình (Cao -> Trung Bình -> Thấp)
    const pwA = getPriorityWeight(a.priority);
    const pwB = getPriorityWeight(b.priority);
    if (pwA !== pwB) return pwA - pwB;

    // Ưu tiên 3: Nếu cùng mức độ, thằng nào có deadline sớm hơn thì đưa lên
    const dlA = a.deadline?.toMillis ? a.deadline.toMillis() : new Date(a.deadline || 0).getTime();
    const dlB = b.deadline?.toMillis ? b.deadline.toMillis() : new Date(b.deadline || 0).getTime();
    if (dlA !== dlB && dlA > 0 && dlB > 0) return dlA - dlB;

    // Default: mới tạo nhất nằm trên
    const caA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
    const caB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
    return caB - caA;
  });
};
