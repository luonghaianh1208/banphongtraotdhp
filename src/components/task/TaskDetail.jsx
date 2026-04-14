// TaskDetail — modal chi tiết task: notes, attachments, history, approve
import { useState } from 'react';
import { MdAccessTime, MdPerson, MdAttachFile, MdSend, MdCheckCircle, MdHistory, MdUpdate, MdDelete, MdStickyNote2, MdUndo, MdNotificationsActive } from 'react-icons/md';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { formatDateTime, formatRelative, formatForInput } from '../../utils/dateUtils';
import { addNote, updateTask, deleteTask, removeOverduePenaltiesForTask } from '../../firebase/firestore';
import { handleApproveTask, handleExtendDeadline, handleRevertApproveTask, handleRemindTask } from '../../hooks/useTaskActions';
import { useAuth } from '../../context/AuthContext';
import { useTaskConfig } from '../../context/TaskConfigContext';
import toast from 'react-hot-toast';
import ConfirmDialog from '../common/ConfirmDialog';
import FilePreviewModal from '../common/FilePreviewModal';
import DateTimePicker from '../common/DateTimePicker';
import TaskPenaltySection from './TaskPenaltySection';

const TaskDetail = ({ task, users, onClose, onEdit }) => {
  const { currentUser, userProfile, canApprove, canManageTasks } = useAuth();
  const { getCategoryById, penaltyTypes } = useTaskConfig();
  const [newNote, setNewNote] = useState('');
  const [showExtend, setShowExtend] = useState(false);
  const [newDeadline, setNewDeadline] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  if (!task) return null;

  const assigneeNames = (task.assignees || [])
    .map(uid => users.find(u => u.id === uid)?.displayName || '?');
  const creatorName = users.find(u => u.id === task.createdBy)?.displayName || '?';

  // Người dùng có quyền chỉnh sửa task này không?
  const canEdit = canManageTasks || task.createdBy === currentUser?.uid;
  // Người dùng được giao task này?
  const isAssignee = task.assignees?.includes(currentUser?.uid);

  // Thêm ghi chú
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      await addNote(task.id, {
        content: newNote.trim(),
        createdBy: currentUser.uid,
        createdByName: userProfile.displayName,
      });
      setNewNote('');
      toast.success('Đã thêm ghi chú');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Duyệt hoàn thành (admin only)
  const handleRemind = async () => {
    setLoading(true);
    try {
      await handleRemindTask(task, currentUser.uid);
      toast.success('Đã nhắc việc thành công!');
      onClose();
    } catch (err) {
      toast.error('Lỗi khi nhắc việc: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await handleApproveTask(task, currentUser.uid);
      onClose();
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Gia hạn deadline
  const handleExtend = async () => {
    if (!newDeadline) return toast.error('Vui lòng chọn deadline mới');
    setLoading(true);
    try {
      await handleExtendDeadline(task, newDeadline, currentUser.uid);
      const autoPenaltyType = penaltyTypes?.find(p => p.isAutoOverdue);
      if (autoPenaltyType) {
        await removeOverduePenaltiesForTask(task.id, autoPenaltyType.id);
      }
      setShowExtend(false);
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xóa task
  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast.success('Đã xóa công việc');
      onClose();
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  // Hủy duyệt hoàn thành
  const handleRevertApprove = async () => {
    setLoading(true);
    try {
      await handleRevertApproveTask(task.id, currentUser.uid);
      // Không tự đóng modal để user có thể cấu hình hoặc làm việc tiếp với task
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-start gap-3 mb-3">
          <h2 className="text-xl font-bold text-gray-900 flex-1">{task.title}</h2>
          <StatusBadge task={task} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><MdPerson size={16} /> Giao bởi: <strong>{creatorName}</strong></span>
          <span className="flex items-center gap-1.5"><MdAccessTime size={16} /> Hạn: <strong>{formatDateTime(task.deadline)}</strong></span>
          <PriorityBadge priority={task.priority} />
          {(() => {
            const cat = getCategoryById(task.category);
            return cat && cat.id !== 'other' ? (
              <span className="badge text-xs" style={{ backgroundColor: cat.color + '20', color: cat.color }}>{cat.name}</span>
            ) : null;
          })()}
        </div>
      </div>

      {/* Người thực hiện */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Người thực hiện</h4>
        <div className="flex flex-wrap gap-2">
          {assigneeNames.map((name, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium">
              <div className="w-5 h-5 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-xs font-bold">{name.charAt(0)}</div>
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* File đính kèm */}
      {task.attachments?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><MdAttachFile /> File đính kèm</h4>
          <div className="space-y-1.5">
            {task.attachments.map((file, i) => (
              <button
                key={i}
                onClick={() => setPreviewFile(file)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left cursor-pointer"
              >
                <MdAttachFile size={16} className="text-gray-400" />
                <span className="truncate flex-1">{file.name}</span>
                <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">{(file.size / 1024).toFixed(0)} KB</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ghi chú */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><MdStickyNote2 size={16} className="text-amber-500" /> Ghi chú</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
          {!task.notes?.length && <p className="text-sm text-gray-400 italic">Chưa có ghi chú nào</p>}
          {(task.notes || []).map((note, i) => (
            <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-sm text-gray-800">{note.content}</p>
              <p className="text-xs text-gray-400 mt-1">{note.createdByName} • {formatRelative(note.createdAt)}</p>
            </div>
          ))}
        </div>

        {/* Input ghi chú mới — chỉ assignee hoặc admin/manager */}
        {(isAssignee || canManageTasks) && !task.isCompleted && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              className="input flex-1"
              placeholder="Thêm ghi chú..."
            />
            <button onClick={handleAddNote} disabled={loading} className="btn btn-primary px-3">
              <MdSend size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Lịch sử chỉnh sửa */}
      {task.editHistory?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><MdHistory size={16} /> Lịch sử chỉnh sửa</h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {task.editHistory.map((entry, i) => {
              const editorName = users.find(u => u.id === entry.editedBy)?.displayName || '?';
              
              // Map tiếng Anh sang tiếng Việt
              let actionText = '';
              if (entry.action === 'edit' && entry.field === 'multiple') actionText = 'đã cập nhật thông tin công việc';
              else if (entry.action === 'approve' && entry.field === 'isCompleted') actionText = 'đã duyệt hoàn thành';
              else if (entry.action === 'extend' && entry.field === 'deadline') actionText = 'đã gia hạn deadline';
              else actionText = `đã ${entry.action} ${entry.field}`;

              return (
                <div key={i} className="text-xs text-gray-500 flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  <span><strong>{editorName}</strong> {actionText} — {formatRelative(entry.editedAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Phạt vi phạm (Penalty Section) */}
      <TaskPenaltySection task={task} users={users} />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
        {/* Duyệt hoàn thành / Hủy duyệt */}
        {canApprove && !task.isCompleted && (
          <button onClick={handleApprove} disabled={loading} className="btn btn-primary">
            <MdCheckCircle size={18} /> Duyệt hoàn thành
          </button>
        )}
        
        {canApprove && task.isCompleted && (
          <button onClick={handleRevertApprove} disabled={loading} className="btn btn-secondary text-amber-600 border-amber-200 hover:bg-amber-50">
            <MdUndo size={18} /> Hủy duyệt (Khôi phục hoạt động)
          </button>
        )}

        {/* Gia hạn */}
        {canManageTasks && !task.isCompleted && (
          <>
            {!showExtend ? (
              <button onClick={() => setShowExtend(true)} className="btn btn-secondary">
                <MdUpdate size={18} /> Gia hạn
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full max-w-sm">
                <DateTimePicker 
                  selected={newDeadline} 
                  onChange={(date) => setNewDeadline(date)} 
                  className="input flex-1 min-w-0" 
                  placeholder="Chọn thời gian mới"
                />
                <button onClick={handleExtend} disabled={loading} className="btn btn-primary px-3">Lưu</button>
                <button onClick={() => setShowExtend(false)} className="btn btn-ghost px-3">Hủy</button>
              </div>
            )}
          </>
        )}

        {/* Sửa task */}
        {canEdit && !task.isCompleted && (
          <button onClick={() => onEdit(task)} className="btn btn-secondary">Chỉnh sửa</button>
        )}

        {/* Nhắc việc */}
        {canManageTasks && !task.isCompleted && (
          <button onClick={handleRemind} disabled={loading} className="btn bg-amber-500 hover:bg-amber-600 text-white shadow-sm font-medium">
            <MdNotificationsActive size={18} /> Nhắc việc
          </button>
        )}

        {/* Xóa — chỉ admin */}
        {canApprove && (
          <button onClick={() => setConfirmDelete(true)} className="btn btn-ghost text-red-600 hover:bg-red-50 ml-auto">
            <MdDelete size={18} /> Xóa
          </button>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Xóa công việc"
        message={`Bạn chắc chắn muốn xóa "${task.title}"? Task sẽ được chuyển vào thùng rác.`}
        confirmText="Chuyển vào thùng rác"
        danger
      />

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
};

export default TaskDetail;
