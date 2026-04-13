// SettingsPage — cài đặt cá nhân: đổi mật khẩu, thông tin
import { useState } from 'react';
import { MdLock, MdPerson, MdSave } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../firebase/auth';
import { ROLES, ORG_NAME } from '../utils/constants';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Mật khẩu mới phải ít nhất 6 ký tự');
    if (newPassword !== confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');

    setLoading(true);
    try {
      await changePassword(newPassword);
      toast.success('Đã đổi mật khẩu thành công');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        toast.error('Cần đăng nhập lại để đổi mật khẩu. Vui lòng đăng xuất và đăng nhập lại.');
      } else {
        toast.error('Lỗi: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto fade-in space-y-6">
      {/* Thông tin cá nhân */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <MdPerson size={20} /> Thông tin cá nhân
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="w-32 text-sm text-gray-500">Họ tên:</span>
            <span className="text-sm font-medium text-gray-900">{userProfile?.displayName}</span>
          </div>
          <div className="flex items-center">
            <span className="w-32 text-sm text-gray-500">Email:</span>
            <span className="text-sm text-gray-900">{currentUser?.email}</span>
          </div>
          <div className="flex items-center">
            <span className="w-32 text-sm text-gray-500">Vai trò:</span>
            <span className={`badge ${
              userProfile?.role === 'admin' ? 'bg-red-100 text-red-700' :
              userProfile?.role === 'manager' ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {ROLES[userProfile?.role]?.label}
            </span>
          </div>
          <div className="flex items-center">
            <span className="w-32 text-sm text-gray-500">Tổ chức:</span>
            <span className="text-sm text-gray-900">{ORG_NAME}</span>
          </div>
        </div>
      </div>

      {/* Đổi mật khẩu */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <MdLock size={20} /> Đổi mật khẩu
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>
          <div>
            <label className="label">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            <MdSave size={18} />
            {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>

      {/* App info */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Thông tin ứng dụng</h3>
        <p className="text-sm text-gray-500">Phiên bản 1.0.0</p>
        <p className="text-sm text-gray-500">© 2026 {ORG_NAME}</p>
      </div>
    </div>
  );
};

export default SettingsPage;
