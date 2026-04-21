import React, { useState } from 'react';
import { useSubmissionPeriods } from '../../hooks/useSubmissionPeriods';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { createSubmissionPeriod, updateSubmissionPeriod } from '../../firebase/criteriaFirestore';

const PeriodsManagePage = () => {
    const { periods, loading } = useSubmissionPeriods();
    const { criteriaSets } = useCriteriaSets();

    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        academicYear: '',
        deadline: '',
        criteriaSetId: ''
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.criteriaSetId) {
            alert('Vui lòng chọn một Bộ tiêu chí định mức!');
            return;
        }

        setIsSubmitting(true);
        try {
            await createSubmissionPeriod({
                title: formData.title,
                academicYear: formData.academicYear,
                deadline: new Date(formData.deadline).toISOString(),
                criteriaSetId: formData.criteriaSetId,
                status: 'active', // Tạo xong là mở luôn cho tiện dùng
            });
            setShowModal(false);
            setFormData({ title: '', academicYear: '', deadline: '', criteriaSetId: '' });
            alert('Tạo đợt chấm điểm thành công!');
        } catch (err) {
            console.error(err);
            alert('Lỗi khi tạo đợt.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (periodId, newStatus) => {
        if (!window.confirm(`Xác nhận chuyển trạng thái đợt này thành: ${newStatus}?`)) return;
        try {
            await updateSubmissionPeriod(periodId, { status: newStatus });
        } catch (err) {
            console.error(err);
            alert('Lỗi cập nhật trạng thái');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý Đợt Báo Cáo Chỉ Tiêu</h2>
                    <p className="text-gray-600">Mở các đợt nộp báo cáo và quản lý tiến độ nộp của các cơ sở.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-sm font-medium transition-colors"
                >
                    + Mở Đợt Mới
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {periods.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên đợt báo cáo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Năm học</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn nộp</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {periods.map(period => (
                                    <tr key={period.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{period.title}</div>
                                            <div className="text-sm text-gray-500">Bộ tiêu chí: {criteriaSets.find(c => c.id === period.criteriaSetId)?.title || 'Đang rà soát...'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {period.academicYear}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                            {new Date(period.deadline).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${period.status === 'active' ? 'bg-green-100 text-green-800' :
                                                period.status === 'locked' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {period.status === 'active' ? 'Đang mở nộp' :
                                                    period.status === 'locked' ? 'Đã khóa nộp' : 'Đã công bố điểm'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {period.status === 'active' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(period.id, 'locked')}
                                                    className="text-yellow-600 hover:text-yellow-900 mr-4"
                                                >
                                                    Khóa đợt
                                                </button>
                                            )}
                                            {period.status === 'locked' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(period.id, 'published')}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    Công bố điểm
                                                </button>
                                            )}
                                            <a href={`/criteria-overview/${period.id}`} className="text-primary hover:text-primary-dark">
                                                Chấm điểm
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        Chưa có đợt báo cáo nào. Bấm nút "Mở Đợt Mới" để bắt đầu.
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Mở Đợt Báo Cáo Mới</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đợt</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                    placeholder="VD: Báo cáo chỉ tiêu Học kỳ 1 (2024-2025)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Năm học</label>
                                <input
                                    required
                                    value={formData.academicYear}
                                    onChange={e => setFormData(p => ({ ...p, academicYear: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                    placeholder="VD: 2024-2025"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp (Deadline)</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.deadline}
                                    onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Bộ Tiêu Chí áp dụng</label>
                                <select
                                    required
                                    value={formData.criteriaSetId}
                                    onChange={e => setFormData(p => ({ ...p, criteriaSetId: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary bg-white"
                                >
                                    <option value="" disabled>-- Chọn bộ tiêu chí --</option>
                                    {criteriaSets.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} ({c.academicYear})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Đợt chấm điểm này sẽ sử dụng khung điểm từ Bộ Tiêu Chí đã chọn.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors flex items-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></span>}
                                    Tạo Đợt Nộp
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeriodsManagePage;
