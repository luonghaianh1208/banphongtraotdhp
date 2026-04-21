import { useState } from 'react';
import { MdDownload } from 'react-icons/md';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { createCriteriaSet, deleteCriteriaSet } from '../../firebase/criteriaFirestore';
import { UNIT_BLOCKS } from '../../utils/constants';
import { exportCriteriaTemplate } from '../../utils/exportExcel';
import toast from 'react-hot-toast';

const CriteriaSetsPage = () => {
    const { criteriaSets, loading } = useCriteriaSets();
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        academicYear: '',
        description: '',
        targetBlocks: [],
        targetTypes: [],
    });

    const handleBlockToggle = (blockId) => {
        setFormData(prev => ({
            ...prev,
            targetBlocks: prev.targetBlocks.includes(blockId)
                ? prev.targetBlocks.filter(id => id !== blockId)
                : [...prev.targetBlocks, blockId],
            // Nếu bỏ chọn block → bỏ chọn tất cả type thuộc block đó
            targetTypes: prev.targetBlocks.includes(blockId)
                ? prev.targetTypes
                : prev.targetTypes,
        }));
    };

    const handleTypeToggle = (blockId, typeId) => {
        setFormData(prev => {
            const key = `${blockId}:${typeId}`;
            const newSelected = prev.targetTypes.includes(key)
                ? prev.targetTypes.filter(t => t !== key)
                : [...prev.targetTypes, key];
            return { ...prev, targetTypes: newSelected };
        });
    };

    const isTypeSelected = (blockId, typeId) => {
        return formData.targetTypes.includes(`${blockId}:${typeId}`);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = {
                ...formData,
                groups: [],
                totalMaxScore: 0,
                isActive: true,
            };
            await createCriteriaSet(data);
            toast.success('Tạo bộ tiêu chí thành công!');
            setShowModal(false);
            setFormData({ title: '', academicYear: '', description: '', targetBlocks: [], targetTypes: [] });
        } catch (err) {
            console.error(err);
            toast.error('Lỗi tạo bộ tiêu chí.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (setId) => {
        if (!window.confirm('Chắc chắn muốn xóa bộ tiêu chí này?')) return;
        try {
            await deleteCriteriaSet(setId);
            toast.success('Đã xóa bộ tiêu chí.');
        } catch (err) {
            console.error(err);
            toast.error('Lỗi xóa bộ tiêu chí.');
        }
    };

    const getTargetLabel = (set) => {
        if (!set.targetBlocks?.length) return 'Tất cả khối';
        return `${set.targetBlocks.length} khối, ${set.targetTypes?.length || 0} loại`;
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
                <div className="flex gap-2">
                    <button
                        onClick={exportCriteriaTemplate}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-sm font-medium transition-colors flex items-center gap-1"
                    >
                        <MdDownload size={18} /> Tải mẫu Excel
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded shadow-sm font-medium transition-colors"
                    >
                        + Tạo Bộ Tiêu Chí
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {criteriaSets.map(set => (
                    <div key={set.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{set.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 flex-1">{set.description}</p>
                        <div className="text-sm text-gray-500 mb-3 space-y-1">
                            <p>Năm học: <span className="font-medium text-gray-700">{set.academicYear}</span></p>
                            <p>Tổng điểm: <span className="font-bold text-green-600">{set.totalMaxScore}</span></p>
                            <p className="text-xs text-blue-600">Phân công: {getTargetLabel(set)}</p>
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
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
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

                            {/* Chọn Khối / Loại được nhận tiêu chí */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Giao cho Khối/Loại nào</label>
                                <p className="text-xs text-gray-500 mb-3">Để trống = áp dụng cho tất cả. Chọn cụ thể = chỉ cơ sở thuộc khối/loại đó mới thấy.</p>
                                <div className="space-y-3 border rounded-lg p-3 max-h-60 overflow-y-auto">
                                    {UNIT_BLOCKS.map(block => (
                                        <div key={block.id}>
                                            <label className="flex items-center gap-2 font-medium text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetBlocks.includes(block.id)}
                                                    onChange={() => handleBlockToggle(block.id)}
                                                    className="rounded text-primary"
                                                />
                                                {block.name}
                                            </label>
                                            {formData.targetBlocks.includes(block.id) && (
                                                <div className="ml-6 mt-1 space-y-1">
                                                    {block.types.map(type => (
                                                        <label key={type.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                                                            <input
                                                                type="checkbox"
                                                                checked={isTypeSelected(block.id, type.id)}
                                                                onChange={() => handleTypeToggle(block.id, type.id)}
                                                                className="rounded text-primary"
                                                            />
                                                            {type.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
                                    className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark"
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
