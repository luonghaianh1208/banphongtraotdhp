import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    MdArrowBack, MdSave, MdPerson, MdExpandMore, MdExpandLess,
    MdAdd, MdDelete, MdEdit, MdDownload, MdClose, MdSelectAll,
    MdSend, MdUndo, MdCheckCircle, MdCancel
} from 'react-icons/md';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { useUsers } from '../../hooks/useUsers';
import { useUnits } from '../../hooks/useUnits';
import { useSetAssignments } from '../../hooks/useAssignments';
import { updateCriteriaSet, assignCriteriaToUnits, revokeCriteriaAssignment } from '../../firebase/criteriaFirestore';
import { exportCriteriaSetToExcel } from '../../utils/exportExcel';
import { useAuth } from '../../context/AuthContext';
import { UNIT_BLOCKS } from '../../utils/constants';
import toast from 'react-hot-toast';
import TextareaAutosize from 'react-textarea-autosize';
import CriteriaGuideFiles from './CriteriaGuideFiles';

// Unique ID generator
let _uid = 0;
const uid = (prefix = 'x') => `${prefix}_${Date.now()}_${++_uid}`;

const CriteriaSetDetailPage = () => {
    const { setId } = useParams();
    const { criteriaSets, loading: csLoading } = useCriteriaSets();
    const { users, loading: usersLoading } = useUsers();
    const { units } = useUnits();
    const { assignments } = useSetAssignments(setId);
    const { userProfile } = useAuth();
    const canManageCriteria = ['admin', 'manager', 'member'].includes(userProfile?.role);
    const isReadOnly = !canManageCriteria;
    const [localSet, setLocalSet] = useState(null); // full editable copy
    const [isSaving, setIsSaving] = useState(false);
    const [expandedTC, setExpandedTC] = useState({});
    const [editingField, setEditingField] = useState(null); // track which field is being edited
    const [isDirty, setIsDirty] = useState(false);

    // Assignment state
    const [showAssignPanel, setShowAssignPanel] = useState(false);
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const loading = csLoading || usersLoading;
    const staff = users.filter(u => ['admin', 'manager', 'member'].includes(u.role) && u.isActive !== false);

    // Load data from Firestore
    useEffect(() => {
        if (!csLoading && criteriaSets.length > 0) {
            const found = criteriaSets.find(c => c.id === setId);
            if (found && !isDirty) {
                setLocalSet(JSON.parse(JSON.stringify(found)));
                const exp = {};
                (found.tieuChi || []).forEach(tc => { exp[tc.id] = true; });
                setExpandedTC(exp);
            }
        }
    }, [csLoading, criteriaSets, setId]);

    // === Save all changes ===
    const handleSave = async () => {
        if (!localSet) return;
        setIsSaving(true);
        try {
            // Recalculate totalMaxScore
            let total = 0;
            (localSet.tieuChi || []).forEach(tc => {
                tc.totalScore = 0;
                (tc.noiDung || []).forEach(nd => {
                    (nd.muc || []).forEach(m => {
                        const score = Number(m.khungDiem) || 0;
                        tc.totalScore += score;
                        total += score;
                    });
                });
            });

            await updateCriteriaSet(setId, {
                title: localSet.title,
                academicYear: localSet.academicYear,
                description: localSet.description || '',
                tieuChi: localSet.tieuChi || [],
                totalMaxScore: total,
                targetBlocks: localSet.targetBlocks || [],
                targetTypes: localSet.targetTypes || [],
                donViText: localSet.donViText || '',
            });
            setIsDirty(false);
            toast.success('Đã lưu thành công!');
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi lưu');
        } finally {
            setIsSaving(false);
        }
    };

    // === Mutation helpers ===
    const mutate = (fn) => {
        setLocalSet(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            fn(next);
            return next;
        });
        setIsDirty(true);
    };

    // Header fields
    const updateTitle = (val) => mutate(s => { s.title = val; });
    const updateYear = (val) => mutate(s => { s.academicYear = val; });
    const updateDesc = (val) => mutate(s => { s.description = val; });

    // Tiêu chí
    const addTC = () => {
        const newId = uid('tc');
        mutate(s => {
            s.tieuChi = s.tieuChi || [];
            s.tieuChi.push({ id: newId, title: 'Tiêu chí mới', totalScore: 0, assignedTo: null, noiDung: [] });
        });
        setExpandedTC(p => ({ ...p, [newId]: true }));
    };
    const removeTC = (tcId) => mutate(s => { s.tieuChi = (s.tieuChi || []).filter(tc => tc.id !== tcId); });
    const updateTCTitle = (tcId, val) => mutate(s => { const tc = s.tieuChi.find(t => t.id === tcId); if (tc) tc.title = val; });
    const updateTCAssign = (tcId, userId) => mutate(s => { const tc = s.tieuChi.find(t => t.id === tcId); if (tc) tc.assignedTo = userId || null; });

    // Nội dung
    const addND = (tcId) => mutate(s => {
        const tc = s.tieuChi.find(t => t.id === tcId);
        if (tc) { tc.noiDung = tc.noiDung || []; tc.noiDung.push({ id: uid('nd'), title: 'Nội dung mới', muc: [] }); }
    });
    const removeND = (tcId, ndId) => mutate(s => {
        const tc = s.tieuChi.find(t => t.id === tcId);
        if (tc) tc.noiDung = (tc.noiDung || []).filter(nd => nd.id !== ndId);
    });
    const updateNDTitle = (tcId, ndId, val) => mutate(s => {
        const tc = s.tieuChi.find(t => t.id === tcId);
        if (tc) { const nd = (tc.noiDung || []).find(n => n.id === ndId); if (nd) nd.title = val; }
    });

    // Mục
    const addMuc = (tcId, ndId) => mutate(s => {
        const tc = s.tieuChi.find(t => t.id === tcId);
        if (tc) {
            const nd = (tc.noiDung || []).find(n => n.id === ndId);
            if (nd) {
                nd.muc = nd.muc || [];
                nd.muc.push({
                    id: uid('m'), stt: nd.muc.length + 1,
                    dieuKienCham: '', yeucauMinhChung: '', guideFiles: [], toTheoDoi: '', khungDiem: 0, deadline: '',
                });
            }
        }
    });
    const removeMuc = (tcId, ndId, mId) => mutate(s => {
        const tc = s.tieuChi.find(t => t.id === tcId);
        if (tc) { const nd = (tc.noiDung || []).find(n => n.id === ndId); if (nd) nd.muc = (nd.muc || []).filter(m => m.id !== mId); }
    });
    const updateMuc = (tcId, ndId, mId, field, val) => mutate(s => {
        const tc = s.tieuChi.find(t => t.id === tcId);
        if (tc) {
            const nd = (tc.noiDung || []).find(n => n.id === ndId);
            if (nd) { const m = (nd.muc || []).find(x => x.id === mId); if (m) m[field] = val; }
        }
    });

    // Bulk assignment
    const bulkAssign = (userId) => mutate(s => {
        (s.tieuChi || []).forEach(tc => { tc.assignedTo = userId || null; });
    });

    // Toggle
    const toggleTC = (tcId) => setExpandedTC(p => ({ ...p, [tcId]: !p[tcId] }));
    const getUserName = (uid) => staff.find(u => u.id === uid)?.displayName || '';

    // === Enter key navigation ===
    const handleKeyDown = (e, colName) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const inputs = Array.from(document.querySelectorAll(`[data-col="${colName}"]`));
            const index = inputs.indexOf(e.target);
            if (index > -1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        }
    };

    // Computed stats
    const stats = useMemo(() => {
        if (!localSet) return { tc: 0, nd: 0, muc: 0, score: 0 };
        const tieuChi = localSet.tieuChi || [];
        let nd = 0, muc = 0, score = 0;
        tieuChi.forEach(tc => {
            (tc.noiDung || []).forEach(n => { nd++; (n.muc || []).forEach(m => { muc++; score += Number(m.khungDiem) || 0; }); });
        });
        return { tc: tieuChi.length, nd, muc, score };
    }, [localSet]);

    const buildEditableRows = (tc) => (
        (tc.noiDung || []).flatMap((nd, ndIndex) => {
            const ndId = nd.id || `nd_${ndIndex}`;
            const mucList = (nd.muc && nd.muc.length > 0)
                ? nd.muc
                : [{
                    id: `${ndId}__empty`,
                    __empty: true,
                    stt: '',
                    dieuKienCham: '',
                    yeucauMinhChung: '',
                    guideFiles: [],
                    toTheoDoi: '',
                    khungDiem: '',
                    deadline: '',
                }];

            return mucList.map((muc, mucIndex) => ({
                id: muc.id,
                ndId,
                ndTitle: nd.title || '',
                stt: muc.stt || mucIndex + 1,
                dieuKienCham: muc.dieuKienCham || '',
                yeucauMinhChung: muc.yeucauMinhChung || '',
                guideFiles: muc.guideFiles || [],
                toTheoDoi: muc.toTheoDoi || '',
                khungDiem: muc.__empty ? '' : (muc.khungDiem ?? 0),
                deadline: muc.deadline || '',
                isEmpty: !!muc.__empty,
            }));
        })
    );

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div></div>;
    }

    if (!localSet) {
        return <div className="flex justify-center items-center h-64 text-gray-500">Đang xử lý dữ liệu...</div>;
    }

    const tieuChiList = localSet.tieuChi || [];

    return (
        <div className="w-full px-4 md:px-8 lg:px-12 mx-auto pb-12 animate-fade-in-up">
            {/* ===== HEADER ===== */}
            <div className="mb-8 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-emerald-100/20 dark:border-emerald-500/10">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <Link to="/criteria-sets" className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold hover:underline transition-all text-sm">
                        <MdArrowBack className="mr-1" /> Quay lại
                    </Link>
                    <div className="flex flex-wrap gap-2">
                        <Link to={`/criteria-overview/${setId}`} className="btn bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200/50 text-xs shadow-sm">
                            <MdSelectAll size={16} /> Tổng quan nộp
                        </Link>
                        <button onClick={() => exportCriteriaSetToExcel(localSet)} className="btn bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200/50 text-xs shadow-sm">
                            <MdDownload size={16} /> Xuất Excel
                        </button>
                        {!isReadOnly && (
                            <button
                                onClick={handleSave} disabled={isSaving || !isDirty}
                                className={`btn text-xs shadow-sm ${isDirty ? 'btn-primary shadow-glow animate-pulse' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 cursor-not-allowed'}`}
                            >
                                {isSaving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <MdSave size={16} />}
                                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Editable title + year */}
                <div className="space-y-3">
                    <input
                        value={localSet.title || ''}
                        onChange={e => updateTitle(e.target.value)}
                        readOnly={isReadOnly}
                        className="text-2xl font-black text-gray-900 dark:text-white w-full bg-transparent border-b-2 border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:outline-none transition-all px-1 py-1"
                        placeholder="Tên bộ tiêu chí..."
                    />
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-bold">📅 Năm:</span>
                            <input
                                value={localSet.academicYear || ''}
                                onChange={e => updateYear(e.target.value)}
                                readOnly={isReadOnly}
                                className="text-sm font-bold text-gray-700 dark:text-gray-300 bg-transparent border-b border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:outline-none w-20 text-center transition-all"
                                placeholder="2026"
                            />
                        </div>
                        <span className="text-sm text-gray-500">📝 {stats.muc} mục chấm</span>
                        <span className="text-sm text-gray-500">⭐ {stats.score} điểm tổng</span>
                    </div>
                    {/* Đơn vị áp dụng */}
                    {(localSet.donViText || (localSet.targetBlocks && localSet.targetBlocks.length > 0)) && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-black text-gray-400 uppercase">Đối tượng áp dụng:</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                {localSet.donViText || (localSet.targetBlocks || []).join(', ') || 'Tất cả đơn vị'}
                            </span>
                        </div>
                    )}
                    <textarea
                        value={localSet.description || ''}
                        onChange={e => updateDesc(e.target.value)}
                        readOnly={isReadOnly}
                        className="text-sm text-gray-500 dark:text-gray-400 w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none resize-none transition-all italic"
                        placeholder="Mô tả bộ tiêu chí..."
                        rows={1}
                    />
                </div>

                {/* Keyboard Shortcut Hint */}
                {!isReadOnly && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 px-3 py-2 rounded-lg border border-emerald-100/50 dark:border-emerald-800/30">
                        <span className="font-bold">Mẹo nhập liệu:</span>
                        <span>Nhấn <kbd className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 font-sans font-bold shadow-sm">Enter</kbd> để nhảy xuống dòng dưới, </span>
                        <span><kbd className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 font-sans font-bold shadow-sm">Shift + Enter</kbd> để xuống dòng trong ô.</span>
                    </div>
                )}
            </div>

            {/* ===== TIÊU CHÍ LIST ===== */}
            <div className="space-y-4">
                {tieuChiList.map((tc, tcIdx) => {
                    const isOpen = expandedTC[tc.id];
                    const tcScore = (tc.noiDung || []).reduce((s, nd) => s + (nd.muc || []).reduce((ms, m) => ms + (Number(m.khungDiem) || 0), 0), 0);

                    return (
                        <div key={tc.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                            {/* TC Header */}
                            <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500">
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleTC(tc.id)}>
                                    <input
                                        value={tc.title || ''}
                                        onChange={e => updateTCTitle(tc.id, e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                        readOnly={isReadOnly}
                                        className="text-white font-black text-sm bg-transparent border-b border-transparent hover:border-white/50 focus:border-white focus:outline-none w-full truncate transition-all"
                                        placeholder="Tên tiêu chí..."
                                    />
                                    <p className="text-emerald-100 text-xs mt-0.5 font-medium">{tcScore} điểm · {(tc.noiDung || []).length} nội dung</p>
                                </div>

                                <div className="flex-shrink-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-xl px-2.5 py-1">
                                        <MdPerson className="text-white" size={14} />
                                        {isReadOnly ? (
                                            <span className="text-white text-[11px] font-bold min-w-[100px] text-center">
                                                {tc.assignedTo ? getUserName(tc.assignedTo) : '— Chưa giao —'}
                                            </span>
                                        ) : (
                                            <select
                                                value={tc.assignedTo || ''}
                                                onChange={e => updateTCAssign(tc.id, e.target.value)}
                                                className="bg-transparent text-white text-[11px] font-bold border-none outline-none cursor-pointer min-w-[100px]"
                                                style={{ WebkitAppearance: 'none' }}
                                            >
                                                <option value="" className="text-gray-800">— Chưa giao —</option>
                                                {staff.map(u => <option key={u.id} value={u.id} className="text-gray-800">{u.displayName}</option>)}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="cursor-pointer" onClick={() => toggleTC(tc.id)}>
                                    {isOpen ? <MdExpandLess className="text-white" size={22} /> : <MdExpandMore className="text-white" size={22} />}
                                </div>
                            </div>

                            {/* TC Body */}
                            {isOpen && (
                                <div className="p-4 space-y-4">
                                    {(tc.noiDung || []).length > 0 ? (
                                        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800/60">
                                            <table className="min-w-[1320px] w-full text-sm">
                                                <thead className="bg-gray-50/90 dark:bg-gray-900/70">
                                                    <tr>
                                                        <th className="min-w-[240px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Nội dung</th>
                                                        <th className="w-20 px-3 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">STT</th>
                                                        <th className="min-w-[320px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Điều kiện chấm</th>
                                                        <th className="min-w-[320px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Yêu cầu minh chứng và nguyên tắc chấm</th>
                                                        <th className="w-28 px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Tổ</th>
                                                        <th className="w-28 px-4 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Điểm</th>
                                                        <th className="w-36 px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Hạn</th>
                                                        <th className="w-36 px-4 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
                                                    {buildEditableRows(tc).map((row, index, rows) => {
                                                        const showNd = index === 0 || rows[index - 1].ndId !== row.ndId;
                                                        const ndRowCount = rows.filter(item => item.ndId === row.ndId).length;

                                                        return (
                                                            <tr key={row.id} className="align-top hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors">
                                                                {showNd && (
                                                                    <td rowSpan={ndRowCount} className="px-4 py-4">
                                                                        <div className="space-y-3 min-w-[220px]">
                                                                            <input
                                                                                value={row.ndTitle}
                                                                                onChange={e => updateNDTitle(tc.id, row.ndId, e.target.value)}
                                                                                readOnly={isReadOnly}
                                                                                className="w-full bg-transparent text-sm font-black text-gray-700 dark:text-gray-200 border-b border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:outline-none transition-all"
                                                                                placeholder="Tên nội dung..."
                                                                            />
                                                                            {!isReadOnly && (
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    <button
                                                                                        onClick={() => addMuc(tc.id, row.ndId)}
                                                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                                                    >
                                                                                        <MdAdd size={14} /> Thêm mục
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            if (confirm('Xóa nội dung này?')) removeND(tc.id, row.ndId);
                                                                                        }}
                                                                                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                                                                    >
                                                                                        <MdDelete size={14} /> Xóa nội dung
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                )}

                                                                {row.isEmpty ? (
                                                                    <td colSpan={7} className="px-4 py-6">
                                                                        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/20 dark:text-gray-400 md:flex-row md:items-center md:justify-between">
                                                                            <span>Nội dung này chưa có mục chấm.</span>
                                                                            {!isReadOnly && (
                                                                                <button
                                                                                    onClick={() => addMuc(tc.id, row.ndId)}
                                                                                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                                                                                >
                                                                                    <MdAdd size={14} /> Thêm mục đầu tiên
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                ) : (
                                                                    <>
                                                                        <td className="px-3 py-4 text-center">
                                                                            <input
                                                                                data-col="stt"
                                                                                onKeyDown={e => handleKeyDown(e, 'stt')}
                                                                                value={row.stt}
                                                                                onChange={e => updateMuc(tc.id, row.ndId, row.id, 'stt', Number(e.target.value) || '')}
                                                                                readOnly={isReadOnly}
                                                                                className="input w-16 text-center font-black text-emerald-600 dark:text-emerald-400"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-4">
                                                                            <TextareaAutosize
                                                                                data-col="dieuKienCham"
                                                                                onKeyDown={e => handleKeyDown(e, 'dieuKienCham')}
                                                                                value={row.dieuKienCham}
                                                                                onChange={e => updateMuc(tc.id, row.ndId, row.id, 'dieuKienCham', e.target.value)}
                                                                                readOnly={isReadOnly}
                                                                                className="input w-full resize-none text-sm leading-relaxed"
                                                                                minRows={1}
                                                                                placeholder="Nhập điều kiện chấm..."
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-4">
                                                                            <div className="space-y-2">
                                                                            <TextareaAutosize
                                                                                data-col="yeucauMinhChung"
                                                                                onKeyDown={e => handleKeyDown(e, 'yeucauMinhChung')}
                                                                                value={row.yeucauMinhChung}
                                                                                onChange={e => updateMuc(tc.id, row.ndId, row.id, 'yeucauMinhChung', e.target.value)}
                                                                                readOnly={isReadOnly}
                                                                                className="input w-full resize-none text-sm leading-relaxed"
                                                                                minRows={1}
                                                                                placeholder="Nhập yêu cầu minh chứng..."
                                                                            />
                                                                            <CriteriaGuideFiles
                                                                                files={row.guideFiles || []}
                                                                                onChange={(newFiles) => updateMuc(tc.id, row.ndId, row.id, 'guideFiles', newFiles)}
                                                                                readOnly={isReadOnly}
                                                                                criteriaSetId={setId}
                                                                                mucId={row.id}
                                                                            />
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-4">
                                                                            <input
                                                                                data-col="toTheoDoi"
                                                                                onKeyDown={e => handleKeyDown(e, 'toTheoDoi')}
                                                                                value={row.toTheoDoi}
                                                                                onChange={e => updateMuc(tc.id, row.ndId, row.id, 'toTheoDoi', e.target.value)}
                                                                                readOnly={isReadOnly}
                                                                                className="input w-full font-bold text-blue-600 dark:text-blue-400"
                                                                                placeholder="PT"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-4">
                                                                            <input
                                                                                data-col="khungDiem"
                                                                                onKeyDown={e => handleKeyDown(e, 'khungDiem')}
                                                                                type="number"
                                                                                value={row.khungDiem}
                                                                                onChange={e => updateMuc(tc.id, row.ndId, row.id, 'khungDiem', Number(e.target.value) || 0)}
                                                                                readOnly={isReadOnly}
                                                                                className="input w-24 text-center font-black text-emerald-600 dark:text-emerald-400"
                                                                                placeholder="0"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-4">
                                                                            <input
                                                                                data-col="deadline"
                                                                                onKeyDown={e => handleKeyDown(e, 'deadline')}
                                                                                value={row.deadline}
                                                                                onChange={e => updateMuc(tc.id, row.ndId, row.id, 'deadline', e.target.value)}
                                                                                readOnly={isReadOnly}
                                                                                className="input w-full"
                                                                                placeholder="30/10/2026"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-4 text-center">
                                                                            {!isReadOnly && (
                                                                                <button
                                                                                    onClick={() => removeMuc(tc.id, row.ndId, row.id)}
                                                                                    className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                                                                                >
                                                                                    <MdDelete size={14} /> Xóa mục
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-6 py-8 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800/20 dark:text-gray-400">
                                            Tiêu chí này chưa có nội dung đánh giá.
                                        </div>
                                    )}

                                    {!isReadOnly && (
                                        <button onClick={() => addND(tc.id)}
                                            className="w-full py-2.5 border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-400 hover:text-blue-600 hover:border-blue-400 font-bold flex items-center justify-center gap-1 transition-all">
                                            <MdAdd size={16} /> Thêm nội dung đánh giá
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Add tiêu chí */}
                {!isReadOnly && (
                    <button onClick={addTC}
                        className="w-full py-5 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl text-sm text-emerald-500 hover:text-emerald-700 hover:border-emerald-500 font-black flex items-center justify-center gap-2 transition-all bg-emerald-50/30 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                        <MdAdd size={20} /> Thêm tiêu chí mới
                    </button>
                )}
            </div>

            {/* ===== ASSIGNMENT SECTION ===== */}
            {!isReadOnly && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-blue-100/20 dark:border-blue-500/10 mt-8">
                <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setShowAssignPanel(p => !p)}>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <MdSend className="text-blue-500" size={20} />
                        Giao cho đơn vị
                        <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            {assignments.filter(a => a.status === 'active').length} đơn vị
                        </span>
                    </h3>
                    {showAssignPanel ? <MdExpandLess size={22} className="text-gray-400" /> : <MdExpandMore size={22} className="text-gray-400" />}
                </div>

                {showAssignPanel && (
                    <div className="space-y-4 animate-fade-in-up">
                        {/* Currently assigned */}
                        {assignments.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-black text-gray-400 uppercase">Đã giao</p>
                                <div className="flex flex-wrap gap-2">
                                    {assignments.map(a => (
                                        <div key={a.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${a.status === 'active'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200/50 line-through'
                                            }`}>
                                            <MdCheckCircle size={14} className={a.status === 'active' ? 'text-emerald-500' : 'text-gray-300'} />
                                            {a.unitName}
                                            {a.status === 'active' ? (
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm(`Thu hồi giao "${a.unitName}"?`)) return;
                                                        try {
                                                            await revokeCriteriaAssignment(a.id, userProfile?.id || 'staff');
                                                            toast.success(`Đã thu hồi: ${a.unitName}`);
                                                        } catch (e) { toast.error('Lỗi thu hồi'); }
                                                    }}
                                                    className="ml-1 text-red-400 hover:text-red-600 transition-colors"
                                                    title="Thu hồi"
                                                >
                                                    <MdCancel size={14} />
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-gray-400">đã thu hồi</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Assign new units */}
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                            <p className="text-xs font-black text-gray-400 uppercase mb-3">Chọn đơn vị để giao</p>

                            {/* Quick select toolbar */}
                            {(() => {
                                const availableUnits = units.filter(u => !assignments.some(a => a.unitId === u.id && a.status === 'active'));
                                return (
                                    <div className="mb-3 space-y-2">
                                        {/* Select All / Deselect All */}
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <button
                                                onClick={() => setSelectedUnits(availableUnits.map(u => u.id))}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                                            >
                                                <MdSelectAll size={14} />
                                                Chọn tất cả ({availableUnits.length})
                                            </button>
                                            <button
                                                onClick={() => setSelectedUnits([])}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all"
                                            >
                                                <MdClose size={14} />
                                                Bỏ chọn tất cả
                                            </button>
                                        </div>

                                        {/* Select by block */}
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Chọn theo khối:</span>
                                            {UNIT_BLOCKS.map(block => {
                                                const blockUnits = availableUnits.filter(u => u.blockId === block.id);
                                                if (blockUnits.length === 0) return null;
                                                const allSelected = blockUnits.every(u => selectedUnits.includes(u.id));
                                                return (
                                                    <button
                                                        key={block.id}
                                                        onClick={() => {
                                                            if (allSelected) {
                                                                setSelectedUnits(prev => prev.filter(id => !blockUnits.some(u => u.id === id)));
                                                            } else {
                                                                setSelectedUnits(prev => [...new Set([...prev, ...blockUnits.map(u => u.id)])]);
                                                            }
                                                        }}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${allSelected
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                                                            : 'bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/50 hover:border-emerald-300'
                                                            }`}
                                                        title={`${allSelected ? 'Bỏ chọn' : 'Chọn'} tất cả ${block.name} (${blockUnits.length})`}
                                                    >
                                                        <MdCheckCircle size={12} className={allSelected ? 'text-emerald-500' : 'text-gray-300'} />
                                                        {block.name}
                                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${allSelected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                                            {blockUnits.length}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Chọn theo loại:</span>
                                            {UNIT_BLOCKS.flatMap(block => block.types.map(type => {
                                                const typeUnits = availableUnits.filter(u => u.blockId === block.id && u.typeId === type.id);
                                                if (typeUnits.length === 0) return null;
                                                const allSelected = typeUnits.every(u => selectedUnits.includes(u.id));
                                                return (
                                                    <button
                                                        key={`${block.id}:${type.id}`}
                                                        onClick={() => {
                                                            if (allSelected) {
                                                                setSelectedUnits(prev => prev.filter(id => !typeUnits.some(u => u.id === id)));
                                                            } else {
                                                                setSelectedUnits(prev => [...new Set([...prev, ...typeUnits.map(u => u.id)])]);
                                                            }
                                                        }}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${allSelected
                                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                                            : 'bg-white dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300'
                                                            }`}
                                                        title={`${allSelected ? 'Bỏ chọn' : 'Chọn'} tất cả ${type.name} (${typeUnits.length})`}
                                                    >
                                                        <MdCheckCircle size={12} className={allSelected ? 'text-blue-500' : 'text-gray-300'} />
                                                        {type.name}
                                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${allSelected ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                                            {typeUnits.length}
                                                        </span>
                                                    </button>
                                                );
                                            }))}
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                                {units.filter(u => !assignments.some(a => a.unitId === u.id && a.status === 'active')).map(unit => (
                                    <label key={unit.id} className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer border transition-all ${selectedUnits.includes(unit.id)
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 text-blue-700 dark:text-blue-400'
                                        : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-400 hover:border-blue-200'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedUnits.includes(unit.id)}
                                            onChange={() => setSelectedUnits(prev => prev.includes(unit.id) ? prev.filter(id => id !== unit.id) : [...prev, unit.id])}
                                            className="w-3.5 h-3.5 rounded"
                                        />
                                        <span className="truncate">{unit.unitName || unit.name}</span>
                                        {unit.blockName && <span className="text-[9px] text-gray-400 ml-auto hidden lg:inline">{unit.blockName}</span>}
                                    </label>
                                ))}
                            </div>
                            {selectedUnits.length > 0 && (
                                <div className="flex items-center gap-3 mt-3">
                                    <button
                                        onClick={async () => {
                                            setIsAssigning(true);
                                            try {
                                                const toAssign = units.filter(u => selectedUnits.includes(u.id));
                                                await assignCriteriaToUnits(localSet, toAssign, userProfile?.id || 'staff');
                                                toast.success(`Đã giao cho ${toAssign.length} đơn vị!`);
                                                setSelectedUnits([]);
                                            } catch (e) { console.error(e); toast.error('Lỗi khi giao'); }
                                            finally { setIsAssigning(false); }
                                        }}
                                        disabled={isAssigning}
                                        className="btn btn-primary text-xs !py-2 !px-4"
                                    >
                                        {isAssigning ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <MdSend size={14} />}
                                        Giao {selectedUnits.length} đơn vị
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                </div>
            )}

            {/* Floating save indicator */}
            {
                isDirty && !isReadOnly && (
                    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
                        <button onClick={handleSave} disabled={isSaving}
                            className="btn btn-primary shadow-glow py-3 px-6 rounded-2xl flex items-center gap-2 text-sm font-bold">
                            {isSaving ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : <MdSave size={18} />}
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                )
            }
        </div >
    );
};

export default CriteriaSetDetailPage;
