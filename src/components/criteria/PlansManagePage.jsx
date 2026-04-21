import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlans } from '../../hooks/usePlans';
import { useUnits } from '../../hooks/useUnits';

const PlansManagePage = () => {
    const { plans, loading: plansLoading } = usePlans();
    const { units, loading: unitsLoading } = useUnits();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const loading = plansLoading || unitsLoading;

    const filteredPlans = plans.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const getUnitName = (unitId) => {
        const u = units.find(u => u.id === unitId);
        return u ? u.unitName : 'Cơ sở không xác định';
    };

    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý Kế hoạch & Hội thi</h2>
                    <p className="text-gray-600">Xem và đánh giá các kế hoạch/hồ sơ hội thi do cơ sở nạp lên.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary bg-white"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="submitted">Chờ duyệt (Đã nộp)</option>
                        <option value="reviewed">Đã duyệt</option>
                        <option value="rejected">Cần sửa (Từ chối)</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo Tên kế hoạch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 border border-gray-300 rounded-md px-4 py-2 focus:ring-primary focus:border-primary"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Kế hoạch / Hội thi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị (Cơ sở)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại (Category)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPlans.map(plan => (
                                <tr key={plan.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{plan.title}</div>
                                        <div className="text-xs text-gray-400">Nộp lúc: {plan.submittedAt ? new Date(plan.submittedAt).toLocaleDateString('vi-VN') : '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {getUnitName(plan.unitId)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-medium rounded bg-purple-50 text-purple-700">
                                            {plan.category || 'Khác'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${plan.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                                                plan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {plan.status === 'reviewed' ? 'Đã duyệt' :
                                                plan.status === 'rejected' ? 'Cần sửa' : 'Chờ duyệt'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link
                                            to={`/plans/${plan.id}`}
                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors"
                                        >
                                            {plan.status === 'submitted' ? 'Duyệt bài' : 'Xem chi tiết'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredPlans.length === 0 && (
                                <tr className="border-t">
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Không có kế hoạch nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PlansManagePage;
