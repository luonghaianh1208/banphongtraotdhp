import { useState, useMemo } from 'react';
import { MdGavel, MdCheckCircle, MdSearch, MdFilterList, MdMonetizationOn, MdWarning } from 'react-icons/md';
import { useAllPenalties, usePenaltyActions } from '../hooks/usePenalties';
import { useTaskConfig } from '../context/TaskConfigContext';
import { subscribeToUsers } from '../firebase/firestore';
import { formatDateTime } from '../utils/dateUtils';
import { useEffect } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { useTasks } from '../hooks/useTasks';
import Modal from '../components/common/Modal';
import TaskDetail from '../components/task/TaskDetail';

const PenaltyManagementPage = () => {
  const { penalties, loading: penaltiesLoading } = useAllPenalties();
  const { tasks } = useTasks();
  const { penaltyTypes } = useTaskConfig();
  const { markPenaltyPaid, removePenalty, undoPenaltyPaid, isProcessing } = usePenaltyActions();
  const [users, setUsers] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, unpaid, paid
  
  const [confirmPaidId, setConfirmPaidId] = useState(null);
  const [confirmUndoId, setConfirmUndoId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const unsub = subscribeToUsers((data) => setUsers(data));
    return () => unsub();
  }, []);

  const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Tính toán thống kê
  const stats = useMemo(() => {
    let totalUnpaid = 0;
    let totalPaid = 0;
    const userDebts = {};

    penalties.forEach(p => {
      const amount = p.amount || 0;
      if (p.status === 'paid') {
        totalPaid += amount;
      } else {
        totalUnpaid += amount;
        userDebts[p.userId] = (userDebts[p.userId] || 0) + amount;
      }
    });

    const topDebtors = Object.keys(userDebts)
      .map(uid => ({ uid, amount: userDebts[uid] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return { totalUnpaid, totalPaid, topDebtors };
  }, [penalties]);

  const filteredPenalties = useMemo(() => {
    return penalties.filter(p => {
      // Trạng thái
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      // Tìm kiếm theo tên task hoặc tên người dùng
      if (searchTerm) {
        const u = users.find(x => x.id === p.userId);
        const name = (u?.displayName || '').toLowerCase();
        const taskName = (p.taskTitle || '').toLowerCase();
        const term = searchTerm.toLowerCase();
        if (!name.includes(term) && !taskName.includes(term)) return false;
      }
      return true;
    });
  }, [penalties, filterStatus, searchTerm, users]);

  const handleMarkPaid = async () => {
    try {
      const penalty = penalties.find(p => p.id === confirmPaidId);
      await markPenaltyPaid(confirmPaidId, penalty.amount);
      toast.success('Đã xác nhận nộp phạt');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setConfirmPaidId(null);
    }
  };

  const handleUndoPaid = async () => {
    try {
      await undoPenaltyPaid(confirmUndoId);
      toast.success('Đã thu hồi thao tác (Chưa đóng tiền)');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setConfirmUndoId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await removePenalty(confirmDeleteId);
      toast.success('Đã gỡ án phạt');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleOpenTaskInfo = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
    } else {
      toast.error('Không tìm thấy thông tin công việc. Có thể đã bị xóa.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto fade-in space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600"><MdGavel size={24} /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quản lý Phạt</h1>
            <p className="text-sm text-gray-500">Giám sát và theo dõi các khoản phạt vi phạm</p>
          </div>
        </div>
      </div>

      {/* Thống kê Tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-center gap-3 mb-2">
            <MdWarning className="text-red-500" size={24} />
            <h3 className="font-semibold text-gray-700">Tổng đang nợ</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatVND(stats.totalUnpaid)}</p>
        </div>
        <div className="card p-5 border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center gap-3 mb-2">
            <MdMonetizationOn className="text-green-500" size={24} />
            <h3 className="font-semibold text-gray-700">Tổng đã thu</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatVND(stats.totalPaid)}</p>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 block">Top nợ phạt nhiều nhất</h3>
          <div className="space-y-2">
            {stats.topDebtors.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Không có ai nợ phạt.</p>
            ) : (
              stats.topDebtors.map(debt => {
                const u = users.find(x => x.id === debt.uid);
                return (
                  <div key={debt.uid} className="flex justify-between items-center text-sm">
                    <span className="text-gray-800 font-medium truncate pr-2">{u?.displayName || 'Ẩn danh'}</span>
                    <span className="text-red-600 font-bold whitespace-nowrap">{formatVND(debt.amount)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm theo tên nhân viên, công việc..."
            className="input w-full pl-10 bg-gray-50"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <MdFilterList className="text-gray-400" size={20} />
          <select className="input bg-gray-50" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="unpaid">Chưa nộp (Đang nợ)</option>
            <option value="paid">Đã nộp</option>
          </select>
        </div>
      </div>

      {/* Danh sách */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100/50 uppercase text-xs text-gray-500 font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4">Nhân viên</th>
                <th className="px-5 py-4">Lỗi vi phạm</th>
                <th className="px-5 py-4">Công việc / Ngày phạt</th>
                <th className="px-5 py-4">Số tiền</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {penaltiesLoading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-gray-400">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredPenalties.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-gray-400">Không tìm thấy dữ liệu phù hợp.</td>
                </tr>
              ) : (
                filteredPenalties.map(p => {
                  const pType = penaltyTypes?.find(x => x.id === p.penaltyTypeId);
                  const user = users.find(x => x.id === p.userId);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{user?.displayName || 'Ẩn danh'}</td>
                      <td className="px-5 py-3 text-gray-700">
                        <span className="flex items-center gap-1.5">
                          <MdGavel size={14} className="text-red-400" />
                          {pType?.name || 'Không rõ'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div 
                          className="text-primary-600 font-medium max-w-[200px] truncate cursor-pointer hover:underline" 
                          title="Bấm để xem chi tiết công việc"
                          onClick={() => handleOpenTaskInfo(p.taskId)}
                        >
                          {p.taskTitle || '-'}
                        </div>
                        <div className="text-xs text-gray-400">{formatDateTime(p.createdAt)}</div>
                      </td>
                      <td className="px-5 py-3 font-bold text-red-600">{formatVND(p.amount)}</td>
                      <td className="px-5 py-3">
                        {p.status === 'paid' ? (
                          <span className="inline-flex py-1 px-2 rounded bg-green-100 text-green-700 text-xs font-bold uppercase">Đã nộp</span>
                        ) : (
                          <span className="inline-flex py-1 px-2 rounded bg-red-100 text-red-700 text-xs font-bold uppercase">Đang nợ</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {p.status === 'paid' ? (
                          <div className="flex gap-2 justify-end">
                            <button 
                              disabled={isProcessing} 
                              onClick={() => setConfirmUndoId(p.id)}
                              className="btn btn-ghost text-amber-600 px-2 py-1 text-xs"
                              title="Hoàn tác trạng thái nợ"
                            >
                              Thu hồi 
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <button 
                              disabled={isProcessing} 
                              onClick={() => setConfirmPaidId(p.id)}
                              className="btn btn-primary text-xs px-2 py-1"
                            >
                              <MdCheckCircle size={14} /> Đã thu tiền
                            </button>
                            <button 
                              disabled={isProcessing} 
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="btn btn-ghost text-red-600 px-2 py-1"
                              title="Gỡ vi phạm"
                            >
                              Gỡ lỗi
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmPaidId}
        onClose={() => setConfirmPaidId(null)}
        onConfirm={handleMarkPaid}
        title="Xác nhận đã thu tiền phạt"
        message="Nhân viên này đã đóng khoản phạt này rồi đúng không? Hành động này sẽ chuyển trạng thái sang 'Đã nộp' và điều chỉnh các báo cáo thống kê."
        confirmText="Xác nhận đã thu tiền"
      />
      
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Gỡ lỗi vi phạm"
        message="Bạn chắc chắn muốn gỡ bỏ lỗi này? Lịch sử vi phạm sẽ bị xóa hoàn toàn."
        confirmText="Gỡ bỏ"
        danger
      />

      <ConfirmDialog
        isOpen={!!confirmUndoId}
        onClose={() => setConfirmUndoId(null)}
        onConfirm={handleUndoPaid}
        title="Xác nhận thu hồi"
        message="Bạn muốn thu hồi trạng thái Đã nộp? Phiếu phạt này sẽ quay về trạng thái Đang nợ."
        confirmText="Xác nhận thu hồi"
      />

      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Chi tiết Công việc"
        size="lg"
      >
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            users={users}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default PenaltyManagementPage;
