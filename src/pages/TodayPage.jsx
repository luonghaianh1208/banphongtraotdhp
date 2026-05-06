import { useState, useMemo, useCallback } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { useTaskCRUD } from '../hooks/useTaskCRUD';
import {
  isToday, isThisWeek, startOfWeek, endOfWeek, addDays, format, isSameDay
} from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  MdAdd, MdToday, MdDateRange, MdList, MdCheckCircle,
  MdAccessTime, MdPerson, MdWarning
} from 'react-icons/md';
import { getTaskDisplayStatus } from '../utils/statusUtils';
import { handleApproveTask } from '../hooks/useTaskActions';
import { TASK_DISPLAY_STATUS } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/task/StatusBadge';
import TaskCard from '../components/task/TaskCard';
import TaskForm from '../components/task/TaskForm';
import TaskDetail from '../components/task/TaskDetail';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import PriorityBadge from '../components/task/PriorityBadge';

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

const TodayPage = () => {
  const { tasks, loading: tasksLoading } = useTasks();
  const { users, loading: usersLoading } = useUsers();
  const { currentUser, canManageTasks, canApprove } = useAuth();
  const { handleCreateTask, handleEditTask } = useTaskCRUD(currentUser);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [viewMode, setViewMode] = useState('week');

  const isLoading = tasksLoading || usersLoading;

  const activeTasks = useMemo(() => tasks.filter(t => !t.isCompleted), [tasks]);

  // Tuần hiện tại (T2 → CN)
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart.getTime()]);

  const weekLabel = `${format(weekStart, 'dd/MM')} – ${format(weekEnd, 'dd/MM/yyyy')}`;

  // Tất cả tasks trong tuần này
  const weekTasks = useMemo(() => activeTasks.filter(task => {
    const deadline = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline);
    return isThisWeek(deadline, { weekStartsOn: 1 });
  }), [activeTasks]);

  // Group tasks theo ngày trong tuần
  const tasksByDay = useMemo(() => {
    const map = {};
    weekDays.forEach(day => { map[day.toDateString()] = []; });
    weekTasks.forEach(task => {
      const deadline = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline);
      const key = deadline.toDateString();
      if (map[key]) map[key].push(task);
    });
    // Sort mỗi ngày theo priority
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => {
        const statusA = getTaskDisplayStatus(a);
        const statusB = getTaskDisplayStatus(b);
        const order = [TASK_DISPLAY_STATUS.OVERDUE, TASK_DISPLAY_STATUS.URGENT, TASK_DISPLAY_STATUS.NEAR_DUE, TASK_DISPLAY_STATUS.NOT_DUE, TASK_DISPLAY_STATUS.EXTENDED];
        return order.indexOf(statusA) - order.indexOf(statusB);
      });
    });
    return map;
  }, [weekDays, weekTasks]);

  // Tasks cho tab "Tất cả"
  const allSortedTasks = useMemo(() => [...activeTasks].sort((a, b) => {
    const statusA = getTaskDisplayStatus(a);
    const statusB = getTaskDisplayStatus(b);
    const order = [TASK_DISPLAY_STATUS.OVERDUE, TASK_DISPLAY_STATUS.URGENT, TASK_DISPLAY_STATUS.NEAR_DUE, TASK_DISPLAY_STATUS.NOT_DUE, TASK_DISPLAY_STATUS.EXTENDED];
    const idxA = order.indexOf(statusA);
    const idxB = order.indexOf(statusB);
    if (idxA !== idxB) return idxA - idxB;
    const deadlineA = a.deadline?.toDate ? a.deadline.toDate() : new Date(a.deadline);
    const deadlineB = b.deadline?.toDate ? b.deadline.toDate() : new Date(b.deadline);
    return deadlineA - deadlineB;
  }), [activeTasks]);

  const urgentCount = useMemo(() => activeTasks.filter(t => {
    const s = getTaskDisplayStatus(t);
    return s === TASK_DISPLAY_STATUS.URGENT || s === TASK_DISPLAY_STATUS.OVERDUE;
  }).length, [activeTasks]);

  const handleApprove = useCallback(async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await handleApproveTask(task, currentUser.uid);
  }, [tasks, handleApproveTask, currentUser?.uid]);

  // User lookup
  const userMap = useMemo(() => {
    const m = {};
    (users || []).forEach(u => { m[u.id] = u; });
    return m;
  }, [users]);

  if (isLoading) return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10 animate-fade-in">
      <div className="space-y-3">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
            <div className="h-5 w-3/5 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 h-48 animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Việc hôm nay
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase text-[11px] tracking-[0.2em]">
            Tập trung hoàn thành các mục tiêu quan trọng
          </p>
        </div>

        {canManageTasks && (
          <button
            onClick={() => setShowCreate(true)}
            className="group relative px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="flex items-center gap-2.5 relative z-10">
              <MdAdd size={22} className="group-hover:rotate-90 transition-transform duration-500" />
              <span>Tạo việc mới</span>
            </div>
          </button>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up delay-100">
        <StatCard
          icon={MdList}
          label="Đang làm"
          value={activeTasks.length}
          gradient="from-emerald-500/20 to-emerald-500/5"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={MdDateRange}
          label="Cần gấp"
          value={urgentCount}
          gradient="from-rose-500/20 to-rose-500/5"
          iconColor="text-rose-600"
        />
        <StatCard
          icon={MdToday}
          label="Hôm nay"
          value={activeTasks.filter(t => isToday(t.deadline?.toDate ? t.deadline.toDate() : new Date(t.deadline))).length}
          gradient="from-sky-500/20 to-sky-500/5"
          iconColor="text-sky-600"
        />
        <StatCard
          icon={MdCheckCircle}
          label="Đã xong"
          value={tasks.filter(t => t.isCompleted).length}
          gradient="from-teal-500/20 to-teal-500/5"
          iconColor="text-teal-600"
        />
      </div>

      <div className="animate-fade-in-up delay-200">
        {/* Filter Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            {[
              { value: 'week', icon: MdDateRange, label: `Tuần này (${weekLabel})` },
              { value: 'all', icon: MdList, label: 'Tất cả' },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setViewMode(value)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === value
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/10 scale-[1.02] border border-emerald-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{value === 'week' ? 'Tuần' : 'Tất cả'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content by mode */}
        {viewMode === 'week' ? (
          <WeeklyTimetable
            weekDays={weekDays}
            tasksByDay={tasksByDay}
            userMap={userMap}
            onTaskClick={setSelectedTask}
            onApprove={handleApprove}
            canApprove={canApprove}
          />
        ) : (
          /* Tab "Tất cả" — giữ nguyên */
          allSortedTasks.length === 0 ? (
            <div className="py-12 glass-card">
              <EmptyState
                icon={MdToday}
                title="Không tìm thấy việc nào"
                message="Có vẻ như bạn đã hoàn thành hết công việc hoặc chưa có việc mới được giao."
              />
            </div>
          ) : (
            <div className="space-y-4">
              {allSortedTasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${(idx + 3) * 100}ms` }}
                >
                  <TaskCard
                    task={task}
                    users={users}
                    onClick={setSelectedTask}
                    onApprove={handleApprove}
                    canApprove={canApprove}
                  />
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal tạo task */}
      <Modal
        isOpen={showCreate || !!editTask}
        onClose={() => { setShowCreate(false); setEditTask(null); }}
        title={editTask ? 'Cập nhật công việc' : 'Tạo công việc mới'}
        size="lg"
      >
        <TaskForm
          task={editTask}
          users={users}
          currentUser={currentUser}
          onSubmit={editTask
            ? (data) => handleEditTask(editTask.id, data)
            : handleCreateTask
          }
          onClose={() => { setShowCreate(false); setEditTask(null); }}
        />
      </Modal>

      {/* Modal chi tiết task */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Chi tiết công việc"
        size="lg"
      >
        <TaskDetail
          task={selectedTask}
          users={users}
          onClose={() => setSelectedTask(null)}
          onEdit={(t) => { setSelectedTask(null); setEditTask(t); }}
        />
      </Modal>
    </div>
  );
};

// ========== WEEKLY TIMETABLE COMPONENT ==========
const WeeklyTimetable = ({ weekDays, tasksByDay, userMap, onTaskClick, onApprove, canApprove }) => {
  const today = new Date();

  const totalWeekTasks = Object.values(tasksByDay).reduce((sum, arr) => sum + arr.length, 0);

  if (totalWeekTasks === 0) {
    return (
      <div className="py-12 glass-card">
        <EmptyState
          icon={MdDateRange}
          title="Tuần này rảnh rang!"
          message="Không có công việc nào có deadline trong tuần này."
        />
      </div>
    );
  }

  return (
    <div>
      {/* === Desktop: Grid 7 cột === */}
      <div className="hidden lg:grid grid-cols-7 gap-3">
        {weekDays.map((day, idx) => {
          const isCurrentDay = isSameDay(day, today);
          const dayTasks = tasksByDay[day.toDateString()] || [];
          const dayNum = format(day, 'd');
          const monthLabel = format(day, 'MM');

          return (
            <div
              key={idx}
              className={`rounded-2xl border-2 transition-all duration-500 min-h-[220px] flex flex-col ${
                isCurrentDay
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Day header */}
              <div className={`px-3 py-2.5 border-b text-center ${
                isCurrentDay
                  ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-500/10'
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
              }`}>
                <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${
                  isCurrentDay ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {DAY_LABELS[idx]}
                </p>
                <p className={`text-lg font-black mt-0.5 ${
                  isCurrentDay ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {dayNum}<span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">/{monthLabel}</span>
                </p>
                {isCurrentDay && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Hôm nay</span>
                  </div>
                )}
              </div>

              {/* Task cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[400px] scrollbar-hide">
                {dayTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-full opacity-30">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Trống</p>
                  </div>
                ) : (
                  dayTasks.map(task => (
                    <MiniTaskCard
                      key={task.id}
                      task={task}
                      userMap={userMap}
                      onClick={() => onTaskClick(task)}
                      onApprove={onApprove}
                      canApprove={canApprove}
                    />
                  ))
                )}
              </div>

              {/* Task count footer */}
              {dayTasks.length > 0 && (
                <div className={`px-3 py-1.5 border-t text-center ${
                  isCurrentDay
                    ? 'border-emerald-200 dark:border-emerald-800/50'
                    : 'border-slate-100 dark:border-slate-800'
                }`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    isCurrentDay ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {dayTasks.length} việc
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* === Mobile: Dọc === */}
      <div className="lg:hidden space-y-4">
        {weekDays.map((day, idx) => {
          const isCurrentDay = isSameDay(day, today);
          const dayTasks = tasksByDay[day.toDateString()] || [];
          const dayNum = format(day, 'dd/MM');

          return (
            <div
              key={idx}
              className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                isCurrentDay
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50'
              }`}
            >
              {/* Day header mobile */}
              <div className={`px-4 py-3 flex items-center justify-between ${
                isCurrentDay
                  ? 'bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black ${
                    isCurrentDay ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {DAY_LABELS[idx]}
                  </span>
                  <span className={`text-xs font-bold ${
                    isCurrentDay ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                    {dayNum}
                  </span>
                  {isCurrentDay && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Hôm nay
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  isCurrentDay ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {dayTasks.length} việc
                </span>
              </div>

              {/* Task cards mobile */}
              {dayTasks.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">Không có việc</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {dayTasks.map(task => (
                    <MiniTaskCard
                      key={task.id}
                      task={task}
                      userMap={userMap}
                      onClick={() => onTaskClick(task)}
                      onApprove={onApprove}
                      canApprove={canApprove}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========== MINI TASK CARD (Thẻ nhỏ trong ô ngày) ==========
const MiniTaskCard = ({ task, userMap, onClick, onApprove, canApprove }) => {
  const status = getTaskDisplayStatus(task);
  const assigneeNames = (task.assignees || [])
    .map(uid => userMap[uid]?.displayName?.split(' ').pop() || '?')
    .join(', ');

  const statusColorMap = {
    [TASK_DISPLAY_STATUS.OVERDUE]: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10',
    [TASK_DISPLAY_STATUS.URGENT]: 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/10',
    [TASK_DISPLAY_STATUS.NEAR_DUE]: 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10',
    [TASK_DISPLAY_STATUS.NOT_DUE]: 'border-l-emerald-500 bg-white dark:bg-slate-800/50',
    [TASK_DISPLAY_STATUS.EXTENDED]: 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10',
    [TASK_DISPLAY_STATUS.PENDING_APPROVAL]: 'border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/10',
  };

  const cardColor = statusColorMap[status] || 'border-l-slate-300 bg-white dark:bg-slate-800/50';

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
      className={`border-l-[3px] rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group ${cardColor}`}
    >
      {/* Title */}
      <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        {task.title}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {assigneeNames && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <MdPerson size={11} className="text-slate-400" />
            {assigneeNames}
          </span>
        )}
      </div>

      {/* Approve button */}
      {canApprove && !task.isCompleted && status === TASK_DISPLAY_STATUS.PENDING_APPROVAL && (
        <button
          onClick={(e) => { e.stopPropagation(); onApprove(task.id); }}
          className="mt-1.5 flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-500 hover:text-white transition-all"
        >
          <MdCheckCircle size={12} />
          Duyệt
        </button>
      )}
    </div>
  );
};

// ========== STAT CARD ==========
const StatCard = ({ icon: Icon, label, value, gradient, iconColor }) => (
  <div className={`glass-card p-6 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden border-white/40 dark:border-white/5`}>
    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} opacity-20 rounded-full blur-2xl group-hover:opacity-40 transition-opacity duration-700`} />
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 ${iconColor} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={22} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 leading-none">{label}</span>
      </div>
      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
    </div>
    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100/50 dark:bg-slate-800/50 overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${gradient} w-0 group-hover:w-full transition-all duration-1000 ease-out`} />
    </div>
  </div>
);

export default TodayPage;
