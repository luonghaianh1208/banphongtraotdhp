import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MdAdd, MdDelete, MdEdit, MdCheck, MdClose } from 'react-icons/md';
import { usePlans } from '../../hooks/usePlans';
import { useUnits } from '../../hooks/useUnits';
import { createPlan, updatePlan, deletePlan } from '../../firebase/criteriaFirestore';
import { UNIT_BLOCKS } from '../../utils/constants';
import toast from 'react-hot-toast';

const PlansManagePage = () => {
    const { plans, loading: plansLoading } = usePlans();
    const { loading: unitsLoading } = useUnits();

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

    const startEdit = (plan) => { setEditingId(plan.id); setEditTitle(plan.title); };
    const saveEdit = async () => {
        if (!editTitle.trim()) return;
        try {
            await updatePlan(editingId, { title: editTitle.trim() });
            toast.success('Đã cập nhật');
            setEditingId(null);
        } catch (_) { toast.error('Lỗi cập nhật.'); }
    };

    const handleDelete = async (planId, name) => {
        if (!confirm(`Xóa "${name}"?`)) return;
        try {
            await deletePlan(planId);
            toast.success('Đã xóa');
        } catch (_) { toast.error('Lỗi xóa.'); }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Xóa ${selected.length} kế hoạch đã chọn?`)) return;
        try {
            for (const id of selected) await deletePlan(id);
            setSelected([]);
            toast.success(`Đã xóa ${selected.length} kế hoạch`);
        } catch (_) { toast.error('Lỗi xóa hàng loạt.'); }
    };

    const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleAll = () => setSelected(selected.length === filteredPlans.length ? [] : filteredPlans.map(p => p.id));

    const statusMap = {
        draft: { label: 'Nháp', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
        published: { label: 'Đang mở', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
        active: { label: 'Đang mở', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
        closed: { label: 'Đã đóng', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-emerald-200 dark:border-emerald-900/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Quản lý Kế hoạch & Hội thi</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Tổng cộng có <span className="font-semibold text-emerald-600 dark:text-emerald-400">{plans.length}</span> nội dung đánh giá
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="input min-w-[160px]"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="draft">Bản nháp</option>
                        <option value="published">Đang mở</option>
                        <option value="closed">Đã đóng</option>
                    </select>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kế hoạch..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="input pl-10"
                        />
                        <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
                        <MdAdd size={20} /> Thêm Mới
                    </button>
                    {selected.length > 0 && (
                        <button onClick={handleBulkDelete} className="btn bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2">
                            <MdDelete size={20} /> Xóa ({selected.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-left w-12 text-slate-500 dark:text-slate-400">
                                    <input
                                        type="checkbox"
                                        checked={selected.length === filteredPlans.length && filteredPlans.length > 0}
                                        onChange={toggleAll}
                                        className="rounded border-slate-300 dark:border-slate-600 text-emerald-500 focus:ring-emerald-500"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên Kế hoạch / Hội thi</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phân loại</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đối tượng</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hạn nộp</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredPlans.map(plan => {
                                const st = statusMap[plan.status] || statusMap.draft;
                                const isSelected = selected.includes(plan.id);
                                return (
                                    <tr
                                        key={plan.id}
                                        className={`group transition-all duration-200 ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(plan.id)}
                                                className="rounded border-slate-300 dark:border-slate-600 text-emerald-500 focus:ring-emerald-500 transition-transform duration-200 active:scale-95"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === plan.id ? (
                                                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                                    <input
                                                        value={editTitle}
                                                        onChange={e => setEditTitle(e.target.value)}
                                                        autoFocus
                                                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                                        className="input py-1 text-sm w-full min-w-[200px]"
                                                    />
                                                    <button onClick={saveEdit} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">
                                                        <MdCheck size={20} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                                                        <MdClose size={20} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                    {plan.title}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`badge ${plan.type === 'contest'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                                                }`}>
                                                {plan.type === 'contest' ? 'Hội thi' : 'Kế hoạch'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 max-w-[200px] truncate" title={getBlockLabel(plan)}>
                                                {getBlockLabel(plan)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                            {plan.submissionDeadline ? (
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {new Date(plan.submissionDeadline).toLocaleDateString('vi-VN')}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 dark:text-slate-600 italic">Chưa thiết lập</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <span className={`badge ${st.color} shadow-sm px-3`}>{st.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => startEdit(plan)}
                                                    className="p-2 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg"
                                                    title="Sửa nhanh tên"
                                                >
                                                    <MdEdit size={20} />
                                                </button>
                                                <Link
                                                    to={`/admin/plans/${plan.id}`}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg"
                                                    title="Chủ sở hữu & Chỉ tiêu"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(plan.id, plan.title)}
                                                    className="p-2 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg"
                                                    title="Xóa"
                                                >
                                                    <MdDelete size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredPlans.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                            </div>
                                            <p className="text-lg font-medium">Không tìm thấy dữ liệu</p>
                                            <p className="text-sm">Vui lòng thử lại với từ khóa khác hoặc tạo mới.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal tạo mới */}
            {showAddModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60 fade-in" onClick={() => setShowAddModal(false)}></div>
                    <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col z-10 slide-in-from-bottom-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Thêm Kế hoạch mới</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Tên kế hoạch/Hội thi</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="input w-full"
                                    placeholder="Ví dụ: Đánh giá xếp loại Chi đoàn năm 2025"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Loại hình</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                                        className="input w-full"
                                    >
                                        <option value="plan">Kế hoạch thi đua</option>
                                        <option value="contest">Hội thi / Cuộc thi</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Hạn nộp hồ sơ</label>
                                    <input
                                        type="date"
                                        value={formData.submissionDeadline}
                                        onChange={e => setFormData(p => ({ ...p, submissionDeadline: e.target.value }))}
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Mô tả ngắn gọn</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="input w-full min-h-[100px] py-3"
                                    placeholder="Điền một vài thông tin mô tả về kế hoạch..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Phân quyền đối tượng thực hiện</label>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mb-2.5 px-1 uppercase tracking-wider">
                                    Nếu để trống, tất cả các đơn vị sẽ được tham gia
                                </p>

                                <div className="space-y-3 glass border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar-thin">
                                    {UNIT_BLOCKS.map(block => (
                                        <div key={block.id} className="space-y-2">
                                            <label className="flex items-center gap-3 font-semibold text-sm text-slate-700 dark:text-slate-200 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetBlocks.includes(block.id)}
                                                    onChange={() => handleBlockToggle(block.id)}
                                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-500 focus:ring-emerald-500 transition-transform active:scale-90"
                                                />
                                                <span className="group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{block.name}</span>
                                            </label>

                                            {formData.targetBlocks.includes(block.id) && (
                                                <div className="ml-7 mt-1.5 grid grid-cols-1 gap-2 animate-in slide-in-from-left-4 duration-300">
                                                    {block.types.map(type => (
                                                        <label key={type.id} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors py-0.5">
                                                            <input
                                                                type="checkbox"
                                                                checked={isTypeSelected(block.id, type.id)}
                                                                onChange={() => handleTypeToggle(block.id, type.id)}
                                                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-emerald-500 focus:ring-emerald-500"
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

                            <div className="flex justify-end gap-4 pt-6 mt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
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
                                    ) : 'Tạo kế hoạch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PlansManagePage;
