// MembersPage — quản lý thành viên (chỉ admin)
import { useState } from 'react';
import { MdEdit, MdPersonOff, MdCheckCircle, MdPerson, MdHourglassTop } from 'react-icons/md';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ROLES } from '../utils/constants';
import toast from 'react-hot-toast';

const MembersPage = () => {
  const { users, loading } = useUsers();
  const { canManageUsers } = useAuth();
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDisable, setConfirmDisable] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Phân loại users
  const pendingUsers = users.filter(u => u.status === 'pending' || (u.isActive === false && !u.status));
  const approvedUsers = users.filter(u => u.status !== 'pending' && u.isActive !== false);

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

  // Vô hiệu hóa
  const handleDisable = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: false,
        status: 'disabled',
        updatedAt: serverTimestamp(),
      });
      toast.success('Đã vô hiệu hóa tài khoản');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{approvedUsers.length} thành viên hoạt động</p>
        </div>
      </div>

      {/* === PENDING USERS === */}
      {pendingUsers.length > 0 && (
        <div className="card overflow-hidden border-2 border-amber-200">
          <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex items-center gap-2">
            <MdHourglassTop size={20} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">Chờ phê duyệt ({pendingUsers.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold text-sm">
                      {user.displayName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                {canManageUsers && (
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
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === APPROVED MEMBERS === */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Tên</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Vai trò</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600">Trạng thái</th>
                {canManageUsers && <th className="text-center py-3 px-4 font-semibold text-gray-600">Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {approvedUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                          {user.displayName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{user.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{user.email}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`badge ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'manager' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {ROLES[user.role]?.label || user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="badge badge-green">Hoạt động</span>
                  </td>
                  {canManageUsers && (
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Đổi quyền"
                        >
                          <MdEdit size={18} />
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => setConfirmDisable(user)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Vô hiệu hóa"
                          >
                            <MdPersonOff size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal đổi quyền */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`Đổi quyền: ${editingUser?.displayName}`} size="sm">
        <div className="space-y-3">
          {Object.entries(ROLES).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => handleRoleChange(editingUser.id, key)}
              disabled={formLoading}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                editingUser?.role === key
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

      {/* Confirm disable */}
      <ConfirmDialog
        isOpen={!!confirmDisable}
        onClose={() => setConfirmDisable(null)}
        onConfirm={() => handleDisable(confirmDisable?.id)}
        title="Vô hiệu hóa tài khoản"
        message={`Bạn chắc chắn muốn vô hiệu hóa tài khoản "${confirmDisable?.displayName}"?`}
        confirmText="Vô hiệu hóa"
        danger
      />
    </div>
  );
};

export default MembersPage;
