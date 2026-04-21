import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSubmissionPeriods } from '../../hooks/useSubmissionPeriods';
import { Link } from 'react-router-dom';

const UnitDashboard = () => {
    const { user } = useAuth();
    const { periods, loading } = useSubmissionPeriods();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Lấy danh sách các kỳ đang active/public
    const activePeriods = periods.filter(p => p.status === 'published' || p.status === 'active');

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Xin chào, {user?.unitName || user?.email}!</h2>
                <p className="text-gray-600">
                    Chào mừng quay trở lại Cổng Quản lý Cơ sở thuộc Ban Phong trào TĐHP. Tại đây bạn có thể nộp báo cáo chỉ tiêu thi đua và tham gia các kế hoạch/hội thi.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Widget Chỉ tiêu */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Chỉ tiêu Thi đua</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {activePeriods.length} kỳ đang mở
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-6">
                        Báo cáo kết quả thực hiện các chỉ tiêu thi đua theo quý, năm.
                    </p>
                    <div className="flex justify-end mt-auto">
                        <Link
                            to="/unit/submissions"
                            className="text-primary hover:text-primary-dark font-medium text-sm flex items-center"
                        >
                            Xem danh sách
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </Link>
                    </div>
                </div>

                {/* Widget Kế hoạch & Hội thi */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Kế hoạch & Hội thi</h3>
                        <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            Mới nhất
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-6">
                        Xem và nộp hồ sơ tham gia các kế hoạch, chuyên đề, hội thi.
                    </p>
                    <div className="flex justify-end mt-auto">
                        <Link
                            to="/unit/plans"
                            className="text-primary hover:text-primary-dark font-medium text-sm flex items-center"
                        >
                            Xem danh sách
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnitDashboard;
