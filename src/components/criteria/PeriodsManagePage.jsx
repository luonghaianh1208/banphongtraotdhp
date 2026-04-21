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
            toast.error('Vui lòng chọn một Bộ tiêu chí định mức!');
            return;
        }

        setIsSubmitting(true);
        try {
            await createSubmissionPeriod({
                title: formData.title,
                academicYear: formData.academicYear,
                deadline: new Date(formData.deadline).toISOString(),
                criteriaSetId: formData.criteriaSetId,
                status: 'active',
            });
            setShowModal(false);
            setFormData({ title: '', academicYear: '', deadline: '', criteriaSetId: '' });
            toast.success('Tạo đợt chấm điểm thành công!');
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi tạo đợt.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (periodId, newStatus) => {
        if (!window.confirm(`Xác nhận chuyển trạng thái đợt này thành: ${newStatus}?`)) return;
        try {
            await updateSubmissionPeriod(periodId, { status: newStatus });
            toast.success('Đã cập nhật trạng thái');
        } catch (err) {
            console.error(err);
            toast.error('Lỗi cập nhật trạng thái');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-emerald-200 dark:border-emerald-900/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );

    const statusMap = {
        active: { label: 'Đang mở nộp', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
        locked: { label: 'Đã khóa nộp', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
        published: { label: 'Đã cộng điểm', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' },
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Quản lý Đợt Báo Cáo</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Mở các đợt nộp báo cáo và quản lý tiến độ nộp của các cơ sở.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Mở Đợt Mới
                </button>
            </div>

            <div className="card overflow-hidden">
                {periods.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên đợt báo cáo</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Năm học</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hạn nộp</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {periods.map(period => (
                                    <tr key={period.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-200">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {period.title}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                {criteriaSets.find(c => c.id === period.criteriaSetId)?.title || 'Đang rà soát...'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                {period.academicYear}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-rose-500 dark:text-rose-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {new Date(period.deadline).toLocaleString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <span className={`badge ${statusMap[period.status]?.color || 'bg-slate-100 text-slate-600'} px-3 py-1 shadow-sm`}>
                                                    {statusMap[period.status]?.label || period.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                {period.status === 'active' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(period.id, 'locked')}
                                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 transition-colors"
                                                    >
                                                        Khóa đợt
                                                    </button>
                                                )}
                                                {period.status === 'locked' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(period.id, 'published')}
                                                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400 transition-colors"
                                                    >
                                                        Công bố điểm
                                                    </button>
                                                )}
                                                <a
                                                    href={`/criteria-overview/${period.id}`}
                                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 transition-colors"
                                                >
                                                    Chấm điểm
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 border border-slate-100 dark:border-slate-800">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Chưa có đợt báo cáo nào</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Bắt đầu bằng cách tạo một đợt chấm điểm mới cho năm học này.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn btn-primary inline-flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Mở Đợt Mới Ngay
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-300">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full slide-in-from-bottom-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Mở Đợt Báo Cáo</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Tên đợt báo cáo</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="input w-full"
                                    placeholder="VD: Báo cáo chỉ tiêu Học kỳ 1 (2024-2025)"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Năm học</label>
                                    <input
                                        required
                                        value={formData.academicYear}
                                        onChange={e => setFormData(p => ({ ...p, academicYear: e.target.value }))}
                                        className="input w-full"
                                        placeholder="2024-2025"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Hạn nộp</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={formData.deadline}
                                        onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Bộ tiêu chí áp dụng</label>
                                <select
                                    required
                                    value={formData.criteriaSetId}
                                    onChange={e => setFormData(p => ({ ...p, criteriaSetId: e.target.value }))}
                                    className="input w-full"
                                >
                                    <option value="" disabled>-- Chọn bộ tiêu chí --</option>
                                    {criteriaSets.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} ({c.academicYear})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-1 mt-1 uppercase tracking-wider">
                                    Sẽ sử dụng khung điểm từ bộ tiêu chí này
                                </p>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 mt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition-all"
                                    disabled={isSubmitting}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary px-8 shadow-lg shadow-emerald-500/20"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Đang xử lý...
                                        </div>
                                    ) : 'Tạo Đợt Nộp'}
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
