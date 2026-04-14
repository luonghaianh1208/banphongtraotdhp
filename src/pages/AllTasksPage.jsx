// AllTasksPage — trang tất cả công việc: bảng task toàn tổ với filter & export
import { useState } from 'react';
import { MdAdd, MdFileDownload, MdPictureAsPdf, MdDelete, MdSelectAll, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { createTask, updateTask, softDeleteTasks } from '../firebase/firestore';
import { handleApproveTask } from '../hooks/useTaskActions';
import TaskCard from '../components/task/TaskCard';
import TaskForm from '../components/task/TaskForm';
import TaskDetail from '../components/task/TaskDetail';
import TaskFilters from '../components/task/TaskFilters';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { filterTasks } from '../utils/statusUtils';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPdf } from '../utils/exportPdf';
import toast from 'react-hot-toast';

const AllTasksPage = () => {
  const { tasks, loading: tasksLoading } = useTasks();
  const { users, loading: usersLoading } = useUsers();
  const { currentUser, canManageTasks, canApprove } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filters, setFilters] = useState({
    search: '', assignee: '', status: '', priority: '', dateFrom: '', dateTo: ''
  });

  const loading = tasksLoading || usersLoading;

  // Áp dụng filters
  const filteredTasks = filterTasks(tasks, filters);

  const handleCreate = async (data) => {
    await createTask(data);
  };

  const handleApprove = async (taskId) => {
    await handleApproveTask(taskId, currentUser.uid);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      await softDeleteTasks([...selectedIds]);
      toast.success(`Đã xóa ${selectedIds.size} công việc vào thùng rác`);
      setSelectedIds(new Set());
      setConfirmDelete(false);
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const allSelected = filteredTasks.length > 0 && selectedIds.size === filteredTasks.length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto fade-in">
      {/* Header with actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm text-gray-500">{filteredTasks.length} / {tasks.length} công việc</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageTasks && filteredTasks.length > 0 && (
            <button onClick={toggleSelectAll} className="btn btn-secondary text-xs">
              {allSelected ? <MdCheckBox size={16} className="text-primary-600" /> : <MdCheckBoxOutlineBlank size={16} />}
              Chọn tất cả
            </button>
          )}
          {canManageTasks && selectedIds.size > 0 && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn btn-ghost text-red-600 hover:bg-red-50 text-xs"
            >
              <MdDelete size={16} /> Xóa ({selectedIds.size})
            </button>
          )}
          {canManageTasks && (
            <>
              <button onClick={() => exportToExcel(filteredTasks, users)} className="btn btn-secondary text-xs">
                <MdFileDownload size={16} /> Excel
              </button>
              <button onClick={() => exportToPdf(filteredTasks, users)} className="btn btn-secondary text-xs">
                <MdPictureAsPdf size={16} /> PDF
              </button>
            </>
          )}
          {canManageTasks && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">
              <MdAdd size={18} /> Tạo việc mới
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <TaskFilters filters={filters} setFilters={setFilters} users={users} />

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="Không tìm thấy công việc"
          message="Thử thay đổi bộ lọc hoặc tạo công việc mới"
          action={canManageTasks && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">
              <MdAdd size={18} /> Tạo việc mới
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              users={users}
              onClick={setSelectedTask}
              onApprove={handleApprove}
              canApprove={canApprove}
              selectable={canManageTasks}
              selected={selectedIds.has(task.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showCreate || !!editTask} onClose={() => { setShowCreate(false); setEditTask(null); }} title={editTask ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'} size="lg">
        <TaskForm
          task={editTask}
          users={users}
          currentUser={currentUser}
          onSubmit={editTask ? (data) => updateTask(editTask.id, data, currentUser.uid, { action: 'edit', field: 'multiple' }) : handleCreate}
          onClose={() => { setShowCreate(false); setEditTask(null); }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleBulkDelete}
        title="Xóa công việc"
        message={`Chuyển ${selectedIds.size} công việc đã chọn vào thùng rác?`}
        confirmText="Xóa"
        danger
      />

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

export default AllTasksPage;
