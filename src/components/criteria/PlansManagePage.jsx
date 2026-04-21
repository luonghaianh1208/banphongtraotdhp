import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdDelete, MdEdit, MdCheck, MdClose } from 'react-icons/md';
import { usePlans } from '../../hooks/usePlans';
import { useUnits } from '../../hooks/useUnits';
import { createPlan, updatePlan, deletePlan } from '../../firebase/criteriaFirestore';
import { UNIT_BLOCKS } from '../../utils/constants';
import toast from 'react-hot-toast';

const PlansManagePage = () => {
    const { plans, loading: plansLoading } = usePlans();
    const { units, loading: unitsLoading } = useUnits();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selected, setSelected] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    const [formData, setFormData] = useState({
        title: '', type: 'plan', description: '', submissionDeadline: '',
        targetBlocks: [], targetTypes: [],
    });

    const loading = plansLoading || unitsLoading;

    const filteredPlans = plans.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getBlockLabel = (plan) => {
        if (!plan.targetBlocks?.length) return 'Tất cả khối';
        const names = plan.targetBlocks.map(bId => UNIT_BLOCKS.find(b => b.id === bId)?.name || bId);
        return names.join(', ');
    };

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
            return {
                ...prev,
                targetTypes: prev.targetTypes.includes(key)
                    ? prev.targetTypes.filter(t => t !== key)
                    : [...prev.targetTypes, key],
            };
        });
    };

    const isTypeSelected = (blockId, typeId) => formData.targetTypes.includes(`${blockId}:${typeId}`);

    // Tạo mới
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.title) { toast.error('Nhập tên kế hoạch'); return; }
        setIsSubmitting(true);
        try {
            await createPlan({
                title: formData.title,
                type: formData.type,
                description: formData.description,
                submissionDeadline: formData.submissionDeadline || null,
                targetBlocks: formData.targetBlocks,
                targetTypes: formData.targetTypes,
                status: 'draft',
            });
            toast.success('Tạo kế hoạch thành công!');
            setShowAddModal(false);
            setFormData({ title: '', type: 'plan', description: '', submissionDeadline: '', targetBlocks: [], targetTypes: [] });
        } catch (err) {
            toast.error('Lỗi: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Sửa tên inline
    const startEdit = (plan) => { setEditingId(plan.id); setEditTitle(plan.title); };
    const saveEdit = async () => {
        if (!editTitle.trim()) return;
        try {
            await updatePlan(editingId, { title: editTitle.trim() });
            toast.success('Đã cập nhật');
            setEditingId(null);
        } catch (err) { toast.error('Lỗi cập nhật.'); }
    };

    // Xóa đơn lẻ
    const handleDelete = async (planId, name) => {
        if (!confirm(`Xóa "${name}"?`)) return;
        try {
            await deletePlan(planId);
            toast.success('Đã xóa');
        } catch (err) { toast.error('Lỗi xóa.'); }
    };

    // Xóa hàng loạt
    const handleBulkDelete = async () => {
        if (!confirm(`Xóa ${selected.length} kế hoạch đã chọn?`)) return;
        try {
            for (const id of selected) await deletePlan(id);
            setSelected([]);
            toast.success(`Đã xóa ${selected.length} kế hoạch`);
        } catch (err) { toast.error('Lỗi xóa hàng loạt.'); }
    };

    const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleAll = () => setSelected(selected.length === filteredPlans.length ? [] : filteredPlans.map(p => p.id));

    const statusMap = {
        draft: { label: 'Nháp', cls: 'bg-gray-100 text-gray-700' },
        published: { label: 'Đang mở', cls: 'bg-blue-100 text-blue-800' },
        active: { label: 'Đang mở', cls: 'bg-green-100 text-green-800' },
        closed: { label: 'Đã đóng', cls: 'bg-yellow-100 text-yellow-800' },
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý Kế hoạch & Hội thi</h2>
                    <p className="text-gray-600">Tổng: <strong>{plans.length}</strong> kế hoạch/hội thi</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="border rounded-md px-3 py-2 bg-white text-sm">
                        <option value="all">Tất cả trạng thái</option>
                        <option value="draft">Nháp</option>
                        <option value="published">Đang mở</option>
                        <option value="closed">Đã đóng</option>
                    </select>
                    <input type="text" placeholder="Tìm kiếm..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm w-48" />
                    <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center gap-1">
                        <MdAdd size={16} /> Thêm Kế hoạch
                    </button>
                    {selected.length > 0 && (
                        <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center gap-1">
                            <MdDelete size={16} /> Xóa ({selected.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input type="checkbox" checked={selected.length === filteredPlans.length && filteredPlans.length > 0}
                                        onChange={toggleAll} className="rounded border-gray-300" />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Kế hoạch / Hội thi</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giao cho</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn nộp</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredPlans.map(plan => {
                                const st = statusMap[plan.status] || statusMap.draft;
                                return (
                                    <tr key={plan.id} className={`hover:bg-gray-50 ${selected.includes(plan.id) ? 'bg-blue-50' : ''}`}>
                                        <td className="px-4 py-3">
                                            <input type="checkbox" checked={selected.includes(plan.id)}
                                                onChange={() => toggleSelect(plan.id)} className="rounded border-gray-300" />
                                        </td>
                                        <td className="px-4 py-3">
                                            {editingId === plan.id ? (
                                                <div className="flex items-center gap-1">
                                                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                                        className="border rounded px-2 py-1 text-sm w-full" />
                                                    <button onClick={saveEdit} className="p-1 text-green-600"><MdCheck size={16} /></button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><MdClose size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="font-medium text-gray-900 text-sm">{plan.title}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${plan.type === 'contest' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                                {plan.type === 'contest' ? 'Hội thi' : 'Kế hoạch'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-blue-600">{getBlockLabel(plan)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {plan.submissionDeadline ? new Date(plan.submissionDeadline).toLocaleDateString('vi-VN') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => startEdit(plan)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><MdEdit size={16} /></button>
                                                <button onClick={() => handleDelete(plan.id, plan.title)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Xóa"><MdDelete size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredPlans.length === 0 && (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">Không có kế hoạch nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal tạo mới */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Thêm Kế hoạch / Hội thi</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
                                <input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2" placeholder="VD: Hội thi Dân vũ 2025" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                                <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 bg-white">
                                    <option value="plan">Kế hoạch</option>
                                    <option value="contest">Hội thi</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2" rows={3} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hạn nộp hồ sơ</label>
                                <input type="date" value={formData.submissionDeadline}
                                    onChange={e => setFormData(p => ({ ...p, submissionDeadline: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2" />
                            </div>
                            {/* Khối / Loại */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Giao cho Khối/Loại nào</label>
                                <p className="text-xs text-gray-500 mb-3">Để trống = tất cả.</p>
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
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50" disabled={isSubmitting}>Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang tạo...' : 'Tạo kế hoạch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlansManagePage;
