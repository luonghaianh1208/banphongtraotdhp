// LoginPage — đăng nhập chỉ bằng Google
import { useState } from 'react';
import { loginWithGoogle } from '../firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import { ORG_NAME } from '../utils/constants';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Đăng nhập thành công!');
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error('Lỗi đăng nhập Google: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl font-bold shadow-lg mb-4">
            PT
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý công việc</h1>
          <p className="text-sm text-gray-500 mt-1">{ORG_NAME}</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Chào mừng bạn!</h2>
            <p className="text-sm text-gray-500">Đăng nhập bằng tài khoản Google để tiếp tục</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-base shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
                Đang đăng nhập...
              </span>
            ) : (
              <>
                <FcGoogle size={24} />
                Đăng nhập với Google
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Người dùng mới sẽ cần Tổ trưởng duyệt trước khi sử dụng hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
