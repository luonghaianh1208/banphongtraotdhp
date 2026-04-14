// TrashPage — trang thùng rác: xem, khôi phục, xóa hẳn tasks đã xóa
import { useState, useEffect } from 'react';
import { MdDeleteSweep, MdRestoreFromTrash, MdDeleteForever, MdSelectAll, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { subscribeToTrash, restoreTask, restoreTasks, permanentDeleteTask, permanentDeleteTasks } from '../firebase/firestore';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatRelative } from '../utils/dateUtils';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const TrashPage = () => {
  const { currentUser } = useAuth();
  const { users } = useUsers();
  const [trashedTasks, setTrashedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete'|'restore', ids: [] }
  const [actionLoading, setActionLoading] = useState(false);

  // Lắng nghe realtime tasks trong thùng rác
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const unsub = subscribeToTrash(
      (tasks) => { setTrashedTasks(tasks); setLoading(false); },
      () => { setLoading(false); toast.error('Lỗi tải thùng rác'); }
    );
    return unsub;
  }, [currentUser]);

  // Toggle chọn 1 task
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Chọn/bỏ chọn tất cả
  const toggleSelectAll = () => {
    if (selectedIds.size === trashedTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trashedTasks.map(t => t.id)));
    }
  };

  const allSelected = trashedTasks.length > 0 && selectedIds.size === trashedTasks.length;

  // Khôi phục
  const handleRestore = async (ids) => {
    setActionLoading(true);
    try {
      if (ids.length === 1) {
        await restoreTask(ids[0]);
      } else {
        await restoreTasks(ids);
      }
      toast.success(`Đã khôi phục ${ids.length} công việc`);
      setSelectedIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Xóa hẳn
  const handlePermanentDelete = async (ids) => {
    setActionLoading(true);
    try {
      if (ids.length === 1) {
        await permanentDeleteTask(ids[0]);
      } else {
        await permanentDeleteTasks(ids);
      }
      toast.success(`Đã xóa vĩnh viễn ${ids.length} công việc`);
      setSelectedIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const getUserName = (uid) => users.find(u => u.id === uid)?.displayName || '?';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-100">
            <MdDeleteSweep size={24} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Thùng rác</h2>
            <p className="text-sm text-gray-500">{trashedTasks.length} công việc đã xóa</p>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 border border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              Đã chọn: <strong className="text-primary-600">{selectedIds.size}</strong>
            </span>
            <div className="w-px h-5 bg-gray-300" />
            <button
              onClick={() => handleRestore([...selectedIds])}
              disabled={actionLoading}
              className="btn btn-secondary text-sm px-3 py-1.5"
            >
              <MdRestoreFromTrash size={16} /> Khôi phục
            </button>
            <button
              onClick={() => setConfirmAction({ type: 'delete', ids: [...selectedIds] })}
              disabled={actionLoading}
              className="btn btn-ghost text-red-600 hover:bg-red-50 text-sm px-3 py-1.5"
            >
              <MdDeleteForever size={16} /> Xóa hẳn
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {trashedTasks.length === 0 ? (
        <EmptyState
          icon={MdDeleteSweep}
          title="Thùng rác trống"
          description="Các công việc đã xóa sẽ hiển thị ở đây"
        />
      ) : (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_140px_140px_100px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="flex items-center justify-center">
              <button onClick={toggleSelectAll} className="p-0.5 rounded hover:bg-gray-200 transition-colors">
                {allSelected
                  ? <MdCheckBox size={20} className="text-primary-600" />
                  : <MdCheckBoxOutlineBlank size={20} className="text-gray-400" />
                }
              </button>
            </div>
            <div>Công việc</div>
            <div>Người giao</div>
            <div>Đã xóa lúc</div>
            <div className="text-center">Thao tác</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {trashedTasks.map(task => {
              const isSelected = selectedIds.has(task.id);
              return (
                <div
                  key={task.id}
                  className={`grid grid-cols-[40px_1fr_140px_140px_100px] gap-2 px-4 py-3 items-center transition-colors ${
                    isSelected ? 'bg-primary-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
                    <button onClick={() => toggleSelect(task.id)} className="p-0.5 rounded hover:bg-gray-200 transition-colors">
                      {isSelected
                        ? <MdCheckBox size={20} className="text-primary-600" />
                        : <MdCheckBoxOutlineBlank size={20} className="text-gray-400" />
                      }
                    </button>
                  </div>

                  {/* Task info */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      Người thực hiện: {(task.assignees || []).map(uid => getUserName(uid)).join(', ')}
                    </p>
                  </div>

                  {/* Creator */}
                  <div className="text-sm text-gray-600 truncate">{getUserName(task.createdBy)}</div>

                  {/* Deleted at */}
                  <div className="text-xs text-gray-500">{task.deletedAt ? formatRelative(task.deletedAt) : '—'}</div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleRestore([task.id])}
                      disabled={actionLoading}
                      className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Khôi phục"
                    >
                      <MdRestoreFromTrash size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'delete', ids: [task.id] })}
                      disabled={actionLoading}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      title="Xóa vĩnh viễn"
                    >
                      <MdDeleteForever size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm permanent delete */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handlePermanentDelete(confirmAction?.ids || [])}
        title="Xóa vĩnh viễn"
        message={`Bạn chắc chắn muốn xóa vĩnh viễn ${confirmAction?.ids?.length || 0} công việc? Tất cả file đính kèm cũng sẽ bị xóa. Hành động này KHÔNG THỂ hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        danger
      />
    </div>
  );
};

export default TrashPage;
