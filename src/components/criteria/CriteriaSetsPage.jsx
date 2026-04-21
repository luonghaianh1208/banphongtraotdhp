import React, { useState } from 'react';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { createCriteriaSet, deleteCriteriaSet } from '../../firebase/criteriaFirestore';

const CriteriaSetsPage = () => {
    const { criteriaSets, loading } = useCriteriaSets();
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State form tạo mới
    const [formData, setFormData] = useState({
        title: '',
        academicYear: '',
        description: '',
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = {
                ...formData,
                groups: [], // Sẽ có UI riêng để add group và condition (hoặc Import Excel)
                totalMaxScore: 0,
                isActive: true
            };
            await createCriteriaSet(data);
            setShowModal(false);
            setFormData({ title: '', academicYear: '', description: '' });
            alert('Tạo bộ tiêu chí thành công! Hãy click vào bộ tiêu chí để cấu hình chi tiết (hoặc import Excel).');
        } catch (err) {
            console.error(err);
            alert('Lỗi tạo bộ tiêu chí.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (setId) => {
        if (!window.confirm('Chắc chắn muốn xóa bộ tiêu chí này?')) return;
        try {
            await deleteCriteriaSet(setId);
        } catch (err) {
            console.error(err);
            alert('Lỗi xóa bộ tiêu chí.');
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
                    <h2 className="text-2xl font-bold text-gray-800">Cấu hình Bộ Tiêu Chí</h2>
                    <p className="text-gray-600">Quản lý các bộ khung chỉ tiêu chấm điểm cho các kỳ thi đua.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded shadow-sm font-medium transition-colors"
                >
                    + Tạo Bộ Tiêu Chí
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {criteriaSets.map(set => (
                    <div key={set.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{set.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 flex-1">{set.description}</p>
                        <div className="text-sm text-gray-500 mb-4 space-y-1">
                            <p>Năm học: <span className="font-medium text-gray-700">{set.academicYear}</span></p>
                            <p>Tổng điểm: <span className="font-bold text-green-600">{set.totalMaxScore}</span></p>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => alert('Chức năng Editor / Import Excel đang phát triển...')}
                                className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded font-medium text-sm transition-colors"
                            >
                                Cấu hình
                            </button>
                            <button
                                onClick={() => handleDelete(set.id)}
                                className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded font-medium text-sm transition-colors"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                ))}
                {criteriaSets.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        Chưa có bộ tiêu chí nào.
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Tạo Bộ Tiêu Chí Mới</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên bộ tiêu chí</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                    placeholder="VD: Tiêu chí thi đua Liên đội TH 2024-2025"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả thêm</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-md font-medium"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Đang tạo...' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CriteriaSetsPage;
