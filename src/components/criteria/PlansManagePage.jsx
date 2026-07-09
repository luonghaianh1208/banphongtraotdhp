import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { MdAdd, MdDelete, MdEdit, MdCheck, MdClose, MdPublish, MdSearch, MdFilterList, MdGroup, MdPersonAdd } from 'react-icons/md';
import { usePlans } from '../../hooks/usePlans';
import { useUnits } from '../../hooks/useUnits';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../context/AuthContext';
import { createPlanWithActivityLog, updatePlanWithActivityLog, deletePlan } from '../../firebase/criteriaFirestore';
import { UNIT_BLOCKS } from '../../utils/constants';
import EvidenceUpload from './EvidenceUpload';
import toast from 'react-hot-toast';
import { getVietnameseError } from '../../utils/errorUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

const PlansManagePage = () => {
    const { plans, loading: plansLoading } = usePlans();
    const { loading: unitsLoading } = useUnits();
    const { users, loading: usersLoading } = useUsers();
    const { currentUser, userProfile, isAdmin, isManager } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [blockFilter, setBlockFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selected, setSelected] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [assignmentPlan, setAssignmentPlan] = useState(null);
    const [assignmentDraft, setAssignmentDraft] = useState([]);
    const [isSavingAssignees, setIsSavingAssignees] = useState(false);

    const [formData, setFormData] = useState({
        title: '', type: 'plan', description: '', submissionDeadline: '',
        targetBlocks: [], targetTypes: [], attachments: [], assignedStaffIds: [],
    });

    const loading = plansLoading || unitsLoading || usersLoading;

    const staff = useMemo(() => (
        users.filter(u => ['admin', 'manager', 'member'].includes(u.role) && u.isActive !== false)
    ), [users]);

    const getStaffName = (uid) => {
        const user = staff.find(u => u.id === uid);
        return user?.displayName || user?.email || '';
    };

    const getAssignedStaffNames = (ids = []) => (
        ids.map(id => getStaffName(id) || id).filter(Boolean)
    );

    const getPlanAssigneeNames = (plan) => {
        const ids = plan.assignedStaffIds || [];
        if (ids.length) {
            return ids.map((id, index) => getStaffName(id) || plan.assignedStaffNames?.[index] || id).filter(Boolean);
        }
        return plan.assignedStaffNames || [];
    };

    const getActorInfo = () => ({
        actorId: currentUser?.uid || null,
        actorName: userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Người dùng hệ thống',
        actorRole: userProfile?.role || '',
    });

    const buildPlanLog = (action, message, changes = {}) => ({
            action,
            message,
            changes,
            ...getActorInfo(),
    });

    const canAssignPlan = (plan) => isAdmin || isManager || plan.createdBy === currentUser?.uid;
    const canDeletePlan = () => isAdmin || isManager;

    // Member chỉ thấy plans mình tạo, Admin/Manager thấy tất cả
    const visiblePlans = useMemo(() => {
        if (isAdmin || isManager) return plans;
        return plans.filter(p => p.createdBy === currentUser?.uid || (p.assignedStaffIds || []).includes(currentUser?.uid));
    }, [plans, isAdmin, isManager, currentUser]);

    const filteredPlans = useMemo(() => {
        return visiblePlans.filter(p => {
            const matchesSearch = !searchTerm.trim() || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            const matchesBlock = blockFilter === 'all' || (p.targetBlocks || []).includes(blockFilter) || (p.targetBlocks || []).length === 0;
            return matchesSearch && matchesStatus && matchesBlock;
        });
    }, [visiblePlans, searchTerm, statusFilter, blockFilter]);

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
            const assignedStaffNames = getAssignedStaffNames(formData.assignedStaffIds);
            await createPlanWithActivityLog({
                title: formData.title,
                type: formData.type,
                description: formData.description,
                submissionDeadline: formData.submissionDeadline || null,
                targetBlocks: formData.targetBlocks,
                targetTypes: formData.targetTypes,
                attachments: formData.attachments,
                assignedStaffIds: formData.assignedStaffIds,
                assignedStaffNames,
                createdBy: currentUser?.uid || null,
                createdByName: currentUser?.displayName || currentUser?.email || '',
                status: 'draft',
            }, buildPlanLog('create', `${getActorInfo().actorName} đã tạo kế hoạch "${formData.title}".`, {
                title: formData.title,
                assignedStaffNames,
            }));
            toast.success('Tạo kế hoạch thành công!');
            setShowAddModal(false);
            setFormData({ title: '', type: 'plan', description: '', submissionDeadline: '', targetBlocks: [], targetTypes: [], attachments: [], assignedStaffIds: [] });
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
            const plan = plans.find(p => p.id === editingId);
            await updatePlanWithActivityLog(editingId, { title: editTitle.trim() }, buildPlanLog('update_title', `${getActorInfo().actorName} đã cập nhật tiêu đề kế hoạch.`, {
                from: plan?.title || '',
                to: editTitle.trim(),
            }));
            toast.success('Đã cập nhật');
            setEditingId(null);
        } catch (err) { console.error(err); toast.error(getVietnameseError(err, 'Lỗi cập nhật.')); }
    };

    const handleDelete = async (planId, name) => {
        if (!canDeletePlan()) {
            toast.error('Bạn không có quyền xóa kế hoạch này.');
            return;
        }
        if (!confirm(`Xóa "${name}"?`)) return;
        try {
            await deletePlan(planId);
            toast.success('Đã xóa');
        } catch (err) { console.error(err); toast.error(getVietnameseError(err, 'Lỗi xóa.')); }
    };

    const openAssignmentModal = (plan) => {
        setAssignmentPlan(plan);
        setAssignmentDraft(plan.assignedStaffIds || []);
    };

    const closeAssignmentModal = () => {
        setAssignmentPlan(null);
        setAssignmentDraft([]);
    };

    const toggleAssignee = (uid) => {
        setAssignmentDraft(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
    };

    const saveAssignees = async () => {
        if (!assignmentPlan) return;
        setIsSavingAssignees(true);
        try {
            const assignedStaffNames = getAssignedStaffNames(assignmentDraft);
            await updatePlanWithActivityLog(assignmentPlan.id, {
                assignedStaffIds: assignmentDraft,
                assignedStaffNames,
            }, buildPlanLog('update_assignees', `${getActorInfo().actorName} đã cập nhật nhân viên phụ trách kế hoạch.`, {
                assignedStaffNames,
            }));
            toast.success('Đã cập nhật nhân viên phụ trách.');
            closeAssignmentModal();
        } catch (err) {
            console.error(err);
            toast.error(getVietnameseError(err, 'Lỗi cập nhật nhân viên phụ trách.'));
        } finally {
            setIsSavingAssignees(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!canDeletePlan()) {
            toast.error('Bạn không có quyền xóa kế hoạch.');
            return;
        }
        if (!confirm(`Xóa ${selected.length} kế hoạch đã chọn?`)) return;
        try {
            for (const id of selected) await deletePlan(id);
            setSelected([]);
            toast.success(`Đã xóa ${selected.length} kế hoạch`);
        } catch (err) { console.error(err); toast.error(getVietnameseError(err, 'Lỗi xóa hàng loạt.')); }
    };

    const deletableFilteredPlans = filteredPlans.filter(canDeletePlan);
    const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    const toggleAll = () => setSelected(selected.length === deletableFilteredPlans.length ? [] : deletableFilteredPlans.map(p => p.id));

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
                        Tổng cộng có <span className="font-semibold text-emerald-600 dark:text-emerald-400">{visiblePlans.length}</span> kế hoạch
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="input min-w-[150px]"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="draft">Bản nháp</option>
                        <option value="published">Đang mở</option>
                        <option value="closed">Đã đóng</option>
                    </select>
                    <select
                        value={blockFilter}
                        onChange={e => setBlockFilter(e.target.value)}
                        className="input min-w-[160px]"
                    >
                        <option value="all">Tất cả khối</option>
                        {UNIT_BLOCKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kế hoạch..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="input pl-10 pr-8"
                        />
                        <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors">
                                <MdClose size={16} />
                            </button>
                        )}
                    </div>
                    {(searchTerm || statusFilter !== 'all' || blockFilter !== 'all') && (
                        <span className="text-xs text-slate-400 italic self-center">Hiển thị {filteredPlans.length}/{visiblePlans.length}</span>
                    )}
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary flex items-center gap-2">
                        <MdAdd size={20} /> Thêm Mới
                    </button>
                    {selected.length > 0 && canDeletePlan() && (
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
                                        checked={selected.length === deletableFilteredPlans.length && deletableFilteredPlans.length > 0}
                                        onChange={toggleAll}
                                        disabled={!deletableFilteredPlans.length}
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
                                const assigneeNames = getPlanAssigneeNames(plan);
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
                                                disabled={!canDeletePlan(plan)}
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
                                                <div className="space-y-2">
                                                    <div className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        {plan.title}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                                        <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                                                            <MdGroup size={14} /> Phụ trách:
                                                        </span>
                                                        {assigneeNames.length ? assigneeNames.slice(0, 3).map(name => (
                                                            <span key={name} className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                                {name}
                                                            </span>
                                                        )) : (
                                                            <span className="italic text-slate-400">Chưa giao</span>
                                                        )}
                                                        {assigneeNames.length > 3 && (
                                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                                                +{assigneeNames.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
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
                                                    {formatDisplayDate(plan.submissionDeadline)}
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
                                                    onClick={async () => {
                                                        const newStatus = plan.status === 'published' ? 'draft' : 'published';
                                                        try {
                                                            await updatePlanWithActivityLog(plan.id, { status: newStatus }, buildPlanLog('update_status', `${getActorInfo().actorName} đã cập nhật trạng thái kế hoạch.`, {
                                                                from: plan.status || 'draft',
                                                                to: newStatus,
                                                            }));
                                                            toast.success(newStatus === 'published' ? 'Đã công bố cho cơ sở!' : 'Đã thu hồi về nháp!');
                                                        } catch (err) {
                                                            toast.error('Lỗi: ' + err.message);
                                                        }
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${plan.status === 'published'
                                                        ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                                        : 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                                                        }`}
                                                    title={plan.status === 'published' ? 'Thu hồi (chuyển nháp)' : 'Công bố cho cơ sở'}
                                                >
                                                    <MdPublish size={20} />
                                                </button>
                                                <button
                                                    onClick={() => startEdit(plan)}
                                                    className="p-2 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg"
                                                    title="Sửa nhanh tên"
                                                >
                                                    <MdEdit size={20} />
                                                </button>
                                                {canAssignPlan(plan) && (
                                                    <button
                                                        onClick={() => openAssignmentModal(plan)}
                                                        className="p-2 text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg"
                                                        title="Giao nhân viên phụ trách"
                                                    >
                                                        <MdPersonAdd size={20} />
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/plans/${plan.id}`}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg"
                                                    title="Xem chi tiết & theo dõi nộp"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                    </svg>
                                                </Link>
                                                {canDeletePlan(plan) && (
                                                <button
                                                    onClick={() => handleDelete(plan.id, plan.title)}
                                                    className="p-2 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg"
                                                    title="Xóa"
                                                >
                                                    <MdDelete size={20} />
                                                </button>
                                                )}
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
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Yêu cầu cụ thể về hồ sơ</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="input w-full min-h-[100px] py-3"
                                    placeholder="Mô tả yêu cầu chi tiết về hồ sơ mà đơn vị cần nộp..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Tài liệu đính kèm</label>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mb-2 px-1">
                                    Upload file hoặc dán link Drive liên quan đến kế hoạch
                                </p>
                                <div className="glass border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4">
                                    <EvidenceUpload
                                        files={formData.attachments}
                                        onChange={(newFiles) => setFormData(p => ({ ...p, attachments: newFiles }))}
                                        helperText="Có thể tải file văn bản hoặc thêm link tài liệu, link biểu mẫu, link trang web. Link hợp lệ bắt đầu bằng http:// hoặc https://."
                                        linkButtonLabel="Thêm link"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Nhân viên phụ trách</label>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mb-2.5 px-1 uppercase tracking-wider">
                                    Nhân viên được chọn sẽ nhìn thấy và chỉnh sửa kế hoạch này
                                </p>
                                <div className="space-y-2 glass border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 max-h-[170px] overflow-y-auto custom-scrollbar-thin">
                                    {staff.length ? staff.map(user => (
                                        <label key={user.id} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedStaffIds.includes(user.id)}
                                                onChange={() => setFormData(prev => ({
                                                    ...prev,
                                                    assignedStaffIds: prev.assignedStaffIds.includes(user.id)
                                                        ? prev.assignedStaffIds.filter(id => id !== user.id)
                                                        : [...prev.assignedStaffIds, user.id],
                                                }))}
                                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-500 focus:ring-emerald-500"
                                            />
                                            <span className="font-semibold">{user.displayName || user.email}</span>
                                            <span className="ml-auto text-[10px] uppercase text-slate-400">{user.role}</span>
                                        </label>
                                    )) : (
                                        <p className="text-sm italic text-slate-400">Chưa có nhân viên để giao phụ trách.</p>
                                    )}
                                </div>
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
            {assignmentPlan && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60 fade-in" onClick={closeAssignmentModal}></div>
                    <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Giao nhân viên phụ trách</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{assignmentPlan.title}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeAssignmentModal}
                                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <MdClose size={22} />
                            </button>
                        </div>

                        <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                            {staff.length ? staff.map(user => (
                                <label key={user.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50/60 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-emerald-900 dark:hover:bg-emerald-900/20">
                                    <input
                                        type="checkbox"
                                        checked={assignmentDraft.includes(user.id)}
                                        onChange={() => toggleAssignee(user.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 dark:border-slate-600"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-bold">{user.displayName || user.email}</p>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">{user.role}</p>
                                    </div>
                                </label>
                            )) : (
                                <p className="rounded-2xl bg-slate-50 p-4 text-sm italic text-slate-400 dark:bg-slate-800/60">Chưa có nhân viên để giao phụ trách.</p>
                            )}
                        </div>

                        <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={closeAssignmentModal}
                                disabled={isSavingAssignees}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={saveAssignees}
                                disabled={isSavingAssignees}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {isSavingAssignees && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                                Lưu phụ trách
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PlansManagePage;
