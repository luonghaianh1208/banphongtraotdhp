// MembersPage — quản lý thành viên (chỉ admin)
import { useState } from 'react';
import { MdAdd, MdEdit, MdPersonOff, MdPerson } from 'react-icons/md';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { createUserAccount, setUserRole, disableUser } from '../firebase/functions';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ROLES } from '../utils/constants';
import { formatDate } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const MembersPage = () => {
  const { users, loading } = useUsers();
  const { canManageUsers } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDisable, setConfirmDisable] = useState(null);

  // Form state
  const [formData, setFormData] = useState({ email: '', password: '', displayName: '', role: 'member' });
  const [formLoading, setFormLoading] = useState(false);

  const resetForm = () => {
    setFormData({ email: '', password: '', displayName: '', role: 'member' });
    setShowCreate(false);
    setEditingUser(null);
  };

  // Tạo tài khoản mới
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.displayName) {
      return toast.error('Vui lòng nhập đầy đủ thông tin');
    }
    if (formData.password.length < 6) {
      return toast.error('Mật khẩu phải ít nhất 6 ký tự');
    }

    setFormLoading(true);
    try {
      await createUserAccount(formData);
      toast.success(`Đã tạo tài khoản cho ${formData.displayName}`);
      resetForm();
    } catch (err) {
      toast.error('Lỗi tạo tài khoản: ' + (err.message || 'Không xác định'));
    } finally {
      setFormLoading(false);
    }
  };

  // Đổi quyền
  const handleRoleChange = async (userId, newRole) => {
    setFormLoading(true);
    try {
      await setUserRole({ userId, role: newRole });
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
      await disableUser({ userId });
      toast.success('Đã vô hiệu hóa tài khoản');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">{users.length} thành viên</p>
        </div>
        {canManageUsers && (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <MdAdd size={18} /> Thêm thành viên
          </button>
        )}
      </div>

      {/* Members table */}
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
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                        {user.displayName?.charAt(0)?.toUpperCase()}
                      </div>
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
                    <span className={`badge ${user.isActive !== false ? 'badge-green' : 'bg-gray-200 text-gray-500'}`}>
                      {user.isActive !== false ? 'Hoạt động' : 'Đã khóa'}
                    </span>
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

      {/* Modal tạo thành viên */}
      <Modal isOpen={showCreate} onClose={resetForm} title="Thêm thành viên mới">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Họ tên <span className="text-red-500">*</span></label>
            <input type="text" value={formData.displayName} onChange={e => setFormData(p => ({ ...p, displayName: e.target.value }))} className="input" placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="input" placeholder="email@example.com" />
          </div>
          <div>
            <label className="label">Mật khẩu <span className="text-red-500">*</span></label>
            <input type="text" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className="input" placeholder="Tối thiểu 6 ký tự" />
          </div>
          <div>
            <label className="label">Vai trò</label>
            <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="input">
              <option value="member">Nhân viên</option>
              <option value="manager">Phụ trách</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={resetForm} className="btn btn-secondary">Hủy</button>
            <button type="submit" disabled={formLoading} className="btn btn-primary">
              {formLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </Modal>

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
