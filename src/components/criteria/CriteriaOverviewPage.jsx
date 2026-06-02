import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdClose, MdAssignment, MdGrade, MdSend, MdAccessTime, MdDownload } from 'react-icons/md';
import EvidenceUpload from './EvidenceUpload';
import CriteriaGuideFiles from './CriteriaGuideFiles';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSetAssignments } from '../../hooks/useAssignments';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { useAuth } from '../../context/AuthContext';
import { subscribeToAllCriteriaSubmissions, gradeCriteriaSubmission, sendJustificationRequest } from '../../firebase/criteriaFirestore';
import { buildCriteriaTableRows } from '../../utils/criteriaTable';
import { clampCriteriaScore } from '../../utils/criteriaScore';
import { exportCriteriaOverviewToExcel } from '../../utils/exportExcel';
import { formatDisplayDate } from '../../utils/dateUtils';

const CriteriaOverviewPage = () => {
    const { criteriaSetId } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { criteriaSets } = useCriteriaSets();
    const { assignments } = useSetAssignments(criteriaSetId);
    const [submissions, setSubmissions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatusFilter, setActiveStatusFilter] = useState('all');
    const [gradingUnit, setGradingUnit] = useState(null);
    const [gradedScores, setGradedScores] = useState({});
    const [gradedComment, setGradedComment] = useState('');
    const [isSavingGrade, setIsSavingGrade] = useState(false);

    // Justification workflow state
    const [justificationSelections, setJustificationSelections] = useState({}); // { unitId: Set([mucId]) }
    const [justificationDeadline, setJustificationDeadline] = useState(null);
    const [isSendingJustification, setIsSendingJustification] = useState(false);

    const toggleJustificationSelection = (unitId, mucId) => {
        setJustificationSelections(prev => {
            const unitSet = new Set(prev[unitId] || []);
            if (unitSet.has(mucId)) unitSet.delete(mucId);
            else unitSet.add(mucId);
            const next = { ...prev };
            if (unitSet.size === 0) delete next[unitId];
            else next[unitId] = unitSet;
            return next;
        });
    };

    const totalJustificationItems = Object.values(justificationSelections).reduce((s, set) => s + set.size, 0);
    const totalJustificationUnits = Object.keys(justificationSelections).length;

    const setStatusFilter = (nextFilter) => {
        setActiveStatusFilter((prev) => (prev === nextFilter ? 'all' : nextFilter));
        setGradingUnit(null);
    };

    const handleSendJustification = async () => {
        if (totalJustificationItems === 0) return toast.error('Chưa chọn nội dung nào.');
        if (!justificationDeadline) return toast.error('Vui lòng chọn thời hạn giải trình.');
        setIsSendingJustification(true);
        try {
            const selectionsByUnit = {};
            for (const [unitId, mucSet] of Object.entries(justificationSelections)) {
                selectionsByUnit[unitId] = [...mucSet];
            }
            const deadlineStr = justificationDeadline.toISOString().split('T')[0];
            await sendJustificationRequest(criteriaSetId, selectionsByUnit, deadlineStr, userProfile?.id || 'admin');
            toast.success(`Đã gửi yêu cầu giải trình cho ${totalJustificationUnits} đơn vị!`);
            setJustificationSelections({});
            setJustificationDeadline(null);
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi gửi yêu cầu giải trình.');
        } finally {
            setIsSendingJustification(false);
        }
    };

    const criteriaSet = criteriaSets.find((s) => s.id === criteriaSetId);
    const tableRows = buildCriteriaTableRows(criteriaSet);

    // Row-level permission inside criteria module: all staff roles can score like admin.
    const isRowReadOnly = (row) => {
        if (['admin', 'manager', 'member'].includes(userProfile?.role)) return false;
        const tc = criteriaSet?.tieuChi?.find(t => t.id === row.tcId) || criteriaSet?.groups?.find(t => t.id === row.tcId);
        if (!tc || !tc.assignedTo || tc.assignedTo !== userProfile?.id) return true;
        return false;
    };

    useEffect(() => {
        if (!criteriaSetId) return;
        const unsub = subscribeToAllCriteriaSubmissions(
            criteriaSetId,
            (data) => setSubmissions(data),
            (err) => console.error(err)
        );
        return unsub;
    }, [criteriaSetId]);

    if (!criteriaSet) {
        return (
            <div className="card p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">Không tìm thấy bộ tiêu chí.</p>
                <Link to="/criteria-sets" className="btn btn-primary">Quay lại</Link>
            </div>
        );
    }

    const activeAssignments = assignments.filter((a) => a.status === 'active');
    const overviewData = activeAssignments
        .map((assignment) => {
            const submission = submissions.find((item) => item.unitId === assignment.unitId);
            return {
                assignment,
                submission: submission || null,
                status: submission ? submission.status : 'not_submitted',
                totalSelfScore: submission ? submission.totalSelfScore || 0 : 0,
                totalGradedScore: submission ? submission.totalGradedScore || null : null,
            };
        });

    const matchesStatusFilter = (item) => {
        if (activeStatusFilter === 'all') return true;
        if (activeStatusFilter === 'not_submitted') return item.status === 'not_submitted' || item.status === 'draft';
        return item.status === activeStatusFilter;
    };

    // Tách: overviewData dùng cho stats (không filter search), displayData dùng cho hiển thị (có filter search + status)
    const displayData = overviewData.filter((item) => (
        item.assignment.unitName.toLowerCase().includes(searchTerm.toLowerCase())
        && matchesStatusFilter(item)
    ));

    // Stats luôn tính trên toàn bộ assignments (không phụ thuộc search)
    const countSubmitted = overviewData.filter((d) => d.status === 'submitted').length;
    const countGraded = overviewData.filter((d) => d.status === 'graded').length;
    const countNotSubmitted = overviewData.filter((d) => d.status === 'not_submitted' || d.status === 'draft').length;

    const statusMap = {
        not_submitted: { label: 'Chưa nộp', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300' },
        draft: { label: 'Bản nháp', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
        submitted: { label: 'Đã nộp', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
        graded: { label: 'Đã thẩm định', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
    };

    const selectableRowIds = tableRows.filter((row) => !isRowReadOnly(row)).map((row) => row.id);

    const selectJustificationForUnits = (unitIds) => {
        if (selectableRowIds.length === 0) {
            toast.error('Báº¡n khÃ´ng cÃ³ quyá»n chá»n má»¥c giáº£i trÃ¬nh trong bá»™ tiÃªu chÃ­ nÃ y.');
            return;
        }
        if (unitIds.length === 0) {
            toast.error('KhÃ´ng cÃ³ Ä‘Æ¡n vá»‹ nÃ o phÃ¹ há»£p Ä‘á»ƒ chá»n.');
            return;
        }

        setJustificationSelections((prev) => {
            const next = { ...prev };
            unitIds.forEach((unitId) => {
                next[unitId] = new Set(selectableRowIds);
            });
            return next;
        });
        toast.success(`Da chon nhanh toan bo ${selectableRowIds.length} noi dung cho ${unitIds.length} don vi.`);
    };

    const clearJustificationSelectionForUnit = (unitId) => {
        setJustificationSelections((prev) => {
            const next = { ...prev };
            delete next[unitId];
            return next;
        });
    };

    const isUnitFullySelected = (unitId) => (
        selectableRowIds.length > 0
        && selectableRowIds.every((mucId) => justificationSelections[unitId]?.has(mucId))
    );

    const getOfficialScoreValue = (scoreEntry) => (
        typeof scoreEntry === 'object' ? (scoreEntry?.officialScore ?? '') : (scoreEntry ?? '')
    );

    const handleGradedScoreChange = (mucId, value) => {
        setGradedScores((prev) => {
            const current = prev[mucId];
            if (current && typeof current === 'object') {
                return { ...prev, [mucId]: { ...current, officialScore: value } };
            }
            return { ...prev, [mucId]: { officialScore: value, feedback: '' } };
        });
    };

    const handleFeedbackChange = (mucId, value) => {
        setGradedScores((prev) => {
            const current = prev[mucId];
            if (current && typeof current === 'object') {
                return { ...prev, [mucId]: { ...current, feedback: value } };
            }
            return { ...prev, [mucId]: { officialScore: '', feedback: value } };
        });
    };

    const getFeedbackValue = (scoreEntry) => (
        typeof scoreEntry === 'object' ? (scoreEntry?.feedback ?? '') : ''
    );

    const handleGrade = async (submissionId) => {
        setIsSavingGrade(true);
        try {
            await gradeCriteriaSubmission(submissionId, gradedScores, gradedComment, userProfile?.id || 'admin');
            toast.success('Đã lưu thẩm định!');
            setGradingUnit(null);
            setGradedScores({});
            setGradedComment('');
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi lưu thẩm định');
        } finally {
            setIsSavingGrade(false);
        }
    };

    const handleExportOverview = async () => {
        try {
            await exportCriteriaOverviewToExcel(criteriaSet, displayData, tableRows);
            toast.success('Đã xuất file Excel tổng quan.');
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi xuất file Excel.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-6 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/criteria-sets')}
                        className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:gap-3 transition-all duration-300 group"
                    >
                        <MdArrowBack size={16} className="transition-transform group-hover:-translate-x-1" />
                        Quay lại Quản lý Bộ tiêu chí
                    </button>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{criteriaSet.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {criteriaSet.description || 'Tổng quan nộp báo cáo theo đơn vị.'}
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`rounded-2xl p-4 text-center border transition-all ${activeStatusFilter === 'all'
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 shadow-sm'
                            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800'
                            }`}
                    >
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{activeAssignments.length}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Đơn vị</p>
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('submitted')}
                        className={`rounded-2xl p-4 text-center border transition-all ${activeStatusFilter === 'submitted'
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-sm'
                            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800'
                            }`}
                    >
                        <p className="text-2xl font-black text-blue-600">{countSubmitted}</p>
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Đã nộp</p>
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('graded')}
                        className={`rounded-2xl p-4 text-center border transition-all ${activeStatusFilter === 'graded'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 shadow-sm'
                            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800'
                            }`}
                    >
                        <p className="text-2xl font-black text-emerald-600">{countGraded}</p>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase">Đã thẩm định</p>
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('not_submitted')}
                        className={`rounded-2xl p-4 text-center border transition-all ${activeStatusFilter === 'not_submitted'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 shadow-sm'
                            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-800'
                            }`}
                    >
                        <p className="text-2xl font-black text-red-500 dark:text-red-300">{countNotSubmitted}</p>
                        <p className="text-[10px] font-bold text-red-400 dark:text-red-300 uppercase">Chưa nộp</p>
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 shadow-sm max-w-md w-full">
                    <MdSearch size={18} className="text-gray-400" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                        placeholder="Tìm đơn vị..."
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')}>
                            <MdClose size={16} className="text-gray-400 hover:text-red-500" />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {activeStatusFilter !== 'all' && (
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-black text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        >
                            Bỏ lọc
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleExportOverview}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-black hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                    >
                        <MdDownload size={16} />
                        Xuất Excel
                    </button>
                    <button
                        type="button"
                        onClick={() => selectJustificationForUnits(displayData.map((item) => item.assignment.unitId))}
                        disabled={displayData.length === 0 || selectableRowIds.length === 0}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Y/C GT hàng loạt theo danh sách
                    </button>
                </div>
            </div>

            {totalJustificationItems > 0 && (
                <div className="sticky top-4 z-40 animate-fade-in-up">
                    <div className="flex flex-wrap items-center gap-4 bg-amber-600 dark:bg-amber-700 text-white rounded-2xl px-6 py-4 shadow-2xl shadow-amber-600/30 border border-amber-500">
                        <div className="text-sm font-bold">
                            <span className="text-amber-100">Đã chọn</span>{' '}
                            <span className="text-white text-lg font-black">{totalJustificationItems}</span>{' '}
                            <span className="text-amber-100">nội dung từ</span>{' '}
                            <span className="text-white text-lg font-black">{totalJustificationUnits}</span>{' '}
                            <span className="text-amber-100">đơn vị</span>
                        </div>
                        <div className="hidden sm:block h-8 w-px bg-amber-400/50" />
                        <div className="flex items-center gap-2">
                            <MdAccessTime size={18} className="text-amber-200" />
                            <DatePicker
                                selected={justificationDeadline}
                                onChange={setJustificationDeadline}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Chọn hạn GT..."
                                minDate={new Date()}
                                className="bg-white/20 backdrop-blur text-white placeholder-amber-200 border border-amber-400/50 rounded-xl px-3 py-2 text-sm font-bold w-40 focus:outline-none focus:ring-2 focus:ring-white/50"
                            />
                        </div>
                        <button
                            onClick={handleSendJustification}
                            disabled={isSendingJustification}
                            className="flex items-center gap-2 bg-white text-amber-700 font-black rounded-xl px-5 py-2.5 text-sm hover:bg-amber-50 transition-colors disabled:opacity-50"
                        >
                            <MdSend size={16} />
                            {isSendingJustification ? 'Đang gửi...' : 'Gửi yêu cầu GT'}
                        </button>
                        <button
                            onClick={() => { setJustificationSelections({}); setJustificationDeadline(null); }}
                            className="text-amber-200 hover:text-white transition-colors"
                        >
                            <MdClose size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {displayData.map((item) => {
                    const statusInfo = statusMap[item.status];
                    const isGrading = gradingUnit === item.assignment.unitId;
                    const isFullySelected = isUnitFullySelected(item.assignment.unitId);

                    return (
                        <div
                            key={item.assignment.id}
                            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all"
                        >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                        <MdAssignment size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{item.assignment.unitName}</h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                                            {item.totalSelfScore > 0 && <span className="text-xs font-bold text-gray-400">Tự chấm: {item.totalSelfScore}đ</span>}
                                            {item.totalGradedScore !== null && <span className="text-xs font-bold text-emerald-600">Thẩm định: {item.totalGradedScore}đ</span>}
                                            <span className="text-xs italic text-gray-400 dark:text-gray-500">
                                                {(() => {
                                                    const responses = item.submission?.responses || {};
                                                    const submittedCount = tableRows.filter(r => {
                                                        const res = responses[r.id];
                                                        return res && (res.selfScore !== undefined && res.selfScore !== '' && res.selfScore !== null);
                                                    }).length;
                                                    if (submittedCount === 0) return '• Chưa nộp nội dung nào';
                                                    return `• ${submittedCount}/${tableRows.length} nội dung đã nộp`;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isFullySelected) {
                                                clearJustificationSelectionForUnit(item.assignment.unitId);
                                                return;
                                            }
                                            selectJustificationForUnits([item.assignment.unitId]);
                                        }}
                                        disabled={selectableRowIds.length === 0}
                                        className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50 disabled:no-underline"
                                    >
                                        {isFullySelected ? 'Bỏ chọn GT nhanh' : 'Chọn GT nhanh'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isGrading) {
                                                setGradingUnit(null);
                                                return;
                                            }
                                            setGradingUnit(item.assignment.unitId);
                                            setGradedScores(item.submission?.gradedScores || {});
                                            setGradedComment(item.submission?.gradedComment || '');
                                        }}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        <MdGrade size={14} />
                                        {isGrading ? 'Đóng' : item.status === 'graded' ? 'Xem/Sửa điểm' : item.status === 'not_submitted' ? 'Xem / Y/C Giải trình' : 'Thẩm định'}
                                    </button>
                                </div>
                            </div>

                            {isGrading && (
                                <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4 animate-fade-in-up">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-black uppercase text-gray-400">Chi tiết bài nộp</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Bảng đồng bộ cấu trúc 14 cột với cổng cơ sở.
                                            </p>
                                        </div>
                                        <div className="text-xs font-bold text-gray-400">
                                            {tableRows.length} mục chấm
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <table className="min-w-[1600px] w-full text-sm">
                                            <thead className="bg-gray-50/80 dark:bg-gray-900/70">
                                                <tr>
                                                    <th className="px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Tiêu chí</th>
                                                    <th className="px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Nội dung</th>
                                                    <th className="min-w-[200px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Điều kiện chấm</th>
                                                    <th className="min-w-[160px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Yêu cầu minh chứng</th>
                                                    <th className="px-2 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Tổ</th>
                                                    <th className="px-2 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Hạn nộp</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Điểm tối đa</th>
                                                    <th className="min-w-[160px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Đánh giá của đơn vị</th>
                                                    <th className="min-w-[100px] px-2 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Minh chứng</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Điểm tự chấm</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Điểm được chấm</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-amber-600">Y/C Giải trình</th>
                                                    <th className="min-w-[160px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-amber-600">Nội dung giải trình</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-amber-600">Thời hạn GT</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-blue-600">Điểm sau GT</th>
                                                    <th className="min-w-[140px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Nhận xét</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
                                                {tableRows.map((row, index) => {
                                                    const res = item.submission?.responses?.[row.id] || {};
                                                    const jtRes = item.submission?.justificationResponses?.[row.id] || {};
                                                    const evidenceFiles = res.evidenceFiles || [];
                                                    const justificationEvidenceFiles = jtRes.evidenceFiles || [];
                                                    const justificationText = jtRes.justificationText ?? res.justificationText;
                                                    const showTc = index === 0 || tableRows[index - 1].tcId !== row.tcId;
                                                    const showNd = index === 0 || tableRows[index - 1].tcId !== row.tcId || tableRows[index - 1].ndId !== row.ndId;
                                                    const locked = isRowReadOnly(row);

                                                    return (
                                                        <tr key={row.id} className="align-top hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors">
                                                            <td className="px-4 py-4">
                                                                {showTc ? (
                                                                    <div className="font-black text-gray-900 dark:text-white">{row.tcTitle}</div>
                                                                ) : (
                                                                    <span className="text-xs font-bold text-gray-300 dark:text-gray-700">↳</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {row.ndTitle ? (
                                                                    showNd ? (
                                                                        <div className="font-semibold text-gray-700 dark:text-gray-200">{row.ndTitle}</div>
                                                                    ) : (
                                                                        <span className="text-xs font-bold text-gray-300 dark:text-gray-700">↳</span>
                                                                    )
                                                                ) : (
                                                                    <span className="text-sm text-gray-400">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-4">
                                                                <div className="whitespace-pre-line font-medium text-gray-700 dark:text-gray-200 text-xs">
                                                                    {row.dieuKienCham || '—'}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-4">
                                                                <div className="space-y-2">
                                                                    <div className="whitespace-pre-line text-xs text-blue-700 dark:text-blue-300">
                                                                        {row.yeucauMinhChung || '—'}
                                                                    </div>
                                                                    <CriteriaGuideFiles files={row.guideFiles || []} readOnly />
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-4">
                                                                {row.toTheoDoi ? (
                                                                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                                        {row.toTheoDoi}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-2 py-4 text-xs text-gray-600 dark:text-gray-300">{formatDisplayDate(row.deadline) || '—'}</td>
                                                            <td className="px-2 py-4 text-center">
                                                                <span className="inline-flex rounded-xl bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                                    {row.khungDiem}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-4">
                                                                <div className="min-w-[160px] text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                                                    {res.notes || <span className="text-gray-400 italic">Không có mô tả</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-4">
                                                                <div className="max-w-[180px]">
                                                                    <EvidenceUpload files={evidenceFiles} readOnly={true} />
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-4 text-center">
                                                                <span className="inline-flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-sm font-black text-blue-700 dark:text-blue-400">
                                                                    {(() => {
                                                                        const safeSelfScore = clampCriteriaScore(res.selfScore, row.khungDiem);
                                                                        return safeSelfScore === '' ? '—' : safeSelfScore;
                                                                    })()}
                                                                </span>
                                                            </td>
                                                            {/* Điểm được chấm */}
                                                            <td className="px-2 py-4">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={row.khungDiem}
                                                                    step="0.5"
                                                                    value={getOfficialScoreValue(gradedScores[row.id])}
                                                                    onChange={(e) => handleGradedScoreChange(row.id, e.target.value)}
                                                                    disabled={locked}
                                                                    className={`input w-16 text-center font-black text-emerald-600 dark:text-emerald-400 mx-auto block ${locked ? 'opacity-70 bg-gray-100' : ''}`}
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            {/* Y/C Giải trình - Checkbox */}
                                                            <td className="px-2 py-4 text-center">
                                                                <label className={`flex items-center justify-center ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={justificationSelections[item.assignment.unitId]?.has(row.id) || false}
                                                                        onChange={() => toggleJustificationSelection(item.assignment.unitId, row.id)}
                                                                        disabled={locked}
                                                                        className={`w-5 h-5 text-amber-500 rounded border-gray-300 focus:ring-amber-500 dark:bg-gray-800 dark:border-gray-600 ${locked ? 'opacity-50' : ''}`}
                                                                    />
                                                                </label>
                                                            </td>
                                                            {/* Nội dung giải trình - Readonly */}
                                                            <td className="px-3 py-4">
                                                                <div className="min-w-[160px] text-xs text-amber-700 dark:text-amber-400 whitespace-pre-line p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                                    {justificationText || <span className="text-gray-400 italic">Chưa giải trình</span>}
                                                                    {justificationEvidenceFiles.length > 0 && (
                                                                        <div className="mt-2 pt-2 border-t border-amber-100 dark:border-amber-900/30">
                                                                            <EvidenceUpload files={justificationEvidenceFiles} readOnly={true} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            {/* Thời hạn GT */}
                                                            {(() => {
                                                                const gs = item.submission?.gradedScores?.[row.id];
                                                                const dl = gs?.justificationDeadline;
                                                                const isExpired = dl && new Date(dl) < new Date(new Date().toDateString());
                                                                return (
                                                                    <td className="px-2 py-4 text-center text-xs">
                                                                        {dl ? (
                                                                            <div className="flex flex-col items-center gap-1">
                                                                                <span className="font-bold text-gray-700 dark:text-gray-300">{formatDisplayDate(dl)}</span>
                                                                                {isExpired && <span className="text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">⏰ Hết hạn</span>}
                                                                            </div>
                                                                        ) : <span className="text-gray-400">—</span>}
                                                                    </td>
                                                                );
                                                            })()}
                                                            {/* Điểm sau GT - Editable */}
                                                            <td className="px-2 py-4">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={row.khungDiem}
                                                                    step="0.5"
                                                                    value={typeof gradedScores[row.id] === 'object' ? (gradedScores[row.id]?.afterJustificationScore ?? '') : ''}
                                                                    onChange={(e) => {
                                                                        setGradedScores((prev) => {
                                                                            const current = prev[row.id];
                                                                            if (current && typeof current === 'object') {
                                                                                return { ...prev, [row.id]: { ...current, afterJustificationScore: e.target.value } };
                                                                            }
                                                                            return { ...prev, [row.id]: { officialScore: '', feedback: '', afterJustificationScore: e.target.value } };
                                                                        });
                                                                    }}
                                                                    disabled={locked}
                                                                    className={`input w-20 min-w-[5rem] text-center font-black text-blue-600 dark:text-blue-400 mx-auto block ${locked ? 'opacity-70 bg-gray-100' : ''}`}
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            {/* Nhận xét - Editable */}
                                                            <td className="px-3 py-4">
                                                                <textarea
                                                                    value={getFeedbackValue(gradedScores[row.id])}
                                                                    onChange={(e) => handleFeedbackChange(row.id, e.target.value)}
                                                                    disabled={locked}
                                                                    rows={2}
                                                                    className={`input min-w-[140px] w-full text-xs resize-none ${locked ? 'opacity-70 bg-gray-100' : ''}`}
                                                                    placeholder="Nhận xét..."
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Nhận xét</label>
                                        <textarea
                                            value={gradedComment}
                                            onChange={(e) => setGradedComment(e.target.value)}
                                            rows={2}
                                            className="input w-full text-sm"
                                            placeholder="Nhận xét chung..."
                                        />
                                    </div>

                                    {item.submission && (
                                        <button
                                            onClick={() => handleGrade(item.submission.id)}
                                            disabled={isSavingGrade}
                                            className="btn btn-primary text-xs !py-2 !px-6"
                                        >
                                            {isSavingGrade ? 'Đang lưu...' : 'Lưu thẩm định'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {displayData.length === 0 && (
                    <div className="text-center py-20 text-gray-400 font-bold">
                        {searchTerm || activeStatusFilter !== 'all'
                            ? 'Không có đơn vị nào phù hợp với bộ lọc hiện tại.'
                            : 'Chưa có đơn vị nào được giao tiêu chí này.'}
                    </div>
                )}
            </div>

        </div>
    );
};

export default CriteriaOverviewPage;
