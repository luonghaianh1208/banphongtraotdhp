// SettingsPage — hồ sơ cá nhân
import { MdPerson } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { ROLES, ORG_NAME } from '../utils/constants';

const SettingsPage = () => {
  const { currentUser, userProfile } = useAuth();

  return (
    <div className="max-w-2xl mx-auto fade-in space-y-6">
      {/* Thông tin cá nhân */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <MdPerson size={20} /> Hồ sơ cá nhân
        </h3>
        <div className="flex items-center gap-4 mb-5">
          {userProfile?.avatar ? (
            <img src={userProfile.avatar} alt="" className="w-16 h-16 rounded-full shadow-md" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl shadow-md">
              {userProfile?.displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-gray-900">{userProfile?.displayName}</p>
            <p className="text-sm text-gray-500">{currentUser?.email}</p>
          </div>
        </div>
        <div className="space-y-3 border-t border-gray-100 pt-4">
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
          <div className="flex items-center">
            <span className="w-32 text-sm text-gray-500">Đăng nhập:</span>
            <span className="text-sm text-gray-900">Google</span>
          </div>
        </div>
      </div>

      {/* App info */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Thông tin ứng dụng</h3>
        <p className="text-sm text-gray-500">Phiên bản 2.0.0</p>
        <p className="text-sm text-gray-500">© 2026 {ORG_NAME}</p>
      </div>
    </div>
  );
};

export default SettingsPage;
