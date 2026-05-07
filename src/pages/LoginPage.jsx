import { useState } from 'react';
import { loginWithGoogle, loginUnitWithEmail } from '../firebase/auth';
import { loginUnitFn } from '../firebase/functions';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineOfficeBuilding, HiOutlineUserGroup, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi';
import { ORG_NAME } from '../utils/constants';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('unit'); // 'internal' | 'unit'
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const handleUnitLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Vui lòng nhập username và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUnitFn({ username: username.trim(), password });
      const { fakeEmail } = result.data;
      await loginUnitWithEmail(fakeEmail, password);
      toast.success('Đăng nhập thành công!');
    } catch (error) {
      console.error('Chi tiết lỗi đăng nhập Unit:', error);
      const msg = error?.message || error?.code || 'Lỗi không xác định';
      if (msg.includes('Username không tồn tại')) {
        toast.error('Username không tồn tại.');
      } else if (msg.includes('Mật khẩu không đúng')) {
        toast.error('Mật khẩu không đúng.');
      } else if (msg.includes('bị khóa')) {
        toast.error('Tài khoản đã bị khóa. Liên hệ quản trị viên.');
      } else {
        toast.error('Lỗi đăng nhập: ' + msg);
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
        <div className="glass-card p-8 lg:p-10 space-y-6 animate-fade-in-up border-white/40 dark:border-white/5">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800/60 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('unit')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'unit'
                  ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <HiOutlineOfficeBuilding className="text-lg" />
              Đơn vị
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('internal')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                activeTab === 'internal'
                  ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <HiOutlineUserGroup className="text-lg" />
              Nội bộ
            </button>
          </div>

          {/* Unit Login Form */}
          {activeTab === 'unit' && (
            <form onSubmit={handleUnitLogin} className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Đăng nhập đơn vị</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Sử dụng tài khoản được cung cấp bởi quản trị viên
                </p>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="login-username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="vd: lethanhnghi.tdhp"
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200 text-sm"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mật khẩu
                </label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-11 pr-12 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200 text-sm"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M21 21l-3.122-3.122" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-wait text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đăng nhập...
                  </span>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
          )}

          {/* Internal Google Login */}
          {activeTab === 'internal' && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Đăng nhập nội bộ</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Dành cho cán bộ, nhân viên nội bộ cấp trên
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
          )}
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
