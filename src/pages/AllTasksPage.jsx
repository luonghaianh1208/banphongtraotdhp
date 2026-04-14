// AllTasksPage — trang tất cả công việc: bảng task toàn tổ với filter & export
import { useState, useEffect } from 'react';
import { MdAdd, MdFileDownload, MdPictureAsPdf, MdDelete, MdSelectAll, MdCheckBox, MdCheckBoxOutlineBlank, MdNotificationsActive } from 'react-icons/md';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { createTask, updateTask, softDeleteTasks } from '../firebase/firestore';
import { uploadFile } from '../firebase/storage';
import { handleApproveTask, handleRemindTask } from '../hooks/useTaskActions';
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
  const { currentUser, canManageTasks, canApprove, isMember } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filters, setFilters] = useState({
    search: '', assignee: '', status: '', priority: '', category: '', dateFrom: '', dateTo: ''
  });

  // Trigger alert once on load if tasks are near deadline
  useEffect(() => {
    if (tasks.length === 0 || !isMember) return;
    const hasAlerted = sessionStorage.getItem('hasAlertedOverdue');
    if (hasAlerted) return;

    const now = new Date().getTime();
    const urgentTasks = tasks.filter(t => {
      if (t.isCompleted || !t.deadline) return false;
      const timeRemaining = new Date(t.deadline).getTime() - now;
      return timeRemaining > 0 && timeRemaining < 24 * 60 * 60 * 1000;
    });

    if (urgentTasks.length > 0) {
      toast.error(`Bạn có ${urgentTasks.length} công việc sắp hết hạn trong 24h tới!`, {
        duration: 5000,
        icon: '⏳'
      });
      sessionStorage.setItem('hasAlertedOverdue', 'true');
    }
  }, [tasks, isMember]);

  const loading = tasksLoading || usersLoading;

  // Áp dụng filters
  const filteredTasks = filterTasks(tasks, filters);

  const handleCreate = async (data) => {
    const { pendingFiles, existingAttachments, ...taskData } = data;
    // Tạo task trước để lấy ID thực
    const docRef = await createTask({ ...taskData, attachments: existingAttachments || [] });
    // Upload files với ID thực (không còn temp_)
    if (pendingFiles?.length > 0) {
      const uploaded = [];
      for (const file of pendingFiles) {
        const result = await uploadFile(file, docRef.id, currentUser.uid);
        uploaded.push(result);
      }
      await updateTask(docRef.id, { attachments: [...(existingAttachments || []), ...uploaded] });
    }
  };

  const handleApprove = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await handleApproveTask(task, currentUser.uid);
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

  const handleBulkRemind = async () => {
    setActionLoading(true);
    try {
      const selectedTasks = tasks.filter(t => selectedIds.has(t.id));
      await Promise.all(selectedTasks.map(t => handleRemindTask(t, currentUser.uid)));
      toast.success(`Đã gửi nhắc nhở cho ${selectedIds.size} công việc`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error('Lỗi khi nhắc việc: ' + err.message);
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
            <>
              <button
                onClick={handleBulkRemind}
                disabled={actionLoading}
                className="btn btn-primary text-xs"
              >
                <MdNotificationsActive size={16} /> Nhắc việc ({selectedIds.size})
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={actionLoading}
                className="btn btn-ghost text-red-600 hover:bg-red-50 text-xs"
              >
                <MdDelete size={16} /> Xóa ({selectedIds.size})
              </button>
            </>
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
          onSubmit={editTask ? async (data) => {
            const { pendingFiles, existingAttachments, ...taskData } = data;
            let allAttachments = existingAttachments || [];
            if (pendingFiles?.length > 0) {
              for (const file of pendingFiles) {
                const result = await uploadFile(file, editTask.id, currentUser.uid);
                allAttachments = [...allAttachments, result];
              }
            }
            await updateTask(editTask.id, { ...taskData, attachments: allAttachments }, currentUser.uid, { action: 'edit', field: 'multiple' });
          } : handleCreate}
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
