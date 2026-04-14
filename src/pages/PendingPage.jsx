// PendingPage — trang chờ admin duyệt (user mới đăng nhập Google)
import { MdHourglassTop, MdLogout } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';
import { ORG_NAME } from '../utils/constants';

const PendingPage = () => {
  const { currentUser, userProfile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-primary-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 text-amber-600 mb-6 shadow-md">
          <MdHourglassTop size={40} className="animate-pulse" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-5">
          <h1 className="text-xl font-bold text-gray-900">Chờ phê duyệt</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Xin chào <strong>{userProfile?.displayName || currentUser?.displayName}</strong>,<br />
            tài khoản của bạn đã được tạo thành công.<br />
            Vui lòng chờ <strong>Tổ trưởng</strong> duyệt để sử dụng hệ thống.
          </p>

          {/* User info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="text-gray-800 font-medium">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Trạng thái:</span>
              <span className="badge bg-amber-100 text-amber-700">Đang chờ duyệt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tổ chức:</span>
              <span className="text-gray-800">{ORG_NAME}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 italic">
            Trang này sẽ tự động chuyển khi Tổ trưởng duyệt tài khoản của bạn.
          </p>

          <button
            onClick={logout}
            className="btn btn-secondary w-full py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
          >
            <MdLogout size={18} />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingPage;
