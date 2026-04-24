import { useState, useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { useTaskCRUD } from '../hooks/useTaskCRUD';
import { isToday, isThisWeek } from 'date-fns';
import { MdAdd, MdToday, MdDateRange, MdList, MdCheckCircle, MdTrendingUp, MdAssignment, MdWarning, MdKeyboardArrowRight } from 'react-icons/md';
import { getTaskDisplayStatus } from '../utils/statusUtils';
import { handleApproveTask } from '../hooks/useTaskActions';
import { TASK_DISPLAY_STATUS } from '../utils/constants';
import { TaskSkeleton, StatSkeleton } from '../components/common/Skeleton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/task/StatusBadge';
import TaskCard from '../components/task/TaskCard';
import TaskForm from '../components/task/TaskForm';
import TaskDetail from '../components/task/TaskDetail';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const TodayPage = () => {
  const { tasks, loading: tasksLoading } = useTasks();
  const { users, loading: usersLoading } = useUsers();
  const { currentUser, canManageTasks, canApprove } = useAuth();
  const { handleCreateTask, handleEditTask } = useTaskCRUD(currentUser);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [viewMode, setViewMode] = useState('today');

  const isLoading = tasksLoading || usersLoading;

  const activeTasks = useMemo(() => tasks.filter(t => !t.isCompleted), [tasks]);

  const filteredTasks = useMemo(() => activeTasks.filter(task => {
    const deadline = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline);
    switch (viewMode) {
      case 'today': return isToday(deadline);
      case 'week': return isThisWeek(deadline, { weekStartsOn: 1 });
      default: return true;
    }
  }), [activeTasks, viewMode]);

  const sortedTasks = useMemo(() => [...filteredTasks].sort((a, b) => {
    const statusA = getTaskDisplayStatus(a);
    const statusB = getTaskDisplayStatus(b);
    const order = [TASK_DISPLAY_STATUS.OVERDUE, TASK_DISPLAY_STATUS.URGENT, TASK_DISPLAY_STATUS.NEAR_DUE, TASK_DISPLAY_STATUS.NOT_DUE, TASK_DISPLAY_STATUS.EXTENDED];
    const idxA = order.indexOf(statusA);
    const idxB = order.indexOf(statusB);
    if (idxA !== idxB) return idxA - idxB;

    const deadlineA = a.deadline?.toDate ? a.deadline.toDate() : new Date(a.deadline);
    const deadlineB = b.deadline?.toDate ? b.deadline.toDate() : new Date(b.deadline);
    return deadlineA - deadlineB;
  }), [filteredTasks]);

  const urgentCount = useMemo(() => activeTasks.filter(t => {
    const s = getTaskDisplayStatus(t);
    return s === TASK_DISPLAY_STATUS.URGENT || s === TASK_DISPLAY_STATUS.OVERDUE;
  }).length, [activeTasks]);

  const handleApprove = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await handleApproveTask(task, currentUser.uid);
  };

  if (isLoading) return (
    <div className="max-w-5xl mx-auto space-y-10 pb-10 animate-fade-in">
      <div className="space-y-3">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse" />
      </div>
      <div className="grid gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
            <div className="flex justify-between">
              <div className="h-5 w-3/5 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-full animate-pulse" />
            </div>
            <div className="flex gap-4">
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
              <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-10">
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
          color="emerald"
          gradient="from-emerald-500/20 to-emerald-500/5"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={MdDateRange}
          label="Cần gấp"
          value={urgentCount}
          color="rose"
          gradient="from-rose-500/20 to-rose-500/5"
          iconColor="text-rose-600"
        />
        <StatCard
          icon={MdToday}
          label="Hôm nay"
          value={activeTasks.filter(t => isToday(t.deadline?.toDate ? t.deadline.toDate() : new Date(t.deadline))).length}
          color="sky"
          gradient="from-sky-500/20 to-sky-500/5"
          iconColor="text-sky-600"
        />
        <StatCard
          icon={MdCheckCircle}
          label="Đã xong"
          value={tasks.filter(t => t.isCompleted).length}
          color="teal"
          gradient="from-teal-500/20 to-teal-500/5"
          iconColor="text-teal-600"
        />
      </div>

      <div className="animate-fade-in-up delay-200">
        {/* Filter Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            {[
              { value: 'today', icon: MdToday, label: 'Hôm nay' },
              { value: 'week', icon: MdDateRange, label: 'Tuần này' },
              { value: 'all', icon: MdList, label: 'Tất cả' },
            ].map(({ value, icon: Icon, label }) => ( // eslint-disable-line no-unused-vars
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
              </button>
            ))}
          </div>
        </div>

        {/* Task list */}
        {sortedTasks.length === 0 ? (
          <div className="py-12 glass-card">
            <EmptyState
              icon={MdToday}
              title={viewMode === 'today' ? 'Tuyệt vời! Không còn việc hôm nay' : 'Không tìm thấy việc nào'}
              message="Có vẻ như bạn đã hoàn thành hết công việc hoặc chưa có việc mới được giao."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTasks.map((task, idx) => (
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

const StatCard = ({ icon: Icon, label, value, gradient, iconColor }) => ( // eslint-disable-line no-unused-vars
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
