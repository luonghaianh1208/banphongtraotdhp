import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from '../../utils/constants';

const UnitLayout = () => {
    const { currentUser: user, isUnit, loading, logout } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user || !isUnit) {
        return <Navigate to="/" replace />;
    }

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const unitNavItems = [
        { path: '/unit/dashboard', label: 'Tổng quan' },
        { path: '/unit/submissions', label: 'Chỉ tiêu' },
        { path: '/unit/plans', label: 'Kế hoạch & Hội thi' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col md:flex-row transition-colors duration-500">
            {/* Sidebar cho Unit */}
            <nav className="w-full md:w-72 glass-card rounded-none md:rounded-r-3xl border-0 border-b md:border-r border-gray-200 dark:border-white/5 flex-shrink-0 z-20 flex flex-col">
                <div className="p-8 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
                            CS
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Cổng Cơ Sở</h1>
                        </div>
                    </div>
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/20">
                        <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Đơn vị</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{user.unitName || user.email}</p>
                    </div>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-1.5 mt-4">
                    {unitNavItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-2xl transition-all duration-300 font-bold group ${location.pathname === item.path || (item.path !== '/unit/dashboard' && location.pathname.includes(item.path))
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 scale-[1.02]'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}

                    <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-3 text-red-500 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-all duration-300 mt-auto mb-4"
                    >
                        Đăng xuất
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 dark:bg-primary-500/2 blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto animate-fade-in-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default UnitLayout;
