// MembersPage — quản lý thành viên (admin full, member/manager view-only)
import { useState, useEffect } from 'react';
import { MdEdit, MdDeleteForever, MdCheckCircle, MdHourglassTop, MdCircle, MdSearch } from 'react-icons/md';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { deleteUserAccount } from '../firebase/functions';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ROLES } from '../utils/constants';
import toast from 'react-hot-toast';

// Tính trạng thái online từ lastActiveAt
// currentUserId: nếu truyền vào, user.id trùng → luôn hiện online (vì presence hook đang chạy)
const getPresenceInfo = (user, currentUserId) => {
  // Chính mình luôn online khi đang mở app (usePresence đang heartbeat)
  if (currentUserId && user.id === currentUserId) {
    return { isOnline: true, label: 'Đang hoạt động' };
  }

  const lastActive = user.lastActiveAt;
  if (!lastActive) return { isOnline: false, label: 'Chưa hoạt động' };

  const now = Date.now();
  const lastMs = lastActive.toMillis ? lastActive.toMillis() : new Date(lastActive).getTime();
  const diffMs = now - lastMs;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 2) return { isOnline: true, label: 'Đang hoạt động' };
  if (diffMin < 60) return { isOnline: false, label: `${diffMin} phút trước` };
  if (diffHour < 24) return { isOnline: false, label: `${diffHour} giờ trước` };
  if (diffDay < 7) return { isOnline: false, label: `${diffDay} ngày trước` };
  return { isOnline: false, label: 'Lâu rồi không online' };
};

const MembersPage = () => {
  const { users, loading } = useUsers();
  const { canManageUsers, currentUser } = useAuth();
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [, setTick] = useState(0);

  // Refresh trạng thái online mỗi 30s
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Phân loại users
  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status !== 'pending' && u.isActive !== false);
  const disabledUsers = users.filter(u => u.status !== 'pending' && u.isActive === false);

  // Filter theo search
  const filteredActive = activeUsers.filter(u =>
    !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Duyệt user mới
  const handleApproveUser = async (userId, role = 'member') => {
    setFormLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: true,
        status: 'approved',
        role: role,
        updatedAt: serverTimestamp(),
      });
      toast.success('Đã duyệt thành viên');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Từ chối user
  const handleRejectUser = async (userId) => {
    setFormLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: false,
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
      toast.success('Đã từ chối');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Đổi quyền
  const handleRoleChange = async (userId, newRole) => {
    setFormLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      toast.success('Đã cập nhật quyền');
      setEditingUser(null);
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = async (userId) => {
    setFormLoading(true);
    try {
      await deleteUserAccount({ userId });
      toast.success('Đã xóa tài khoản');
      setConfirmDelete(null);
    } catch (err) {
      toast.error('Lỗi: ' + (err.message || 'Không thể xóa'));
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Đếm online
  const onlineCount = activeUsers.filter(u => getPresenceInfo(u, currentUser?.uid).isOnline).length;

  return (
    <div className="max-w-4xl mx-auto fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {activeUsers.length} thành viên
              {disabledUsers.length > 0 && ` · ${disabledUsers.length} vô hiệu hóa`}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <MdCircle size={8} className="animate-pulse" />
              {onlineCount} đang online
            </span>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm thành viên..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* === PENDING USERS (admin only) === */}
      {canManageUsers && pendingUsers.length > 0 && (
        <div className="card overflow-hidden border-2 border-amber-200 dark:border-amber-800">
          <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-3 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
            <MdHourglassTop size={20} className="text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Chờ phê duyệt ({pendingUsers.length})</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {pendingUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-semibold text-sm">
                      {user.displayName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    defaultValue="member"
                    id={`role-${user.id}`}
                    className="input text-xs py-1.5 px-2 w-auto"
                  >
                    <option value="member">Nhân viên</option>
                    <option value="manager">Phụ trách</option>
                    <option value="admin">Tổ trưởng</option>
                  </select>
                  <button
                    onClick={() => {
                      const role = document.getElementById(`role-${user.id}`).value;
                      handleApproveUser(user.id, role);
                    }}
                    disabled={formLoading}
                    className="btn btn-primary text-xs py-1.5 px-3"
                  >
                    <MdCheckCircle size={16} /> Duyệt
                  </button>
                  <button
                    onClick={() => handleRejectUser(user.id)}
                    disabled={formLoading}
                    className="btn btn-secondary text-xs py-1.5 px-3 text-red-600 hover:bg-red-50"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === ACTIVE MEMBERS — Card layout with online indicator === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredActive.map(user => {
          const presence = getPresenceInfo(user, currentUser?.uid);
          return (
            <div
              key={user.id}
              className="card p-4 hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-start gap-3">
                {/* Avatar with online dot */}
                <div className="relative shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-11 h-11 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                      {user.displayName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  {/* Online dot — Messenger style */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${
                      presence.isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    title={presence.label}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      user.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      user.role === 'manager' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {ROLES[user.role]?.label || user.role}
                    </span>
                    <span className={`text-[10px] font-semibold ${
                      presence.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {presence.label}
                    </span>
                  </div>
                </div>

                {/* Admin actions */}
                {canManageUsers && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Đổi quyền"
                    >
                      <MdEdit size={16} />
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => setConfirmDelete(user)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Xóa tài khoản"
                      >
                        <MdDeleteForever size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredActive.length === 0 && search && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-sm font-medium">Không tìm thấy thành viên nào phù hợp</p>
        </div>
      )}

      {/* Disabled users (admin only) */}
      {canManageUsers && disabledUsers.length > 0 && (
        <div className="card overflow-hidden opacity-70">
          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Đã vô hiệu hóa ({disabledUsers.length})</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {disabledUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full grayscale" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center font-semibold text-xs">
                      {user.displayName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">{user.displayName}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-red-50 dark:bg-red-900/20 text-red-500 text-[10px]">
                    {user.status === 'rejected' ? 'Đã từ chối' : 'Vô hiệu hóa'}
                  </span>
                  <button
                    onClick={() => setConfirmDelete(user)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Xóa tài khoản"
                  >
                    <MdDeleteForever size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal đổi quyền (admin only) */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`Đổi quyền: ${editingUser?.displayName}`} size="sm">
        <div className="space-y-3">
          {Object.entries(ROLES).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => handleRoleChange(editingUser.id, key)}
              disabled={formLoading}
              className={`w-full text-left p-3 rounded-lg border transition-all ${editingUser?.role === key
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
            >
              <span className="font-medium">{label}</span>
              {editingUser?.role === key && <span className="text-xs ml-2">(hiện tại)</span>}
            </button>
          ))}
        </div>
      </Modal>

      {/* Confirm xóa */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDeleteUser(confirmDelete?.id)}
        title="Xóa tài khoản"
        message={`Bạn chắc chắn muốn xóa tài khoản "${confirmDelete?.displayName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        danger
      />
    </div>
  );
};

export default MembersPage;
