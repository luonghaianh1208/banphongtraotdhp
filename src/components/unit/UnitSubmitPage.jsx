import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdAssignment, MdSave, MdSend, MdArrowBack, MdCheckCircle, MdGrade, MdList, MdChat } from 'react-icons/md';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import {
    getCriteriaSet,
    getSubmissionPeriod,
    saveUnitCriteriaResponse,
    submitCriteriaSubmission,
    subscribeToUnitCriteriaSubmission,
    submitUnitJustification
} from '../../firebase/criteriaFirestore';
import { db } from '../../firebase/config';
import EvidenceUpload from '../criteria/EvidenceUpload';
import ConfirmDialog from '../common/ConfirmDialog';
import { buildCriteriaTableRows } from '../../utils/criteriaTable';
import { clampCriteriaScore } from '../../utils/criteriaScore';
import { hasOnlyFacebookEvidenceLinks } from '../../utils/evidenceLinks';
import TextareaAutosize from 'react-textarea-autosize';

const UnitSubmitPage = () => {
    const { criteriaSetId } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();

    const [criteriaSet, setCriteriaSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [responses, setResponses] = useState({});
    const [justificationResponses, setJustificationResponses] = useState({});
    const [submissionStatus, setSubmissionStatus] = useState(null);
    const [assignmentRevoked, setAssignmentRevoked] = useState(false);
    const [isPeriodLocked, setIsPeriodLocked] = useState(false);
    const [gradedData, setGradedData] = useState({ scores: {}, comment: '', total: null });
    const [savingMessage, setSavingMessage] = useState('');
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'giaiTrinh' ? 'giaiTrinh' : 'bTC';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const cData = await getCriteriaSet(criteriaSetId);
                if (!cData) {
                    toast.error('Không tìm thấy bộ tiêu chí!');
                    navigate('/unit/submissions');
                    return;
                }
                setCriteriaSet(cData);
            } catch (err) {
                console.error('Lỗi khi tải dữ liệu:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [criteriaSetId, navigate]);

    useEffect(() => {
        const unitId = userProfile?.id;
        if (!criteriaSetId || !unitId) return;

        const checkAssignment = async () => {
            try {
                const q = query(
                    collection(db, 'criteriaAssignments'),
                    where('criteriaSetId', '==', criteriaSetId),
                    where('unitId', '==', unitId)
                );
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const assignment = snap.docs[0].data();
                    setAssignmentRevoked(assignment.status === 'revoked');
                }
            } catch (err) {
                console.error('Lỗi kiểm tra assignment:', err);
            }
        };

        checkAssignment();
    }, [criteriaSetId, userProfile?.id]);

    useEffect(() => {
        const checkPeriodStatus = async () => {
            if (!criteriaSet?.periodId) return;
            const period = await getSubmissionPeriod(criteriaSet.periodId);
            if (period && (period.status === 'locked' || period.status === 'published')) {
                setIsPeriodLocked(true);
                toast('Đợt báo cáo đã bị khóa. Bạn chỉ có thể xem, không thể chỉnh sửa.', {
                    icon: '🔒',
                });
            }
        };

        if (criteriaSet) checkPeriodStatus();
    }, [criteriaSet]);

    useEffect(() => {
        const unitId = userProfile?.id;
        if (!criteriaSetId || !unitId) return;

        const unsub = subscribeToUnitCriteriaSubmission(
            criteriaSetId,
            unitId,
            (sub) => {
                if (!sub) return;
                const mainResponses = sub.responses || {};
                const jtResponses = sub.justificationResponses || {};
                setResponses((prev) => {
                    if (Object.keys(prev).length === 0) return mainResponses;
                    return prev;
                });
                setJustificationResponses((prev) => {
                    if (Object.keys(prev).length === 0) return jtResponses;
                    return prev;
                });
                setSubmissionStatus(sub.status);
                if (sub.gradedScores || sub.totalGradedScore != null) {
                    setGradedData({
                        scores: sub.gradedScores || {},
                        comment: sub.gradedComment || '',
                        total: sub.totalGradedScore ?? null,
                    });
                }
            },
            (err) => console.error(err)
        );

        return unsub;
    }, [criteriaSetId, userProfile?.id]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Đang tải dữ liệu báo cáo...</p>
            </div>
        );
    }

    if (!criteriaSet) {
        return <div className="text-center mt-10 dark:text-white font-bold">Dữ liệu không hợp lệ.</div>;
    }

    const tableRows = buildCriteriaTableRows(criteriaSet);
    const scoreLimitsByRow = Object.fromEntries(tableRows.map((row) => [row.id, row.khungDiem]));
    const normalizeSelfScore = (mucId, value) => {
        const normalizedScore = clampCriteriaScore(value, scoreLimitsByRow[mucId]);
        return normalizedScore === '' ? '' : String(normalizedScore);
    };
    const normalizeResponses = (nextResponses = {}) => {
        let hasChanges = false;
        const sanitizedResponses = Object.entries(nextResponses).reduce((acc, [mucId, response]) => {
            if (!response || typeof response !== 'object' || !Object.prototype.hasOwnProperty.call(response, 'selfScore')) {
                acc[mucId] = response;
                return acc;
            }

            const sanitizedSelfScore = normalizeSelfScore(mucId, response.selfScore);
            if (sanitizedSelfScore !== response.selfScore) {
                hasChanges = true;
                acc[mucId] = { ...response, selfScore: sanitizedSelfScore };
                return acc;
            }

            acc[mucId] = response;
            return acc;
        }, {});

        return hasChanges ? sanitizedResponses : nextResponses;
    };
    const getTotalSelfScore = (nextResponses = {}) => Object.entries(nextResponses).reduce((total, [mucId, response]) => {
        const safeScore = clampCriteriaScore(response?.selfScore, scoreLimitsByRow[mucId]);
        return total + (Number(safeScore) || 0);
    }, 0);

    const isMainReportReadOnly = submissionStatus === 'submitted' || submissionStatus === 'graded' || assignmentRevoked || isPeriodLocked;
    const canEditJustificationRow = (graded) => {
        const dlStr = graded?.justificationDeadline;
        if (!dlStr || assignmentRevoked || isPeriodLocked) return false;
        const isDeadlineExpired = new Date(dlStr) < new Date(new Date().toDateString());
        return activeTab === 'giaiTrinh' && !isDeadlineExpired;
    };
    const isReadOnly = isMainReportReadOnly;
    const isGraded = submissionStatus === 'graded';
    const findInvalidEvidenceRow = (responseMap = {}) => (
        tableRows.find((row) => {
            const evidenceFiles = responseMap[row.id]?.evidenceFiles || [];
            return evidenceFiles.length > 0 && !hasOnlyFacebookEvidenceLinks(evidenceFiles);
        }) || null
    );
    const getRowLabel = (row) => {
        if (!row) return 'minh chung';
        if (row.ndTitle) return `${row.tcTitle} / ${row.ndTitle}`;
        return row.tcTitle || row.id;
    };
    const getSubmitRequirementIssue = (responseMap = {}) => {
        for (const row of tableRows) {
            const response = responseMap[row.id] || {};
            const missingFields = [];
            const noteValue = typeof response.notes === 'string' ? response.notes.trim() : '';
            const evidenceFiles = response.evidenceFiles || [];
            const selfScore = response.selfScore;

            if (!noteValue) missingFields.push('noi dung');
            if (!evidenceFiles.length) missingFields.push('link Facebook');
            if (selfScore === '' || selfScore == null) missingFields.push('diem tu cham');

            if (missingFields.length > 0) {
                return { row, missingFields };
            }
        }

        return null;
    };

    const handleResponseChange = (mucId, field, value) => {
        const graded = gradedData.scores[mucId] || {};
        const canEditJustificationField = ['justificationText', 'evidenceFiles'].includes(field) && canEditJustificationRow(graded);
        if (isMainReportReadOnly && !canEditJustificationField) return;
        if (activeTab === 'giaiTrinh' && !canEditJustificationField) return;
        if (canEditJustificationField) {
            setJustificationResponses((prev) => ({
                ...prev,
                [mucId]: { ...(prev[mucId] || {}), [field]: value },
            }));
            return;
        }
        const nextValue = field === 'selfScore' ? normalizeSelfScore(mucId, value) : value;
        setResponses((prev) => ({
            ...prev,
            [mucId]: { ...(prev[mucId] || {}), [field]: nextValue },
        }));
    };

    const currentTotalScore = getTotalSelfScore(responses);

    const handleSaveDraft = async () => {
        if (!userProfile) return;
        if (assignmentRevoked) {
            toast.error('Đợt nộp đã bị thu hồi, không thể lưu.');
            return;
        }
        if (isReadOnly) {
            toast.error('Đợt báo cáo đã bị khóa hoặc đã nộp, không thể lưu.');
            return;
        }

        const unitId = userProfile.id;
        const normalizedResponses = normalizeResponses(responses);
        const normalizedTotalScore = getTotalSelfScore(normalizedResponses);
        const invalidEvidenceRow = findInvalidEvidenceRow(normalizedResponses);
        if (invalidEvidenceRow) {
            toast.error(`Chi duoc luu link Facebook o muc: ${getRowLabel(invalidEvidenceRow)}`);
            return;
        }
        if (normalizedResponses !== responses) {
            setResponses(normalizedResponses);
        }
        setSaving(true);
        setSavingMessage('Dang luu ban nhap...');
        try {
            await saveUnitCriteriaResponse(
                criteriaSetId,
                unitId,
                userProfile.unitName || userProfile.displayName,
                normalizedResponses,
                normalizedTotalScore,
                criteriaSet?.periodId || null
            );
            toast.success('Đã lưu thành công!');
        } catch (err) {
            console.error('Lỗi lưu:', err);
            toast.error('Có lỗi xảy ra khi lưu.');
        } finally {
            setSaving(false);
            setSavingMessage('');
        }
    };

    const confirmSubmit = async () => {
        if (!userProfile) return;
        if (assignmentRevoked) {
            toast.error('Đợt nộp đã bị thu hồi, không thể nộp.');
            return;
        }
        if (isReadOnly) {
            toast.error('Đợt báo cáo đã bị khóa hoặc đã nộp, không thể nộp.');
            return;
        }

        const unitId = userProfile.id;
        const normalizedResponses = normalizeResponses(responses);
        const normalizedTotalScore = getTotalSelfScore(normalizedResponses);
        const invalidEvidenceRow = findInvalidEvidenceRow(normalizedResponses);
        if (invalidEvidenceRow) {
            toast.error(`Chi duoc nop link Facebook o muc: ${getRowLabel(invalidEvidenceRow)}`);
            return;
        }
        const submitRequirementIssue = getSubmitRequirementIssue(normalizedResponses);
        if (submitRequirementIssue) {
            toast.error(`Muc ${getRowLabel(submitRequirementIssue.row)} dang thieu: ${submitRequirementIssue.missingFields.join(', ')}`);
            return;
        }
        if (normalizedResponses !== responses) {
            setResponses(normalizedResponses);
        }
        setSaving(true);
        setSavingMessage('Dang gui bao cao va ghi du lieu...');
        try {
            await saveUnitCriteriaResponse(
                criteriaSetId,
                unitId,
                userProfile.unitName || userProfile.displayName,
                normalizedResponses,
                normalizedTotalScore,
                criteriaSet?.periodId || null
            );
            await submitCriteriaSubmission(criteriaSetId, unitId);
            toast.success('Đã nộp báo cáo chính thức thành công!');
            navigate('/unit/submissions');
        } catch (err) {
            console.error('Lỗi khi nộp:', err);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setSaving(false);
            setSavingMessage('');
        }
    };

    const handleSubmit = () => {
        if (saving) return;
        setShowSubmitConfirm(true);
    };

    const handleSubmitJustification = async () => {
        if (!userProfile) return;
        if (assignmentRevoked || isPeriodLocked) {
            toast.error('Không thể gửi giải trình lúc này.');
            return;
        }

        const unitId = userProfile.id;
        setSaving(true);
        try {
            const requestedResponses = {};
            tableRows.forEach((row) => {
                if (!canEditJustificationRow(gradedData.scores[row.id] || {})) return;
                const jt = justificationResponses[row.id] || {};
                const legacy = responses[row.id] || {};
                requestedResponses[row.id] = {
                    justificationText: jt.justificationText ?? legacy.justificationText ?? '',
                    evidenceFiles: jt.evidenceFiles ?? (legacy.justificationText ? (legacy.evidenceFiles || []) : []),
                };
            });
            const invalidEvidenceRow = findInvalidEvidenceRow(requestedResponses);
            if (invalidEvidenceRow) {
                toast.error(`Chi duoc gui link Facebook o muc: ${getRowLabel(invalidEvidenceRow)}`);
                return;
            }
            setSavingMessage('Dang gui giai trinh...');
            await submitUnitJustification(criteriaSetId, unitId, requestedResponses);
            toast.success('Đã gửi giải trình thành công!');
        } catch (err) {
            console.error('Lỗi khi gửi giải trình:', err);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setSaving(false);
            setSavingMessage('');
        }
    };

    return (
        <>
            {saving && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm px-4">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-gray-900">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 dark:border-emerald-900/50 dark:border-t-emerald-400"></div>
                        <p className="text-base font-black text-gray-900 dark:text-white">{savingMessage || 'Dang xu ly...'}</p>
                        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">Thong bao thanh cong chi hien sau khi du lieu da ghi xong.</p>
                    </div>
                </div>
            )}
        <div className="max-w-[1920px] w-full mx-auto pb-32 relative px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(activeTab === 'giaiTrinh' ? '/unit/submissions?tab=giaiTrinh' : '/unit/submissions')}
                    className="p-3 rounded-2xl glass-card hover:bg-white dark:hover:bg-gray-800 transition-colors group"
                >
                    <MdArrowBack size={24} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{criteriaSet.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <MdAssignment /> Năm: {criteriaSet.academicYear || '—'}
                        </div>
                        {submissionStatus && (
                            <span
                                className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${submissionStatus === 'submitted'
                                    ? 'bg-blue-100 text-blue-600'
                                    : submissionStatus === 'graded'
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-amber-100 text-amber-600'
                                    }`}
                            >
                                {submissionStatus === 'submitted' ? 'Đã nộp' : submissionStatus === 'graded' ? 'Đã thẩm định' : 'Bản nháp'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="sticky top-4 z-40 mb-10">
                <div className="glass-card p-6 border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                            <MdCheckCircle size={32} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight">Tiến độ tự chấm</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">Điểm tổng hợp từ các mục</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                        <div className="flex-1 sm:w-64">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">Hoàn tất</span>
                                <span className="text-xs font-black text-gray-900 dark:text-white">
                                    {Math.round((currentTotalScore / (criteriaSet.totalMaxScore || 1)) * 100)}%
                                </span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                                <div
                                    className="h-full bg-primary-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(5,150,105,0.5)]"
                                    style={{ width: `${Math.min(100, (currentTotalScore / (criteriaSet.totalMaxScore || 1)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-primary-600 dark:text-primary-400 whitespace-nowrap">
                            {currentTotalScore} <span className="text-lg text-gray-400 dark:text-gray-600">/ {criteriaSet.totalMaxScore}</span>
                        </div>
                        {isGraded && gradedData.total != null && (
                            <div className="flex items-center gap-2 pl-6 border-l border-emerald-200 dark:border-emerald-800">
                                <MdGrade className="text-emerald-500" size={20} />
                                <div>
                                    <span className="block text-[10px] font-black uppercase text-emerald-500 tracking-widest">Cấp trên chấm</span>
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{gradedData.total}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {isGraded && gradedData.comment && (
                    <div className="mt-2 glass-card px-5 py-3 border-0 bg-emerald-50/80 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500">
                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Nhận xét chung từ cấp trên</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">{gradedData.comment}</p>
                    </div>
                )}
            </div>



            <div className="glass-card overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">
                            {activeTab === 'bTC' ? 'Bảng tự chấm (Toàn bộ tiêu chí)' : 'Bảng yêu cầu giải trình'}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap gap-2 text-xs font-bold">
                            <span className="rounded-full bg-primary-50 px-3 py-1.5 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
                                {activeTab === 'bTC' ? tableRows.length : tableRows.filter(r => gradedData.scores[r.id]?.justificationDeadline).length} mục
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                Tổng tối đa {criteriaSet.totalMaxScore || 0} điểm
                            </span>
                        </div>
                    </div>
                </div>

                {tableRows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-[1200px] w-full text-sm">
                            <thead className="bg-gray-50/80 dark:bg-gray-900/70">
                                <tr>
                                    <th className="px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Tiêu chí</th>
                                    <th className="px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Nội dung</th>
                                    <th className="min-w-[200px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Điều kiện chấm</th>
                                    <th className="min-w-[160px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Yêu cầu minh chứng</th>
                                    {activeTab === 'bTC' && <th className="px-2 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Tổ</th>}
                                    {activeTab === 'bTC' && <th className="px-2 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Hạn nộp</th>}
                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Điểm tối đa</th>
                                    {activeTab === 'bTC' && <th className="min-w-[160px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Đánh giá của đơn vị</th>}
                                    <th className="min-w-[100px] px-2 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Minh chứng</th>
                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Điểm tự chấm</th>
                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Điểm được chấm</th>
                                    {activeTab === 'giaiTrinh' && <th className="min-w-[160px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-amber-600">Nội dung giải trình</th>}
                                    {activeTab === 'giaiTrinh' && <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-amber-600">Thời hạn GT</th>}
                                    {activeTab === 'giaiTrinh' && <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-blue-600">Điểm sau GT</th>}
                                    <th className="min-w-[140px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Nhận xét</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
                                {tableRows.map((row, index) => {
                                    const baseRes = responses[row.id] || {};
                                    const jtRes = justificationResponses[row.id] || {};
                                    const res = {
                                        ...baseRes,
                                        justificationText: jtRes.justificationText ?? baseRes.justificationText,
                                    };
                                    const evidenceFiles = activeTab === 'giaiTrinh' ? (jtRes.evidenceFiles || []) : (baseRes.evidenceFiles || []);
                                    const graded = gradedData.scores[row.id] || {};
                                    const showTc = index === 0 || tableRows[index - 1].tcId !== row.tcId;
                                    const showNd = index === 0 || tableRows[index - 1].tcId !== row.tcId || tableRows[index - 1].ndId !== row.ndId;

                                    if (activeTab === 'giaiTrinh' && !graded.justificationDeadline) {
                                        return null;
                                    }

                                    const isRowLocked = isReadOnly || activeTab === 'giaiTrinh';
                                    const dlStr = graded.justificationDeadline;
                                    const isDeadlineExpired = dlStr && new Date(dlStr) < new Date(new Date().toDateString());
                                    const isJustificationUnlocked = canEditJustificationRow(graded);

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

                                            <td className="px-4 py-4">
                                                <div className="whitespace-pre-line font-medium text-gray-700 dark:text-gray-200 text-xs">
                                                    {row.dieuKienCham || '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="whitespace-pre-line text-xs text-blue-700 dark:text-blue-300">
                                                    {row.yeucauMinhChung || '—'}
                                                </div>
                                            </td>
                                            {activeTab === 'bTC' && (
                                                <td className="px-4 py-4">
                                                    {row.toTheoDoi ? (
                                                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                            {row.toTheoDoi}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </td>
                                            )}
                                            {activeTab === 'bTC' && <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">{row.deadline || '—'}</td>}
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex rounded-xl bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                    {row.khungDiem}
                                                </span>
                                            </td>
                                            {activeTab === 'bTC' && (
                                                <td className="px-3 py-4">
                                                    <TextareaAutosize
                                                        minRows={1}
                                                        maxRows={5}
                                                        value={res.notes || ''}
                                                        onChange={(e) => handleResponseChange(row.id, 'notes', e.target.value)}
                                                        disabled={isRowLocked}
                                                        className={`input min-w-[160px] w-full px-3 py-2 text-xs resize-none ${isRowLocked ? 'bg-gray-50' : ''}`}
                                                        placeholder="Đánh giá của đơn vị..."
                                                    />
                                                </td>
                                            )}
                                            <td className="px-2 py-4">
                                                <div className="max-w-[180px]">
                                                    <EvidenceUpload
                                                        files={evidenceFiles}
                                                        onChange={(newFiles) => handleResponseChange(row.id, 'evidenceFiles', newFiles)}
                                                        allowFileUpload={false}
                                                        enforceFacebookLinks={true}
                                                        helperText="Chi nhap link Facebook dua tin bai. Khong nhan file tai len hoac link ngoai Facebook."
                                                        readOnly={isRowLocked && !isJustificationUnlocked}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-2 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={row.khungDiem}
                                                    step="0.5"
                                                    value={res.selfScore === '' || res.selfScore == null ? '' : clampCriteriaScore(res.selfScore, row.khungDiem)}
                                                    onChange={(e) => handleResponseChange(row.id, 'selfScore', e.target.value)}
                                                    disabled={isRowLocked}
                                                    className={`input w-16 text-center text-sm font-black text-emerald-600 dark:text-emerald-400 mx-auto block ${isRowLocked ? 'bg-gray-50' : ''}`}
                                                    placeholder="0"
                                                />
                                            </td>
                                            
                                            {/* Điểm được chấm */}
                                            <td className="px-2 py-4 text-center">
                                                {graded.officialScore != null ? (
                                                    <span className="inline-flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-sm font-black text-emerald-700 dark:text-emerald-400">
                                                        {graded.officialScore}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-300">—</span>
                                                )}
                                            </td>



                                            {/* Nội dung giải trình - chỉ hiện trong tab Giải trình */}
                                            {activeTab === 'giaiTrinh' && (
                                                <td className="px-3 py-4">
                                                    <TextareaAutosize
                                                        minRows={1}
                                                        maxRows={5}
                                                        value={res.justificationText || ''}
                                                        onChange={(e) => handleResponseChange(row.id, 'justificationText', e.target.value)}
                                                        disabled={!isJustificationUnlocked}
                                                        className={`input min-w-[160px] w-full px-3 py-2 text-xs resize-none ${!isJustificationUnlocked ? 'bg-gray-50' : 'border-amber-300 focus:border-amber-500'}`}
                                                        placeholder={isDeadlineExpired ? 'Hết hạn giải trình' : 'Nhập nội dung giải trình...'}
                                                    />
                                                </td>
                                            )}

                                            {/* Thời hạn GT - chỉ hiện trong tab Giải trình */}
                                            {activeTab === 'giaiTrinh' && (
                                                <td className="px-2 py-4 text-center text-xs">
                                                    {dlStr ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="font-bold text-gray-700 dark:text-gray-300">{new Date(dlStr).toLocaleDateString('vi-VN')}</span>
                                                            {isDeadlineExpired && <span className="text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">⏰ Hết hạn</span>}
                                                        </div>
                                                    ) : <span className="text-gray-400">—</span>}
                                                </td>
                                            )}

                                            {/* Điểm sau GT - chỉ hiện trong tab Giải trình */}
                                            {activeTab === 'giaiTrinh' && (
                                                <td className="px-2 py-4 text-center">
                                                    {graded.afterJustificationScore != null ? (
                                                        <span className="inline-flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-sm font-black text-blue-700 dark:text-blue-400">
                                                            {graded.afterJustificationScore}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-300">—</span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Nhận xét */}
                                            <td className="px-3 py-4">
                                                {graded.feedback ? (
                                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 whitespace-pre-line min-w-[140px]">
                                                        {graded.feedback}
                                                    </p>
                                                ) : (
                                                    <span className="text-xs text-gray-300">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-10 text-center text-sm font-bold text-gray-400">
                        Bộ tiêu chí này chưa có mục nào để nhập.
                    </div>
                )}
            </div>

            {(!isMainReportReadOnly || activeTab === 'giaiTrinh') && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
                    <div className="glass-card p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl border border-primary-500/30 flex justify-between items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/unit/submissions')}
                            className="px-6 py-3 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
                            disabled={saving}
                        >
                            Quay lại
                        </button>
                        <div className="flex gap-4">
                            {activeTab === 'giaiTrinh' ? (
                                <button
                                    type="button"
                                    onClick={handleSubmitJustification}
                                    disabled={saving || !tableRows.some((row) => canEditJustificationRow(gradedData.scores[row.id] || {}))}
                                    className="btn-primary bg-amber-500 hover:bg-amber-600 border-amber-600 text-white px-10 py-3 flex items-center gap-2 group/submit shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                >
                                    {saving ? (
                                        <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
                                    ) : (
                                        <MdSend size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    )}
                                    <span>Gửi giải trình</span>
                                </button>
                            ) : (
                                <>
                                    <div className="hidden lg:flex items-center max-w-xs text-xs font-bold text-amber-600 dark:text-amber-300">
                                        Can dien du noi dung, link Facebook va diem tu cham cho tung muc truoc khi nop.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        disabled={saving}
                                        className="px-8 py-3 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all flex items-center gap-2"
                                    >
                                        {saving ? <span className="animate-spin h-4 w-4 border-b-2 border-primary-700 rounded-full"></span> : <MdSave size={18} />}
                                        <span>Lưu</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="btn-primary px-10 py-3 flex items-center gap-2 group/submit"
                                    >
                                        {saving ? (
                                            <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
                                        ) : (
                                            <MdSend size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        )}
                                        <span>Nộp báo cáo</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <ConfirmDialog
                isOpen={showSubmitConfirm}
                onClose={() => setShowSubmitConfirm(false)}
                onConfirm={confirmSubmit}
                title="Xac nhan nop bao cao"
                message="Sau khi nop chinh thuc, don vi se khong the chinh sua bao cao nay nua."
                confirmText="Nop chinh thuc"
            />
        </div>
        </>
    );
};

export default UnitSubmitPage;
