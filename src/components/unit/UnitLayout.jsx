import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from '../../utils/constants';

const UnitLayout = () => {
    const { user, isUnit, loading, logout } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Nếu không phải unit thì đẩy về trang chủ nội bộ
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar / Topbar cho Unit */}
            <nav className="bg-white w-full md:w-64 border-b md:border-r md:border-b-0 border-gray-200 flex-shrink-0">
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-lg font-bold text-gray-800">Cổng Cơ Sở</h1>
                    <p className="text-sm text-gray-500 mt-1">{user.unitName || user.email}</p>
                </div>

                <div className="p-4 flex flex-col gap-2">
                    <Link
                        to="/unit/dashboard"
                        className={`px-4 py-2 rounded-lg transition-colors ${location.pathname === '/unit/dashboard'
                                ? 'bg-primary text-white font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Tổng quan
                    </Link>
                    <Link
                        to="/unit/submissions"
                        className={`px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/unit/submissions')
                                ? 'bg-primary text-white font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Chỉ Tiêu
                    </Link>
                    <Link
                        to="/unit/plans"
                        className={`px-4 py-2 rounded-lg transition-colors ${location.pathname.includes('/unit/plans')
                                ? 'bg-primary text-white font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        Kế Hoạch & Hội Thi
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-auto md:mt-8"
                    >
                        Đăng xuất
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default UnitLayout;
