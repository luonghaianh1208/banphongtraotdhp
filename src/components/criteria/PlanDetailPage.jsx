import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlans } from '../../hooks/usePlans';
import { useContestEntries } from '../../hooks/useContestEntries';
import { useUnits } from '../../hooks/useUnits';
import { UNIT_BLOCKS } from '../../utils/constants';
import EvidenceUpload from './EvidenceUpload';
import {
    MdArrowBack, MdInfo, MdPeople, MdCalendarToday,
    MdCheckCircle, MdEdit as MdDraft, MdHourglassEmpty,
    MdAttachFile, MdFilterList
} from 'react-icons/md';

const PlanDetailPage = () => {
    const { planId } = useParams();

    const { plans, loading: plansLoading } = usePlans();
    const { entries, loading: entriesLoading } = useContestEntries(planId);
    const { units, loading: unitsLoading } = useUnits();

    const [plan, setPlan] = useState(null);

    useEffect(() => {
        if (!plansLoading && plans.length > 0) {
            const p = plans.find(x => x.id === planId);
            setPlan(p);
        }
    }, [plans, planId, plansLoading]);

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
        if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString('vi-VN');
        if (ts instanceof Date) return ts.toLocaleString('vi-VN');
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

    const statusMap = {
        draft: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
        published: { label: 'Đã gửi cho đơn vị', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
        active: { label: 'Đang mở', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
        closed: { label: 'Đã đóng', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    };

    const planStatus = statusMap[plan.status] || statusMap.draft;

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
                            {plan.submissionDeadline ? new Date(plan.submissionDeadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
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

            {/* Plan Content */}
            <div className="card overflow-hidden">
                <div className="bg-emerald-500/10 px-6 py-4 border-b border-emerald-100/20 flex items-center gap-2">
                    <MdInfo size={20} className="text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Nội dung kế hoạch & Yêu cầu hồ sơ</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {plan.description || <span className="italic text-slate-400">Không có mô tả chi tiết.</span>}
                    </div>

                    {/* Tài liệu đính kèm từ cấp trên */}
                    {plan.attachments && plan.attachments.length > 0 && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <MdAttachFile size={14} /> Tài liệu đính kèm ({plan.attachments.length})
                            </h4>
                            <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-3">
                                <EvidenceUpload files={plan.attachments} onChange={() => {}} readOnly />
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
