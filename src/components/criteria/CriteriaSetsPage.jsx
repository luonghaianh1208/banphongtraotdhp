import { useState } from 'react';
import { MdDownload, MdDelete, MdEdit, MdClose, MdCheck } from 'react-icons/md';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { createCriteriaSet, deleteCriteriaSet, updateCriteriaSet } from '../../firebase/criteriaFirestore';
import { UNIT_BLOCKS } from '../../utils/constants';
import { exportCriteriaTemplate } from '../../utils/exportExcel';
import toast from 'react-hot-toast';

const CriteriaSetsPage = () => {
    const { criteriaSets, loading } = useCriteriaSets();
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selected, setSelected] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    const [formData, setFormData] = useState({
        title: '', academicYear: '', description: '',
        targetBlocks: [], targetTypes: [],
    });

    const handleBlockToggle = (blockId) => {
        setFormData(prev => ({
            ...prev,
            targetBlocks: prev.targetBlocks.includes(blockId)
                ? prev.targetBlocks.filter(id => id !== blockId)
                : [...prev.targetBlocks, blockId],
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

    const isTypeSelected = (blockId, typeId) => formData.targetTypes.includes(`${blockId}:${typeId}`);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await createCriteriaSet({ ...formData, groups: [], totalMaxScore: 0, isActive: true });
            toast.success('Tạo bộ tiêu chí thành công!');
            setShowModal(false);
            setFormData({ title: '', academicYear: '', description: '', targetBlocks: [], targetTypes: [] });
        } catch (err) {
            toast.error('Lỗi tạo bộ tiêu chí.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (setId) => {
        if (!confirm('Chắc chắn muốn xóa bộ tiêu chí này?')) return;
        try {
            await deleteCriteriaSet(setId);
            toast.success('Đã xóa.');
        } catch (err) { toast.error('Lỗi xóa.'); }
    };

    // Xóa hàng loạt
    const handleBulkDelete = async () => {
        if (!confirm(`Xóa ${selected.length} bộ tiêu chí đã chọn?`)) return;
        try {
            for (const id of selected) await deleteCriteriaSet(id);
            setSelected([]);
            toast.success(`Đã xóa ${selected.length} bộ tiêu chí`);
        } catch (err) { toast.error('Lỗi xóa hàng loạt.'); }
    };

    // Sửa tên inline
    const startEdit = (set) => { setEditingId(set.id); setEditTitle(set.title); };
    const saveEdit = async () => {
        if (!editTitle.trim()) { toast.error('Tên không được rỗng'); return; }
        try {
            await updateCriteriaSet(editingId, { title: editTitle.trim() });
            toast.success('Đã cập nhật tên');
            setEditingId(null);
        } catch (err) { toast.error('Lỗi cập nhật.'); }
    };

    const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleAll = () => setSelected(selected.length === criteriaSets.length ? [] : criteriaSets.map(s => s.id));

    const getTargetLabel = (set) => {
        if (!set.targetBlocks?.length) return 'Tất cả khối';
        const blockNames = set.targetBlocks.map(bId => UNIT_BLOCKS.find(b => b.id === bId)?.name || bId);
        return blockNames.join(', ');
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Cấu hình Bộ Tiêu Chí</h2>
                    <p className="text-gray-600">Quản lý bộ khung chỉ tiêu chấm điểm. Tổng: <strong>{criteriaSets.length}</strong></p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={exportCriteriaTemplate} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center gap-1">
                        <MdDownload size={16} /> Tải mẫu Excel
                    </button>
                    <button onClick={() => setShowModal(true)} className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded text-sm font-medium">
                        + Tạo Bộ Tiêu Chí
                    </button>
                    {selected.length > 0 && (
                        <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center gap-1">
                            <MdDelete size={16} /> Xóa ({selected.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {criteriaSets.map(set => (
                    <div key={set.id} className={`bg-white p-6 rounded-xl shadow-sm border flex flex-col h-full ${selected.includes(set.id) ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-100'}`}>
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={selected.includes(set.id)}
                                    onChange={() => toggleSelect(set.id)} className="rounded border-gray-300" />
                                {editingId === set.id ? (
                                    <div className="flex items-center gap-1">
                                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                            className="border rounded px-2 py-1 text-sm font-bold" autoFocus />
                                        <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><MdCheck size={16} /></button>
                                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><MdClose size={16} /></button>
                                    </div>
                                ) : (
                                    <h3 className="text-lg font-bold text-gray-800">{set.title}</h3>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 flex-1">{set.description}</p>
                        <div className="text-sm text-gray-500 mb-3 space-y-1">
                            <p>Năm học: <span className="font-medium text-gray-700">{set.academicYear}</span></p>
                            <p>Tổng điểm: <span className="font-bold text-green-600">{set.totalMaxScore}</span></p>
                            <p className="text-xs text-blue-600">Phân công: {getTargetLabel(set)}</p>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                            <button onClick={() => startEdit(set)} className="text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded text-sm flex items-center gap-1">
                                <MdEdit size={14} /> Sửa
                            </button>
                            <button onClick={() => handleDelete(set.id)} className="text-red-600 hover:bg-red-50 px-2 py-1.5 rounded text-sm flex items-center gap-1">
                                <MdDelete size={14} /> Xóa
                            </button>
                        </div>
                    </div>
                ))}
                {criteriaSets.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">Chưa có bộ tiêu chí nào.</div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Tạo Bộ Tiêu Chí Mới</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên bộ tiêu chí</label>
                                <input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2" placeholder="VD: Tiêu chí thi đua 2024-2025" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Năm học</label>
                                <input required value={formData.academicYear} onChange={e => setFormData(p => ({ ...p, academicYear: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2" placeholder="VD: 2024-2025" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả thêm</label>
                                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2" rows={3} />
                            </div>
                            {/* Chọn Khối / Loại */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Giao cho Khối/Loại nào</label>
                                <p className="text-xs text-gray-500 mb-3">Để trống = áp dụng cho tất cả.</p>
                                <div className="space-y-3 border rounded-lg p-3 max-h-60 overflow-y-auto">
                                    {UNIT_BLOCKS.map(block => (
                                        <div key={block.id}>
                                            <label className="flex items-center gap-2 font-medium text-sm text-gray-700 cursor-pointer">
                                                <input type="checkbox" checked={formData.targetBlocks.includes(block.id)}
                                                    onChange={() => handleBlockToggle(block.id)} className="rounded text-primary" />
                                                {block.name}
                                            </label>
                                            {formData.targetBlocks.includes(block.id) && (
                                                <div className="ml-6 mt-1 space-y-1">
                                                    {block.types.map(type => (
                                                        <label key={type.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                            <input type="checkbox" checked={isTypeSelected(block.id, type.id)}
                                                                onChange={() => handleTypeToggle(block.id, type.id)} className="rounded text-primary" />
                                                            {type.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50" disabled={isSubmitting}>Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark" disabled={isSubmitting}>
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
