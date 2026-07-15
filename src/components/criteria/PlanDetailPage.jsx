import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { usePlans } from '../../hooks/usePlans';
import { useContestEntries } from '../../hooks/useContestEntries';
import { useUnits } from '../../hooks/useUnits';
import { useAuth } from '../../context/AuthContext';
import { updatePlanWithActivityLog, subscribeToPlanActivityLogs } from '../../firebase/criteriaFirestore';
import { UNIT_BLOCKS } from '../../utils/constants';
import EvidenceUpload from './EvidenceUpload';
import { formatDateTime, formatDisplayDate } from '../../utils/dateUtils';
import { downloadAttachmentGroupsAsZip } from '../../utils/downloadAttachments';
import toast from 'react-hot-toast';
import {
    MdArrowBack, MdInfo, MdPeople, MdCalendarToday,
    MdCheckCircle, MdEdit as MdDraft, MdHourglassEmpty,
    MdAttachFile, MdFilterList, MdEdit, MdSave, MdClose, MdHistory, MdGroup, MdDownload
} from 'react-icons/md';

const PlanDetailPage = () => {
    const { planId } = useParams();

    const { plans, loading: plansLoading } = usePlans();
    const { entries, loading: entriesLoading } = useContestEntries(planId);
    const { units, loading: unitsLoading } = useUnits();
    const { currentUser, userProfile, isAdmin, isManager } = useAuth();

    const [localPlan, setLocalPlan] = useState(null);
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [editDescription, setEditDescription] = useState('');
    const [editAttachments, setEditAttachments] = useState([]);
    const [isSavingContent, setIsSavingContent] = useState(false);
    const [activityLogs, setActivityLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [isDownloadingAttachments, setIsDownloadingAttachments] = useState(false);

    const remotePlan = useMemo(() => plans.find(x => x.id === planId) || null, [plans, planId]);
    const plan = localPlan?.id === planId ? localPlan : remotePlan;
    const isAssignedToCurrentUser = useMemo(() => (
        !!currentUser?.uid && !!plan && (plan.assignedStaffIds || []).includes(currentUser.uid)
    ), [plan, currentUser]);

    useEffect(() => {
        if (!planId || (!isAdmin && !isManager)) return undefined;
        return subscribeToPlanActivityLogs(planId, (logs) => {
            setActivityLogs(logs);
            setLogsLoading(false);
        }, (error) => {
            console.error(error);
            setLogsLoading(false);
        });
    }, [planId, isAdmin, isManager]);

    const combinedUnitEntries = useMemo(() => {
        if (!units || !entries) return [];
        return units.map(unit => {
            const existingEntry = entries.find(e => e.unitId === unit.id);
            if (existingEntry) {
                return {
                    ...existingEntry,
                    unitName: existingEntry.unitName || unit.unitName || unit.name || 'Không rõ'
                };
            }
            return {
                id: `not_started_${unit.id}`,
                unitId: unit.id,
                unitName: unit.unitName || unit.name || 'Không rõ',
                status: 'not_started',
                docs: [],
                createdAt: null,
                submittedAt: null,
                lastEditedAt: null
            };
        });
    }, [units, entries]);

    const stats = useMemo(() => {
        const submitted = combinedUnitEntries.filter(e => e.status === 'submitted').length;
        const draft = combinedUnitEntries.filter(e => e.status === 'draft').length;
        const notStarted = combinedUnitEntries.filter(e => e.status === 'not_started').length;
        return { submitted, draft, notStarted, total: combinedUnitEntries.length };
    }, [combinedUnitEntries]);

    const getBlockLabel = (p) => {
        if (!p?.targetBlocks?.length) return 'Tất cả đơn vị';
        const names = p.targetBlocks.map(bId => UNIT_BLOCKS.find(b => b.id === bId)?.name || bId);
        return names.join(', ');
    };

    const formatTimestamp = (ts) => {
        if (!ts) return '—';
        if (ts.seconds || ts instanceof Date) return formatDateTime(ts);
        return String(ts);
    };

    if (plansLoading || entriesLoading || unitsLoading || !plan) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-emerald-200 dark:border-emerald-900/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    // Member chỉ xem được plan mình tạo
    if (!isAdmin && !isManager && plan.createdBy !== currentUser?.uid && !isAssignedToCurrentUser) {
        return <Navigate to="/plans-manage" replace />;
    }

    const statusMap = {
        draft: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
        published: { label: 'Đã gửi cho đơn vị', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
        active: { label: 'Đang mở', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
        closed: { label: 'Đã đóng', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    };

    const planStatus = statusMap[plan.status] || statusMap.draft;
    const canEditPlan = isAdmin || isManager || plan.createdBy === currentUser?.uid || isAssignedToCurrentUser;
    const assigneeNames = plan.assignedStaffNames?.length ? plan.assignedStaffNames : (plan.assignedStaffIds || []);
    const actorName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Người dùng hệ thống';

    const buildPlanLog = (action, message, changes = {}) => ({
            action,
            message,
            changes,
            actorId: currentUser?.uid || null,
            actorName,
            actorRole: userProfile?.role || '',
    });

    const startEditContent = () => {
        setEditDescription(plan.description || '');
        setEditAttachments(plan.attachments || []);
        setIsEditingContent(true);
    };

    const cancelEditContent = () => {
        setEditDescription(plan.description || '');
        setEditAttachments(plan.attachments || []);
        setIsEditingContent(false);
    };

    const savePlanContent = async () => {
        setIsSavingContent(true);
        try {
            await updatePlanWithActivityLog(plan.id, {
                description: editDescription,
                attachments: editAttachments,
            }, buildPlanLog('update_content', `${actorName} đã cập nhật nội dung kế hoạch và yêu cầu hồ sơ.`, {
                attachmentsCount: editAttachments.length,
            }));
            setLocalPlan((prev) => ({
                ...(prev || plan),
                description: editDescription,
                attachments: editAttachments,
            }));
            setIsEditingContent(false);
            toast.success('Đã cập nhật nội dung kế hoạch.');
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi cập nhật nội dung kế hoạch.');
        } finally {
            setIsSavingContent(false);
        }
    };

    const downloadAllAttachments = async () => {
        setIsDownloadingAttachments(true);
        try {
            const count = await downloadAttachmentGroupsAsZip([plan], `tai-lieu-${plan.title}`);
            toast.success(`Đã tải ${count} tài liệu.`);
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Không thể tải tài liệu xuống.');
        } finally {
            setIsDownloadingAttachments(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="space-y-2">
                    <Link to="/plans-manage" className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold hover:underline transition-all text-sm">
                        <MdArrowBack className="mr-1" /> Quay lại danh sách
                    </Link>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{plan.title}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge ${plan.type === 'contest'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                            }`}>
                            {plan.type === 'contest' ? 'Hội thi' : 'Kế hoạch'}
                        </span>
                        <span className={`badge ${planStatus.color}`}>{planStatus.label}</span>
                    </div>
                </div>
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                        <MdPeople size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đối tượng</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[140px]" title={getBlockLabel(plan)}>{getBlockLabel(plan)}</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <MdCalendarToday size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hạn nộp</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                            {plan.submissionDeadline ? formatDisplayDate(plan.submissionDeadline) : 'Không giới hạn'}
                        </p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <MdCheckCircle size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đã nộp</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.submitted} / {stats.total}</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <MdHourglassEmpty size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chưa nộp</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{stats.notStarted + stats.draft}</p>
                    </div>
                </div>
            </div>

            <div className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="mr-2 inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                        <MdGroup size={18} className="text-emerald-600 dark:text-emerald-400" />
                        Nhân viên phụ trách
                    </div>
                    {assigneeNames.length ? assigneeNames.map(name => (
                        <span key={name} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {name}
                        </span>
                    )) : (
                        <span className="text-sm italic text-slate-400">Chưa giao nhân viên phụ trách.</span>
                    )}
                </div>
            </div>

            {/* Plan Content */}
            <div className="card overflow-hidden">
                <div className="bg-emerald-500/10 px-6 py-4 border-b border-emerald-100/20 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                    <MdInfo size={20} className="text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Nội dung kế hoạch & Yêu cầu hồ sơ</h3>
                    </div>
                    {canEditPlan && !isEditingContent && (
                        <button
                            type="button"
                            onClick={startEditContent}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50 dark:bg-gray-900 dark:text-emerald-300 dark:ring-emerald-900/40"
                        >
                            <MdEdit size={16} /> Chỉnh sửa
                        </button>
                    )}
                </div>
                <div className="p-6 space-y-6">
                    {isEditingContent && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nội dung kế hoạch & yêu cầu hồ sơ</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="input min-h-[140px] w-full resize-y py-3 text-sm leading-relaxed"
                                    placeholder="Nhập nội dung kế hoạch, yêu cầu hồ sơ..."
                                />
                            </div>
                            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tài liệu / link đính kèm</label>
                                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                                    <EvidenceUpload
                                        files={editAttachments}
                                        onChange={setEditAttachments}
                                        helperText="Có thể tải thêm file hoặc gắn link tài liệu, link biểu mẫu, link trang web. Có thể xóa tài liệu/link không còn dùng."
                                        linkButtonLabel="Thêm link"
                                        previewOnClick
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={cancelEditContent}
                                    disabled={isSavingContent}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                                >
                                    <MdClose size={18} /> Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={savePlanContent}
                                    disabled={isSavingContent}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                                >
                                    {isSavingContent ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <MdSave size={18} />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </>
                    )}

                    {!isEditingContent && <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {plan.description || <span className="italic text-slate-400">Không có mô tả chi tiết.</span>}
                    </div>}

                    {/* Tài liệu đính kèm từ cấp trên */}
                    {!isEditingContent && plan.attachments && plan.attachments.length > 0 && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <MdAttachFile size={14} /> Tài liệu đính kèm ({plan.attachments.length})
                                </h4>
                                <button
                                    type="button"
                                    onClick={downloadAllAttachments}
                                    disabled={isDownloadingAttachments}
                                    className="btn btn-secondary px-3 py-1.5 text-xs"
                                >
                                    <MdDownload size={16} />
                                    {isDownloadingAttachments ? 'Đang đóng gói...' : 'Tải tất cả'}
                                </button>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-3">
                                <EvidenceUpload files={plan.attachments} onChange={() => {}} readOnly previewOnClick allowDownload />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {(isAdmin || isManager) && (
                <div className="card overflow-hidden">
                    <div className="bg-slate-500/10 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            <MdHistory size={20} /> Nhật ký thao tác
                        </h3>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {activityLogs.length} bản ghi gần nhất
                        </span>
                    </div>
                    <div className="p-5">
                        {logsLoading ? (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-500" />
                                Đang tải nhật ký...
                            </div>
                        ) : activityLogs.length ? (
                            <div className="space-y-3">
                                {activityLogs.map(log => (
                                    <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{log.message || 'Đã cập nhật kế hoạch.'}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                            <span>{log.actorName || 'Không rõ người thao tác'}</span>
                                            <span>•</span>
                                            <span>{formatTimestamp(log.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm italic text-slate-400">Chưa có nhật ký thao tác.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Unit Submissions Table — Excel style */}
            <div className="card overflow-hidden">
                <div className="bg-emerald-500/10 px-6 py-4 border-b border-emerald-100/20 flex items-center justify-between">
                    <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                        <MdFilterList size={20} /> Danh sách đơn vị nộp hồ sơ
                    </h3>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {stats.submitted}/{stats.total} đã nộp
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" style={{ minWidth: '700px' }}>
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-12 text-center">STT</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đơn vị</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-32">Trạng thái</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-44">Ngày nộp</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider" style={{ minWidth: '220px' }}>Hồ sơ đính kèm</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {combinedUnitEntries.map((entry, idx) => {
                                const timeToUse = entry.submittedAt || entry.lastEditedAt || entry.createdAt;
                                const timeString = formatTimestamp(timeToUse);

                                return (
                                    <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center font-medium">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{entry.unitName}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {entry.status === 'submitted' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                    <MdCheckCircle size={14} /> Đã nộp
                                                </span>
                                            ) : entry.status === 'draft' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                    <MdDraft size={14} /> Đang nháp
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                    <MdHourglassEmpty size={14} /> Chưa nộp
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{timeString}</td>
                                        <td className="px-4 py-3">
                                            {entry.docs && entry.docs.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {entry.docs.map((doc, i) => (
                                                        <a
                                                            key={i}
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors"
                                                        >
                                                            <MdAttachFile size={14} className="flex-shrink-0" />
                                                            <span className="truncate max-w-[200px]">{doc.name || `Tệp ${i + 1}`}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 dark:text-slate-500 italic">Chưa có hồ sơ</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {combinedUnitEntries.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <MdPeople size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                                        <p className="text-slate-400 font-medium">Chưa có đơn vị nào trong hệ thống</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PlanDetailPage;
