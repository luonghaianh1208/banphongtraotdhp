import { useState } from 'react';
import { MdGavel, MdAdd, MdClose, MdDelete } from 'react-icons/md';
import { useTaskPenalties, usePenaltyActions } from '../../hooks/usePenalties';
import { useTaskConfig } from '../../context/TaskConfigContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import ConfirmDialog from '../common/ConfirmDialog';
import toast from 'react-hot-toast';

const TaskPenaltySection = ({ task, users }) => {
  const { penaltyTypes } = useTaskConfig();
  const { penalties, loading } = useTaskPenalties(task.id);
  const { addPenalty, removePenalty, isProcessing } = usePenaltyActions();
  const { canManageTasks, currentUser } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedUser, setSelectedUser] = useState(task.assignees?.length === 1 ? task.assignees[0] : '');
  const [amountInput, setAmountInput] = useState('');
  
  const [deleteId, setDeleteId] = useState(null);

  const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handleTypeSelect = (e) => {
    const typeId = e.target.value;
    setSelectedType(typeId);
    const pType = penaltyTypes?.find(p => p.id === typeId);
    if (pType && pType.defaultAmount != null) {
      setAmountInput(String(pType.defaultAmount));
    } else {
      setAmountInput('');
    }
  };

  const handleAddPenalty = async () => {
    if (!selectedType) return toast.error('Vui lòng chọn loại vi phạm');
    if (!selectedUser) return toast.error('Vui lòng chọn người vi phạm');
    
    const parsedAmount = parseInt(String(amountInput).replace(/\D/g, ''), 10);
    if (isNaN(parsedAmount) || parsedAmount < 0) return toast.error('Vui lòng nhập số tiền phạt hợp lệ');

    try {
      await addPenalty({
        taskId: task.id,
        taskTitle: task.title,
        userId: selectedUser,
        penaltyTypeId: selectedType,
        amount: parsedAmount,
        createdBy: currentUser.uid,
      });
      toast.success('Đã ghi nhận vi phạm');
      setShowForm(false);
      setSelectedType('');
      setAmountInput('');
      if (task.assignees?.length !== 1) setSelectedUser('');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await removePenalty(deleteId);
      toast.success('Đã gỡ phạt');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setDeleteId(null);
    }
  };

  if (!canManageTasks && (!penalties || penalties.length === 0)) {
    return null; // Không hiện với member nếu ko có lỗi nào
  }

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
          <MdGavel size={16} /> Vi phạm & Phạt
        </h4>
        {canManageTasks && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-ghost text-red-600 px-2 py-1 h-auto text-xs">
            <MdAdd size={16} /> Ghi nhận vi phạm
          </button>
        )}
      </div>

      {/* Cảnh báo quá hạn */}
      {(() => {
        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.isCompleted;
        const autoPenaltyType = penaltyTypes?.find(p => p.isAutoOverdue);
        const hasOverduePenalty = autoPenaltyType && penalties.some(p => p.penaltyTypeId === autoPenaltyType.id);

        if (isOverdue && !hasOverduePenalty && canManageTasks && autoPenaltyType) {
          return (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 mb-3 text-sm flex items-center justify-between animate-pulse">
              <span>⚠️ Công việc đã quá hạn!</span>
              <button 
                onClick={() => {
                  setSelectedType(autoPenaltyType.id);
                  setAmountInput(String(autoPenaltyType.defaultAmount || ''));
                  setShowForm(true);
                }}
                className="btn bg-red-600 text-white hover:bg-red-700 text-xs px-2 py-1 h-auto rounded"
              >
                Áp dụng phạt
              </button>
            </div>
          );
        }
        return null;
      })()}

      {/* Form thêm */}
      {showForm && canManageTasks && (
        <div className="bg-red-50 rounded-lg p-3 mb-3 border border-red-100">
          <div className="flex flex-col gap-2">
            <select className="input text-sm" value={selectedType} onChange={handleTypeSelect}>
              <option value="">-- Chọn lỗi vi phạm --</option>
              {penaltyTypes?.map(pt => (
                <option key={pt.id} value={pt.id}>{pt.name} {pt.defaultAmount ? `(${formatVND(pt.defaultAmount)})` : '(Nhập tiền)'}</option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <select className="input text-sm flex-1" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                <option value="">-- Người bị phạt --</option>
                {task.assignees?.map(uid => {
                  const u = users.find(x => x.id === uid);
                  return u ? <option key={uid} value={uid}>{u.displayName}</option> : null;
                })}
              </select>
              <input 
                type="number" 
                className="input text-sm w-1/3" 
                placeholder="Số tiền phạt" 
                value={amountInput} 
                onChange={e => setAmountInput(e.target.value)} 
              />
            </div>
            
            <div className="flex gap-2 justify-end mt-1">
              <button disabled={isProcessing} onClick={() => setShowForm(false)} className="btn btn-ghost text-xs px-3 py-1.5 h-auto rounded">Hủy</button>
              <button disabled={isProcessing} onClick={handleAddPenalty} className="btn bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 h-auto rounded">Lưu Phạt</button>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách */}
      {loading ? (
        <div className="text-xs text-gray-500 italic">Đang tải...</div>
      ) : penalties.length === 0 ? (
        <div className="text-xs text-gray-500 italic">Không có vi phạm nào.</div>
      ) : (
        <div className="space-y-2">
          {penalties.map(p => {
            const pType = penaltyTypes?.find(x => x.id === p.penaltyTypeId);
            const user = users.find(x => x.id === p.userId);
            return (
              <div key={p.id} className="flex items-center gap-3 bg-white border border-red-100 rounded p-2">
                <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <MdGavel size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {user?.displayName || 'Người dùng ẩn'} <span className="font-normal text-gray-500 text-xs">vi phạm</span> {pType?.name || 'Lỗi không xác định'}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{formatDateTime(p.createdAt)}</span>
                    {p.status === 'paid' ? (
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded uppercase">Đã nộp phạt</span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded uppercase">Chưa nộp phạt</span>
                    )}
                  </div>
                </div>
                <div className="font-bold text-red-600 shrink-0">
                  {formatVND(p.amount)}
                </div>
                {canManageTasks && p.status !== 'paid' && (
                  <button onClick={() => setDeleteId(p.id)} className="p-1 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 shrink-0 ml-1">
                    <MdDelete size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Gỡ vi phạm"
        message="Bạn chắc chắn muốn gỡ bỏ lỗi phạt này?"
        confirmText="Gỡ bỏ"
        danger
      />
    </div>
  );
};

export default TaskPenaltySection;
