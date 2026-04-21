import { useState } from 'react';
import { MdDownload, MdDelete, MdEdit, MdClose, MdCheck } from 'react-icons/md';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { createCriteriaSet, deleteCriteriaSet, updateCriteriaSet } from '../../firebase/criteriaFirestore';
import { UNIT_BLOCKS } from '../../utils/constants';
import { exportCriteriaTemplate } from '../../utils/exportExcel';
import toast from 'react-hot-toast';

const CriteriaSetsPage = () => {
    const { criteriaSets, loading, error } = useCriteriaSets();
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

    const handleDelete = async (setId, title) => {
        if (!confirm(`Chắc chắn muốn xóa bộ tiêu chí "${title}"?`)) return;
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

    const getTargetLabel = (set) => {
        if (!set.targetBlocks?.length) return 'Tất cả khối';
        const blockNames = set.targetBlocks.map(bId => UNIT_BLOCKS.find(b => b.id === bId)?.name || bId);
        return blockNames.join(', ');
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    if (error) return <div className="text-red-500 p-4">Lỗi: {error.message}</div>;

    return (
        <div className="animate-fade-in-up">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Cấu hình <span className="text-primary-600 dark:text-primary-400">Bộ Tiêu Chí</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-primary-500"></span>
                        Hệ thống hiện có <strong className="text-gray-900 dark:text-white">{criteriaSets.length}</strong> bộ khung chỉ tiêu chấm điểm
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={exportCriteriaTemplate} className="btn bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm transition-all focus:ring-2 focus:ring-emerald-500/20">
                        <MdDownload size={20} /> <span className="hidden sm:inline">Tải mẫu Excel</span>
                    </button>

                    <button onClick={() => setShowModal(true)} className="btn btn-primary shadow-glow">
                        <span className="text-lg font-bold mr-1">+</span> Tạo Bộ Tiêu Chí
                    </button>

                    {selected.length > 0 && (
                        <button onClick={handleBulkDelete} className="btn btn-danger animate-pulse">
                            <MdDelete size={20} /> Xóa ({selected.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {criteriaSets.map((set, idx) => (
                    <div
                        key={set.id}
                        className={`group relative card glass p-8 flex flex-col h-full border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${selected.includes(set.id)
                                ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/10 dark:bg-primary-900/10 scale-[1.02]'
                                : 'border-white/40 dark:border-gray-800/40 hover:border-primary-300 dark:hover:border-primary-700'
                            }`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        {/* Selector indicator */}
                        <div className="absolute top-4 left-4">
                            <input
                                type="checkbox"
                                checked={selected.includes(set.id)}
                                onChange={() => toggleSelect(set.id)}
                                className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 transition-all cursor-pointer"
                            />
                        </div>

                        <div className="mb-6 mt-2">
                            {editingId === set.id ? (
                                <div className="flex flex-col gap-3">
                                    <input
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="input !text-lg !font-bold border-primary-500 bg-white/50 backdrop-blur-sm"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={saveEdit} className="btn btn-primary !py-1 !text-xs flex-1">Lưu</button>
                                        <button onClick={() => setEditingId(null)} className="btn btn-secondary !py-1 !text-xs flex-1">Hủy</button>
                                    </div>
                                </div>
                            ) : (
                                <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                                    {set.title}
                                </h3>
                            )}
                            <div className="h-1 w-12 bg-primary-500 rounded-full mt-3 group-hover:w-20 transition-all duration-500"></div>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 line-clamp-3 italic">
                            {set.description || 'Chưa có mô tả chi tiết cho bộ tiêu chí này.'}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black mb-1">Năm học</p>
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{set.academicYear}</span>
                            </div>
                            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
                                <p className="text-[10px] text-emerald-500/70 uppercase font-black mb-1">Tổng điểm</p>
                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{set.totalMaxScore}</span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black mb-2 tracking-widest">Đối tượng áp dụng</p>
                            <div className="flex flex-wrap gap-1.5 font-bold">
                                {set.targetBlocks?.length > 0 ? (
                                    set.targetBlocks.map(bId => {
                                        const bName = UNIT_BLOCKS.find(b => b.id === bId)?.name || bId;
                                        return (
                                            <span key={bId} className="px-2.5 py-1 bg-primary-100/50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-[10px]">
                                                {bName}
                                            </span>
                                        );
                                    })
                                ) : (
                                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-[10px]">Tất cả đơn vị</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-5 border-t border-gray-100 dark:border-gray-800/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <button onClick={() => startEdit(set)} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs font-bold">
                                <MdEdit size={16} /> <span className="md:hidden lg:inline">Chỉnh sửa</span>
                            </button>
                            <button onClick={() => handleDelete(set.id, set.title)} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs font-bold">
                                <MdDelete size={16} /> <span className="md:hidden lg:inline">Xóa bộ</span>
                            </button>
                        </div>
                    </div>
                ))}

                {criteriaSets.length === 0 && (
                    <div className="col-span-full py-24 glass rounded-3xl flex flex-col items-center justify-center border-dashed border-2 border-gray-200 dark:border-gray-800">
                        <div className="h-20 w-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-white dark:ring-gray-900/20">
                            <MdDownload size={40} className="text-gray-300 animate-bounce" />
                        </div>
                        <p className="text-xl font-black text-gray-500 dark:text-gray-400">Hệ thống chưa có bộ tiêu chí nào</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Bắt đầu bằng cách tạo một bộ khung chỉ tiêu chấm điểm mới</p>
                        <button onClick={() => setShowModal(true)} className="btn btn-primary mt-8">
                            Tạo bộ tiêu chí ngay
                        </button>
                    </div>
                )}
            </div>

            {/* Premium Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md animate-fade-in" onClick={() => !isSubmitting && setShowModal(false)}></div>
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-premium p-8 max-w-xl w-full relative z-10 border border-white/20 dark:border-gray-800/50 animate-fade-in-up max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-8 shrink-0">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white">Tạo Bộ Tiêu Chí</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1 font-black">Khởi tạo khung chỉ tiêu mới cho năm học</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 rounded-full transition-all duration-300 shadow-sm"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Tên bộ tiêu chí</label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                        className="input"
                                        placeholder="VD: Tiêu chí thi đua năm học"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Năm học</label>
                                    <input
                                        required
                                        value={formData.academicYear}
                                        onChange={e => setFormData(p => ({ ...p, academicYear: e.target.value }))}
                                        className="input text-center font-bold"
                                        placeholder="VD: 2024-2025"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Mô tả chi tiết</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="input min-h-[100px] resize-none !py-4"
                                    placeholder="Nội dung, mục đích của bộ tiêu chí này..."
                                    rows={3}
                                />
                            </div>

                            <div className="p-6 bg-gray-50 dark:bg-gray-800/30 rounded-[2rem] border border-gray-100 dark:border-gray-800/50 shadow-inner">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Phối hợp đơn vị</label>
                                    <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full font-black">Bắt buộc</span>
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-6 italic leading-relaxed">
                                    Chọn các khối và loại hình đơn vị sẽ áp dụng bộ tiêu chí này. Để trống nếu áp dụng cho tất cả.
                                </p>

                                <div className="space-y-4 max-h-64 overflow-y-auto pr-3 custom-scrollbar">
                                    {UNIT_BLOCKS.map(block => (
                                        <div key={block.id} className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-2xl border border-white dark:border-gray-800 shadow-sm transition-all hover:border-primary-200 dark:hover:border-primary-800">
                                            <label className="flex items-center gap-3 font-bold text-sm text-gray-800 dark:text-gray-200 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetBlocks.includes(block.id)}
                                                    onChange={() => handleBlockToggle(block.id)}
                                                    className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
                                                />
                                                <span className="group-hover:text-primary-600 transition-colors">{block.name}</span>
                                            </label>

                                            {formData.targetBlocks.includes(block.id) && (
                                                <div className="ml-8 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
                                                    {block.types.map(type => (
                                                        <label key={type.id} className="flex items-center gap-2 p-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors border border-transparent hover:border-primary-200 dark:hover:border-primary-800">
                                                            <input
                                                                type="checkbox"
                                                                checked={isTypeSelected(block.id, type.id)}
                                                                onChange={() => handleTypeToggle(block.id, type.id)}
                                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                            />
                                                            <span className="truncate">{type.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 btn btn-secondary !py-4"
                                    disabled={isSubmitting}
                                >
                                    Khép lại
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] btn btn-primary shadow-glow !py-4 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Đang khởi tạo...</span>
                                        </div>
                                    ) : (
                                        'Xác nhận tạo ngay'
                                    )}
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
