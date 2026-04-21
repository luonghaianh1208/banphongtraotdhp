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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-500 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500/10 dark:bg-primary-500/5 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full animate-pulse duration-700" />

      <div className="w-full max-w-md relative z-10 px-4">
        {/* Logo area */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white text-3xl font-bold shadow-2xl shadow-primary-500/20 mb-6 group hover:scale-105 transition-transform duration-300">
            <span className="group-hover:rotate-12 transition-transform duration-300">PT</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            HubConnect
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-primary-300 dark:bg-primary-800"></span>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-widest">{ORG_NAME}</p>
            <span className="h-px w-8 bg-primary-300 dark:bg-primary-800"></span>
          </div>
        </div>

        {/* Login card */}
        <div className="glass-card p-8 lg:p-10 space-y-8 animate-fade-in-up border-white/40 dark:border-white/5">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Chào mừng trở lại</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Vui lòng đăng nhập bằng tài khoản Google công việc
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg transition-all duration-300 font-semibold group disabled:opacity-70 disabled:cursor-wait"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3 text-primary-600 dark:text-primary-400">
                <div className="w-5 h-5 border-2 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin" />
                Đang kết nối...
              </span>
            ) : (
              <>
                <div className="bg-white dark:bg-white rounded-lg p-1 group-hover:scale-110 transition-transform">
                  <FcGoogle size={24} />
                </div>
                <span>Đăng nhập qua Google</span>
              </>
            )}
          </button>

          <div className="pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-start gap-3 p-4 bg-amber-50/50 dark:bg-amber-500/5 rounded-xl border border-amber-100/50 dark:border-amber-500/10">
              <div className="mt-0.5 text-amber-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                Người dùng mới sẽ cần được Quản trị viên phê duyệt trước khi có quyền truy cập đầy đủ các chức năng.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600 font-medium tracking-wide">
          &copy; {new Date().getFullYear()} {ORG_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
