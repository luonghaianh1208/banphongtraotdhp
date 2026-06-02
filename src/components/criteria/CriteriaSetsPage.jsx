import { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { MdDownload, MdDelete, MdClose, MdUpload, MdVisibility, MdContentCopy, MdPerson, MdSearch, MdFilterList, MdSelectAll, MdSend } from 'react-icons/md';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { useUsers } from '../../hooks/useUsers';
import { useAssignments } from '../../hooks/useAssignments';
import { useAuth } from '../../context/AuthContext';
import { createCriteriaSet, deleteCriteriaSet, updateCriteriaSet } from '../../firebase/criteriaFirestore';
import { UNIT_BLOCKS } from '../../utils/constants';
import { exportCriteriaTemplate, importCriteriaExcel, buildCriteriaSetsFromRows } from '../../utils/exportExcel';
import toast from 'react-hot-toast';
import { getVietnameseError } from '../../utils/errorUtils';
import ConfirmDialog from '../common/ConfirmDialog';

const CriteriaSetsPage = () => {
    const { criteriaSets, loading, error } = useCriteriaSets();
    const { userProfile } = useAuth();
    const canManageCriteria = ['admin', 'manager', 'member'].includes(userProfile?.role);
    const { users } = useUsers();
    const { assignments: allAssignments } = useAssignments();
    const navigate = useNavigate();
    const staff = users.filter(u => ['admin', 'manager', 'member'].includes(u.role) && u.isActive !== false);

    const [showModal, setShowModal] = useState(false);
    const [showImportPreview, setShowImportPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selected, setSelected] = useState([]);
    const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });
    const fileInputRef = useRef(null);

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBlock, setFilterBlock] = useState('');

    // Filtered criteria sets
    const filteredSets = useMemo(() => {
        return criteriaSets.filter(set => {
            // Search by title
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const titleMatch = (set.title || '').toLowerCase().includes(q);
                const descMatch = (set.description || '').toLowerCase().includes(q);
                const unitMatch = (set.donViText || '').toLowerCase().includes(q);
                if (!titleMatch && !descMatch && !unitMatch) return false;
            }
            // Filter by khối đơn vị
            if (filterBlock) {
                const hasBlock = (set.targetBlocks || []).includes(filterBlock) || (set.donViText || '').toLowerCase().includes(filterBlock.toLowerCase());
                if (!hasBlock) return false;
            }
            return true;
        });
    }, [criteriaSets, searchQuery, filterBlock]);

    // Select all filtered
    const handleSelectAll = () => {
        const allFilteredIds = filteredSets.map(s => s.id);
        const allSelected = allFilteredIds.every(id => selected.includes(id));
        if (allSelected) {
            setSelected(prev => prev.filter(id => !allFilteredIds.includes(id)));
        } else {
            setSelected(prev => [...new Set([...prev, ...allFilteredIds])]);
        }
    };
    const allFilteredSelected = filteredSets.length > 0 && filteredSets.every(s => selected.includes(s.id));

    // Import state
    const [importRows, setImportRows] = useState([]); // flat editable rows
    const [importYear, setImportYear] = useState('');

    // Create form
    const [formData, setFormData] = useState({ title: '', academicYear: '', description: '', targetBlocks: [], targetTypes: [] });

    // === Block/Type toggle helpers ===
    const toggleBlock = (prev, blockId) => ({
        ...prev,
        targetBlocks: prev.targetBlocks.includes(blockId) ? prev.targetBlocks.filter(id => id !== blockId) : [...prev.targetBlocks, blockId],
    });
    const toggleType = (prev, blockId, typeId) => {
        const key = `${blockId}:${typeId}`;
        return { ...prev, targetTypes: prev.targetTypes.includes(key) ? prev.targetTypes.filter(t => t !== key) : [...prev.targetTypes, key] };
    };

    // === Create empty set → redirect ===
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return toast.error('Vui lòng nhập tên');
        setIsSubmitting(true);
        try {
            const docRef = await createCriteriaSet({
                ...formData, title: formData.title.trim(), academicYear: formData.academicYear.trim(),
                description: formData.description.trim(), tieuChi: [], totalMaxScore: 0, isActive: true,
            });
            toast.success('Tạo thành công!');
            setShowModal(false);
            setFormData({ title: '', academicYear: '', description: '', targetBlocks: [], targetTypes: [] });
            navigate(`/criteria-set/${docRef.id}`);
        } catch (err) { console.error(err); toast.error(getVietnameseError(err, 'Lỗi tạo.')); } finally { setIsSubmitting(false); }
    };

    // === Upload Excel → parse → editable table ===
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const result = await importCriteriaExcel(file);
            setImportRows(result.flatRows);
            setImportYear(result.suggestedYear);
            setShowImportPreview(true);
        } catch (err) {
            toast.error(err.message || 'Lỗi đọc file');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // === Edit a row in the import table ===
    const updateRow = (idx, field, value) => {
        setImportRows(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], [field]: value };
            return next;
        });
    };

    // === Delete a row ===
    const deleteRow = (idx) => {
        setImportRows(prev => prev.filter((_, i) => i !== idx));
    };

    // === Confirm import → save each TC as separate criteria set ===
    const handleConfirmImport = async () => {
        if (importRows.length === 0) return toast.error('Không có dữ liệu');
        if (!importYear.trim()) return toast.error('Vui lòng nhập năm');
        setIsSubmitting(true);
        try {
            const sets = buildCriteriaSetsFromRows(importRows, importYear.trim());
            if (sets.length === 0) {
                toast.error('Không tìm thấy tiêu chí nào.');
                setIsSubmitting(false);
                return;
            }
            for (const s of sets) {
                await createCriteriaSet(s);
            }
            toast.success(`Đã tạo ${sets.length} bộ tiêu chí thành công!`);
            setShowImportPreview(false);
            setImportRows([]);
        } catch (_) {
            toast.error('Lỗi lưu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // === Clone ===
    const handleClone = async (set) => {
        const newYear = prompt('Nhập năm cho bản sao:', String(Number(set.academicYear || new Date().getFullYear()) + 1));
        if (!newYear) return;
        setIsSubmitting(true);
        try {
            const clonedTC = (set.tieuChi || []).map(tc => ({
                ...tc, assignedTo: null,
                noiDung: (tc.noiDung || []).map(nd => ({ ...nd, muc: (nd.muc || []).map(m => ({ ...m })) })),
            }));
            await createCriteriaSet({
                title: `${set.title} (Bản sao)`, academicYear: newYear,
                description: set.description || '', targetBlocks: set.targetBlocks || [], targetTypes: set.targetTypes || [],
                tieuChi: clonedTC, totalMaxScore: set.totalMaxScore || 0, isActive: true,
            });
            toast.success('Đã nhân bản!');
        } catch (err) { console.error(err); toast.error(getVietnameseError(err, 'Lỗi nhân bản.')); } finally { setIsSubmitting(false); }
    };

    const handleDelete = async (setId, title) => {
        setConfirmState({
            open: true, title: 'Xác nhận xóa', message: `Xóa bộ tiêu chí "${title}"? Thao tác này không thể hoàn tác.`,
            onConfirm: async () => {
                try { await deleteCriteriaSet(setId); toast.success('Đã xóa.'); } catch (err) { console.error(err); toast.error(getVietnameseError(err)); }
                setConfirmState(s => ({ ...s, open: false }));
            }
        });
    };

    const handleBulkDelete = async () => {
        setConfirmState({
            open: true, title: 'Xác nhận xóa hàng loạt', message: `Xóa ${selected.length} bộ tiêu chí đã chọn? Thao tác này không thể hoàn tác.`,
            onConfirm: async () => {
                try { for (const id of selected) await deleteCriteriaSet(id); setSelected([]); toast.success('Đã xóa.'); } catch (err) { console.error(err); toast.error(getVietnameseError(err)); }
                setConfirmState(s => ({ ...s, open: false }));
            }
        });
    };



    const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    const countTC = (set) => (set.tieuChi || []).length;
    const countMuc = (set) => {
        let c = 0;
        (set.tieuChi || []).forEach(tc => { (tc.noiDung || []).forEach(nd => { c += (nd.muc || []).length; }); });
        return c;
    };
    const getAssignmentCount = (setId) => allAssignments.filter(a => a.criteriaSetId === setId && a.status === 'active').length;
    const getApplicableTargets = (set) => {
        if (set.donViText) return set.donViText;
        if (set.targetBlocks?.length > 0) {
            return set.targetBlocks
                .map(blockId => UNIT_BLOCKS.find(block => block.id === blockId)?.name || blockId)
                .join(', ');
        }
        return 'Tất cả khối';
    };

    // Unit selection block
    const renderUnitSelection = (state, setState) => (
        <div className="p-5 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800/50">
            <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Phối hợp đơn vị</label>
                <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-full font-black">Tùy chọn</span>
            </div>
            <div className="space-y-3 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                {UNIT_BLOCKS.map(block => (
                    <div key={block.id} className="bg-white/50 dark:bg-gray-900/50 p-3 rounded-xl border border-white dark:border-gray-800 transition-all">
                        <label className="flex items-center gap-3 font-bold text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                            <input type="checkbox" checked={state.targetBlocks.includes(block.id)} onChange={() => setState(p => toggleBlock(p, block.id))}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 cursor-pointer" />
                            <span>{block.name}</span>
                        </label>
                        {state.targetBlocks.includes(block.id) && (
                            <div className="ml-7 mt-3 grid grid-cols-2 gap-1.5 animate-fade-in">
                                {block.types.map(type => {
                                    const key = `${block.id}:${type.id}`;
                                    return (
                                        <label key={type.id} className="flex items-center gap-2 p-1.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg text-xs cursor-pointer">
                                            <input type="checkbox" checked={state.targetTypes.includes(key)} onChange={() => setState(p => toggleType(p, block.id, type.id))}
                                                className="w-3.5 h-3.5 rounded border-gray-300 text-primary-600" />
                                            <span className="truncate text-gray-600 dark:text-gray-400">{type.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    if (error) return <div className="text-red-500 p-4">Lỗi: {error.message}</div>;

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Cấu hình <span className="text-primary-600 dark:text-primary-400">Bộ Tiêu Chí</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-primary-500"></span>
                        Hệ thống hiện có <strong className="text-gray-900 dark:text-white">{criteriaSets.length}</strong> bộ tiêu chí
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {canManageCriteria && (
                        <>
                            <button onClick={exportCriteriaTemplate} className="btn bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200/50 shadow-sm">
                                <MdDownload size={20} /> <span className="hidden sm:inline">Tải mẫu Excel</span>
                            </button>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="btn bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200/50 shadow-sm">
                                <MdUpload size={20} /> <span className="hidden sm:inline">Upload Excel</span>
                            </button>
                            <button onClick={() => setShowModal(true)} className="btn btn-primary shadow-glow">
                                <span className="text-lg font-bold mr-1">+</span> Tạo thủ công
                            </button>
                        </>
                    )}
                    {canManageCriteria && selected.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 animate-fade-in">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">Đã chọn {selected.length}:</span>

                            <button onClick={handleBulkDelete} className="btn btn-danger text-xs !py-1.5 !px-3">
                                <MdDelete size={16} /> Xóa
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800/50 shadow-sm">
                <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2 border border-gray-200/50 dark:border-gray-700/50 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                    <MdSearch size={18} className="text-gray-400" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none placeholder-gray-400"
                        placeholder="Tìm kiếm tiêu chí..."
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-red-500 transition-colors">
                            <MdClose size={16} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2 border border-gray-200/50 dark:border-gray-700/50">
                    <MdFilterList size={16} className="text-gray-400" />
                    <select
                        value={filterBlock}
                        onChange={e => setFilterBlock(e.target.value)}
                        className="bg-transparent text-sm text-gray-700 dark:text-gray-200 outline-none cursor-pointer min-w-[140px]"
                    >
                        <option value="">Tất cả khối</option>
                        {UNIT_BLOCKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleSelectAll}
                    className={"flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border " + (
                        allFilteredSelected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-gray-50 text-gray-500 border-gray-200/50 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-gray-800/50 dark:text-gray-400'
                    )}
                >
                    <MdSelectAll size={16} />
                    {allFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả (' + filteredSets.length + ')'}
                </button>
                {(searchQuery || filterBlock) && (
                    <span className="text-xs text-gray-400 italic">Hiển thị {filteredSets.length}/{criteriaSets.length}</span>
                )}
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-gray-100 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/50 shadow-sm backdrop-blur-sm">
                {criteriaSets.length === 0 ? (
                    <div className="py-24 glass rounded-3xl flex flex-col items-center justify-center border-dashed border-2 border-gray-200 dark:border-gray-800">
                        <MdUpload size={40} className="text-gray-300 animate-bounce mb-6" />
                        <p className="text-xl font-black text-gray-500">Chưa có bộ tiêu chí nào</p>
                        {canManageCriteria && (
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => fileInputRef.current?.click()} className="btn bg-blue-600 text-white hover:bg-blue-700"><MdUpload size={20} /> Upload Excel</button>
                                <button onClick={() => setShowModal(true)} className="btn btn-primary">Tạo thủ công</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[1120px] w-full text-sm">
                            <thead className="bg-gray-50/90 dark:bg-gray-800/80">
                                <tr className="border-b border-gray-200/70 dark:border-gray-700/70">
                                    {canManageCriteria && <th className="w-14 px-4 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Chọn</th>}
                                    <th className="min-w-[320px] px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Bộ tiêu chí</th>
                                    <th className="w-24 px-4 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Năm</th>
                                    <th className="w-28 px-4 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Mục chấm</th>
                                    <th className="w-28 px-4 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Tổng điểm</th>
                                    <th className="min-w-[220px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Đối tượng áp dụng</th>
                                    <th className="w-32 px-4 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Đã giao</th>
                                    <th className="min-w-[260px] px-5 py-4 text-right text-[11px] font-black uppercase tracking-wider text-gray-500">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                {filteredSets.map((set) => {
                                    const assignmentCount = getAssignmentCount(set.id);
                                    const isSelected = selected.includes(set.id);
                                    return (
                                        <tr
                                            key={set.id}
                                            className={"transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 " + (isSelected ? 'bg-emerald-50/70 dark:bg-emerald-900/15' : 'bg-transparent')}
                                        >
                                            {canManageCriteria && (
                                                <td className="px-4 py-5 text-center align-top">
                                                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(set.id)} className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 cursor-pointer" />
                                                </td>
                                            )}
                                            <td className="px-5 py-5 align-top">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-2 h-1.5 w-10 rounded-full bg-primary-500 flex-shrink-0"></div>
                                                    <div className="min-w-0">
                                                        <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">{set.title}</p>
                                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic line-clamp-2">{set.description || 'Chưa có mô tả.'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-center align-top">
                                                <span className="inline-flex min-w-[64px] justify-center rounded-2xl bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-xs font-bold text-gray-800 dark:text-gray-200">{set.academicYear || '-'}</span>
                                            </td>
                                            <td className="px-4 py-5 text-center align-top">
                                                <span className="inline-flex min-w-[64px] justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-lg font-black text-blue-600 dark:text-blue-400">{countMuc(set)}</span>
                                            </td>
                                            <td className="px-4 py-5 text-center align-top">
                                                <span className="inline-flex min-w-[64px] justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-lg font-black text-emerald-600 dark:text-emerald-400">{set.totalMaxScore || 0}</span>
                                            </td>
                                            <td className="px-4 py-5 align-top">
                                                <span className="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">{getApplicableTargets(set)}</span>
                                            </td>
                                            <td className="px-4 py-5 text-center align-top">
                                                {assignmentCount > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400"><MdSend size={13} /> {assignmentCount} đơn vị</span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-gray-100 dark:bg-gray-800/60 px-3 py-1.5 text-xs font-bold text-gray-400">Chưa giao</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-5 align-top">
                                                <div className="flex justify-end gap-2">
                                                    <Link to={'/criteria-set/' + set.id} className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-600 shadow-sm hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"><MdVisibility size={16} /> Chi tiết</Link>
                                                    {canManageCriteria && (
                                                        <>
                                                            <button onClick={() => handleClone(set)} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 shadow-sm hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"><MdContentCopy size={16} /> Nhân bản</button>
                                                            <button onClick={() => handleDelete(set.id, set.title)} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 shadow-sm hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"><MdDelete size={16} /> Xóa</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Import Preview Modal */}
            {showImportPreview && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md animate-fade-in" onClick={() => !isSubmitting && setShowImportPreview(false)}></div>
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-premium p-6 w-[95vw] max-w-[1200px] relative z-10 border border-white/20 dark:border-gray-800/50 animate-fade-in-up max-h-[92vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">Xem trước và chỉnh sửa dữ liệu Excel</h3>
                                <p className="text-xs text-gray-500 mt-1">{importRows.length} dòng, mỗi tiêu chí sẽ lưu thành 1 bộ riêng biệt</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500">Năm:</span>
                                    <input value={importYear} onChange={e => setImportYear(e.target.value)} className="input !w-20 text-center font-bold text-sm !py-1.5" placeholder="2026" />
                                </div>
                                <button onClick={() => setShowImportPreview(false)} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 rounded-full transition-all"><MdClose size={20} /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-xl mb-4">
                            <table className="w-full text-xs border-collapse">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-emerald-600 text-white">
                                        <th className="px-2 py-2.5 text-left font-black whitespace-nowrap w-8">#</th>
                                        <th className="px-2 py-2.5 text-left font-black whitespace-nowrap min-w-[200px]">Tiêu chí</th>
                                        <th className="px-2 py-2.5 text-left font-black whitespace-nowrap min-w-[160px]">Nội dung</th>
                                        <th className="px-2 py-2.5 text-center font-black w-12">STT</th>
                                        <th className="px-2 py-2.5 text-left font-black whitespace-nowrap min-w-[200px]">Điều kiện chấm</th>
                                        <th className="px-2 py-2.5 text-left font-black whitespace-nowrap min-w-[200px]">Yêu cầu MC</th>
                                        <th className="px-2 py-2.5 text-center font-black w-16">Tổ</th>
                                        <th className="px-2 py-2.5 text-center font-black w-16">Điểm</th>
                                        <th className="px-2 py-2.5 text-center font-black whitespace-nowrap w-24">Thời hạn</th>
                                        <th className="px-2 py-2.5 text-left font-black whitespace-nowrap min-w-[150px]">Đơn vị</th>
                                        <th className="px-2 py-2.5 text-center font-black w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importRows.map((row, idx) => {
                                        const isNewTC = idx === 0 || row.tieuChi;
                                        return (
                                            <tr key={idx} className={"border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors " + (isNewTC ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : '')}>
                                                <td className="px-2 py-1.5 text-gray-400 font-mono text-center">{idx + 1}</td>
                                                <td className="px-1 py-1"><input value={row.tieuChi} onChange={e => updateRow(idx, 'tieuChi', e.target.value)} className={"w-full px-1.5 py-1 rounded border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none bg-transparent text-xs transition-all " + (row.tieuChi ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'text-gray-400')} placeholder={row._tcTitle ? ('-> ' + row._tcTitle) : ''} /></td>
                                                <td className="px-1 py-1"><input value={row.noiDung} onChange={e => updateRow(idx, 'noiDung', e.target.value)} className={"w-full px-1.5 py-1 rounded border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent text-xs transition-all " + (row.noiDung ? 'font-semibold text-gray-700 dark:text-gray-200' : 'text-gray-400')} placeholder={row._ndTitle ? ('-> ' + row._ndTitle) : ''} /></td>
                                                <td className="px-1 py-1"><input type="number" value={row.stt} onChange={e => updateRow(idx, 'stt', e.target.value)} className="w-full text-center px-1 py-1 rounded border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none bg-transparent text-xs" /></td>
                                                <td className="px-1 py-1"><textarea value={row.dieuKienCham} onChange={e => updateRow(idx, 'dieuKienCham', e.target.value)} className="w-full px-1.5 py-1 rounded border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none bg-transparent text-xs resize-none" rows={2} /></td>
                                                <td className="px-1 py-1"><textarea value={row.yeucauMinhChung} onChange={e => updateRow(idx, 'yeucauMinhChung', e.target.value)} className="w-full px-1.5 py-1 rounded border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none bg-transparent text-xs resize-none" rows={2} /></td>
                                                <td className="px-1 py-1"><input value={row.toTheoDoi} onChange={e => updateRow(idx, 'toTheoDoi', e.target.value)} className="w-full text-center px-1 py-1 rounded border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none bg-transparent text-xs font-bold" /></td>
                                                <td className="px-1 py-1"><input type="number" value={row.khungDiem} onChange={e => updateRow(idx, 'khungDiem', Number(e.target.value) || 0)} className="w-full text-center px-1 py-1 rounded border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none bg-transparent text-xs font-black text-emerald-600 dark:text-emerald-400" /></td>
                                                <td className="px-1 py-1"><input value={row.deadline} onChange={e => updateRow(idx, 'deadline', e.target.value)} className="w-full text-center px-1 py-1 rounded border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none bg-transparent text-xs" /></td>
                                                <td className="px-1 py-1"><input value={row.donVi} onChange={e => updateRow(idx, 'donVi', e.target.value)} className="w-full px-1.5 py-1 rounded border border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none bg-transparent text-xs" placeholder="VD: Khối Xã..." /></td>
                                                <td className="px-1 py-1 text-center"><button onClick={() => deleteRow(idx)} className="p-1 text-gray-300 hover:text-red-500 transition-colors rounded"><MdDelete size={14} /></button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex gap-4 shrink-0">
                            <button onClick={() => setShowImportPreview(false)} className="flex-1 btn btn-secondary !py-3" disabled={isSubmitting}>Hủy bỏ</button>
                            <button onClick={handleConfirmImport} className="flex-[2] btn btn-primary shadow-glow !py-3 disabled:opacity-50" disabled={isSubmitting}>
                                {isSubmitting ? (<div className="flex items-center justify-center gap-2"><div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Đang lưu...</span></div>) : 'Lưu thành bộ tiêu chí riêng biệt'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Create Manual Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md animate-fade-in" onClick={() => !isSubmitting && setShowModal(false)}></div>
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-premium p-8 max-w-xl w-full relative z-10 border border-white/20 dark:border-gray-800/50 animate-fade-in-up max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-8 shrink-0">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white">Tạo Bộ Tiêu Chí</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-black">Khởi tạo, chỉnh sửa chi tiết sau</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 rounded-full transition-all"><MdClose size={24} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Tên *</label>
                                    <input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="input" placeholder="VD: Tiêu chí 1: Tổ chức..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Năm</label>
                                    <input value={formData.academicYear} onChange={e => setFormData(p => ({ ...p, academicYear: e.target.value }))} className="input text-center font-bold" placeholder="2026" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Mô tả</label>
                                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="input min-h-[80px] resize-none !py-4" placeholder="Nội dung, mục đích..." rows={2} />
                            </div>
                            {renderUnitSelection(formData, setFormData)}
                            <p className="text-xs text-gray-400 text-center italic bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl">Sau khi tạo, thêm nội dung và mục chấm trong trang chi tiết.</p>
                            <div className="flex gap-4 pt-4 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn btn-secondary !py-4" disabled={isSubmitting}>Hủy</button>
                                <button type="submit" className="flex-[2] btn btn-primary shadow-glow !py-4 disabled:opacity-50" disabled={isSubmitting}>
                                    {isSubmitting ? <div className="flex items-center justify-center gap-2"><div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Đang tạo...</div> : 'Tạo và mở Chi tiết'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
            />
        </div>
    );
};

export default CriteriaSetsPage;
