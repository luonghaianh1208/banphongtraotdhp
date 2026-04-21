// TodayPage — trang "Việc hôm nay": hiển thị task của tôi hôm nay + tuần này
import { useState } from 'react';
import { MdAdd, MdToday, MdDateRange, MdList } from 'react-icons/md';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { useTaskCRUD } from '../hooks/useTaskCRUD';
import { handleApproveTask } from '../hooks/useTaskActions';
import TaskCard from '../components/task/TaskCard';
import TaskForm from '../components/task/TaskForm';
import TaskDetail from '../components/task/TaskDetail';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { isToday, isThisWeek } from 'date-fns';
import { getTaskDisplayStatus } from '../utils/statusUtils';
import { TASK_DISPLAY_STATUS } from '../utils/constants';
import toast from 'react-hot-toast';

const TodayPage = () => {
  const { tasks, loading: tasksLoading } = useTasks();
  const { users, loading: usersLoading } = useUsers();
  const { currentUser, userProfile, canManageTasks, canApprove } = useAuth();
  const { handleCreateTask, handleEditTask } = useTaskCRUD(currentUser);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [viewMode, setViewMode] = useState('today'); // today | week | all

  const loading = tasksLoading || usersLoading;

  // Admin/Manager sẽ xem được TẤT CẢ các task đang làm, Member xem của riêng mình (do hook useTasks đã lọc ngầm)
  const activeTasks = tasks.filter(t => !t.isCompleted);

  // Lọc theo view mode
  const filteredTasks = activeTasks.filter(task => {
    const deadline = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline);
    switch (viewMode) {
      case 'today': return isToday(deadline);
      case 'week': return isThisWeek(deadline, { weekStartsOn: 1 });
      default: return true;
    }
  });

  // Sắp xếp: urgent trước, rồi theo deadline
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const statusA = getTaskDisplayStatus(a);
    const statusB = getTaskDisplayStatus(b);
    const order = [TASK_DISPLAY_STATUS.OVERDUE, TASK_DISPLAY_STATUS.URGENT, TASK_DISPLAY_STATUS.NEAR_DUE, TASK_DISPLAY_STATUS.NOT_DUE, TASK_DISPLAY_STATUS.EXTENDED];
    const idxA = order.indexOf(statusA);
    const idxB = order.indexOf(statusB);
    if (idxA !== idxB) return idxA - idxB;

    const deadlineA = a.deadline?.toDate ? a.deadline.toDate() : new Date(a.deadline);
    const deadlineB = b.deadline?.toDate ? b.deadline.toDate() : new Date(b.deadline);
    return deadlineA - deadlineB;
  });

  // Đếm task urgent/overdue
  const urgentCount = activeTasks.filter(t => {
    const s = getTaskDisplayStatus(t);
    return s === TASK_DISPLAY_STATUS.URGENT || s === TASK_DISPLAY_STATUS.OVERDUE;
  }).length;



  // Duyệt hoàn thành
  const handleApprove = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await handleApproveTask(task, currentUser.uid);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto fade-in">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{activeTasks.length}</p>
          <p className="text-xs text-gray-500">Tổng đang làm</p>
        </div>
        <div className="card p-3 text-center border-red-200 bg-red-50/50">
          <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
          <p className="text-xs text-red-500">Cần gấp</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-primary-600">
            {activeTasks.filter(t => isToday(t.deadline?.toDate ? t.deadline.toDate() : new Date(t.deadline))).length}
          </p>
          <p className="text-xs text-gray-500">Hôm nay</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {tasks.filter(t => t.isCompleted).length}
          </p>
          <p className="text-xs text-gray-500">Đã xong</p>
        </div>
      </div>

      {/* View toggle + Create button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { value: 'today', icon: MdToday, label: 'Hôm nay' },
            { value: 'week', icon: MdDateRange, label: 'Tuần này' },
            { value: 'all', icon: MdList, label: 'Tất cả' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setViewMode(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {canManageTasks && (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <MdAdd size={18} /> Tạo việc mới
          </button>
        )}
      </div>

      {/* Task list */}
      {sortedTasks.length === 0 ? (
        <EmptyState
          icon={MdToday}
          title={viewMode === 'today' ? 'Không có việc hôm nay' : 'Không có việc nào'}
          message="Bạn đã hoàn thành tất cả hoặc chưa được giao việc"
        />
      ) : (
        <div className="space-y-3">
          {sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              users={users}
              onClick={setSelectedTask}
              onApprove={handleApprove}
              canApprove={canApprove}
            />
          ))}
        </div>
      )}

      {/* Modal tạo task */}
      <Modal isOpen={showCreate || !!editTask} onClose={() => { setShowCreate(false); setEditTask(null); }} title={editTask ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'} size="lg">
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
      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Chi tiết công việc" size="lg">
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

export default TodayPage;
