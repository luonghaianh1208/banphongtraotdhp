import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdAssignment, MdSave, MdSend, MdArrowBack, MdCheckCircle } from 'react-icons/md';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import {
    getCriteriaSet,
    getSubmissionPeriod,
    saveUnitCriteriaResponse,
    submitCriteriaSubmission,
    subscribeToUnitCriteriaSubmission,
} from '../../firebase/criteriaFirestore';
import { db } from '../../firebase/config';
import EvidenceUpload from '../criteria/EvidenceUpload';
import { buildCriteriaTableRows } from '../../utils/criteriaTable';
import TextareaAutosize from 'react-textarea-autosize';

const UnitSubmitPage = () => {
    const { criteriaSetId } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();

    const [criteriaSet, setCriteriaSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [responses, setResponses] = useState({});
    const [submissionStatus, setSubmissionStatus] = useState(null);
    const [assignmentRevoked, setAssignmentRevoked] = useState(false);
    const [isPeriodLocked, setIsPeriodLocked] = useState(false);

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
                setResponses((prev) => {
                    if (Object.keys(prev).length === 0 && sub.responses) return sub.responses;
                    return prev;
                });
                setSubmissionStatus(sub.status);
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

    const isReadOnly = submissionStatus === 'submitted' || submissionStatus === 'graded' || assignmentRevoked || isPeriodLocked;
    const tableRows = buildCriteriaTableRows(criteriaSet);

    const handleKeyDown = (e, colName) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Allow default Shift+Enter behavior (newline) for textareas
                return;
            }
            // Prevent default Enter behavior (newline) and jump to next row
            e.preventDefault();
            const inputsInCol = Array.from(document.querySelectorAll(`[data-col="${colName}"]`));
            const currentIndex = inputsInCol.indexOf(e.target);
            if (currentIndex > -1 && currentIndex < inputsInCol.length - 1) {
                inputsInCol[currentIndex + 1].focus();
            }
        }
    };

    const handleResponseChange = (mucId, field, value) => {
        if (isReadOnly) return;
        setResponses((prev) => ({
            ...prev,
            [mucId]: { ...(prev[mucId] || {}), [field]: value },
        }));
    };

    let currentTotalScore = 0;
    Object.values(responses).forEach((res) => {
        currentTotalScore += Number(res.selfScore) || 0;
    });

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
        setSaving(true);
        try {
            await saveUnitCriteriaResponse(
                criteriaSetId,
                unitId,
                userProfile.unitName || userProfile.displayName,
                responses,
                currentTotalScore,
                criteriaSet?.periodId || null
            );
            toast.success('Đã lưu thành công!');
        } catch (err) {
            console.error('Lỗi lưu:', err);
            toast.error('Có lỗi xảy ra khi lưu.');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!userProfile) return;
        if (assignmentRevoked) {
            toast.error('Đợt nộp đã bị thu hồi, không thể nộp.');
            return;
        }
        if (isReadOnly) {
            toast.error('Đợt báo cáo đã bị khóa hoặc đã nộp, không thể nộp.');
            return;
        }
        if (!window.confirm('Bạn có chắc chắn muốn nộp báo cáo chính thức? Sau khi nộp sẽ không thể chỉnh sửa.')) return;

        const unitId = userProfile.id;
        setSaving(true);
        try {
            await saveUnitCriteriaResponse(
                criteriaSetId,
                unitId,
                userProfile.unitName || userProfile.displayName,
                responses,
                currentTotalScore,
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
        }
    };

    return (
        <div className="max-w-[1920px] w-full mx-auto pb-32 relative px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/unit/submissions')}
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
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">Bảng tự chấm theo hàng ngang</h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Mỗi mục chấm nằm trên một dòng để cấp dưới và cấp trên đối chiếu cùng một cấu trúc.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap gap-2 text-xs font-bold">
                            <span className="rounded-full bg-primary-50 px-3 py-1.5 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
                                {tableRows.length} mục
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                Tổng tối đa {criteriaSet.totalMaxScore || 0} điểm
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/30">
                            <span className="font-bold">💡 Mẹo nhập liệu:</span>
                            <span>Bấm <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-black shadow-sm">Enter</kbd> để xuống dòng tiếp theo. Bấm <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-black shadow-sm">Shift + Enter</kbd> để ngắt dòng trong ô.</span>
                        </div>
                    </div>
                </div>

                {tableRows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-[1760px] w-full text-sm">
                            <thead className="bg-gray-50/80 dark:bg-gray-900/70">
                                <tr>
                                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Tiêu chí</th>
                                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Nội dung</th>
                                    <th className="px-3 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">STT</th>
                                    <th className="min-w-[340px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Điều kiện chấm</th>
                                    <th className="min-w-[260px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Yêu cầu minh chứng</th>
                                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Tổ</th>
                                    <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Hạn</th>
                                    <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Tối đa</th>
                                    <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Tự chấm</th>
                                    <th className="min-w-[280px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Giải trình</th>
                                    <th className="min-w-[340px] px-4 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Tệp minh chứng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
                                {tableRows.map((row, index) => {
                                    const res = responses[row.id] || {};
                                    const showTc = index === 0 || tableRows[index - 1].tcId !== row.tcId;
                                    const showNd = index === 0 || tableRows[index - 1].tcId !== row.tcId || tableRows[index - 1].ndId !== row.ndId;

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
                                            <td className="px-3 py-4 text-center">
                                                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-emerald-50 px-2 text-xs font-black text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                    {row.stt}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="whitespace-pre-line font-medium text-gray-700 dark:text-gray-200">
                                                    {row.dieuKienCham || '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="whitespace-pre-line text-sm text-blue-700 dark:text-blue-300">
                                                    {row.yeucauMinhChung || '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {row.toTheoDoi ? (
                                                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                        {row.toTheoDoi}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{row.deadline || '—'}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-flex rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                    {row.khungDiem}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={row.khungDiem}
                                                    step="0.5"
                                                    value={res.selfScore ?? ''}
                                                    onChange={(e) => handleResponseChange(row.id, 'selfScore', e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, 'tuCham')}
                                                    data-col="tuCham"
                                                    disabled={isReadOnly}
                                                    className="input w-28 text-center font-black text-emerald-600 dark:text-emerald-400"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <TextareaAutosize
                                                    minRows={1}
                                                    maxRows={10}
                                                    value={res.notes || ''}
                                                    onChange={(e) => handleResponseChange(row.id, 'notes', e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, 'giaiTrinh')}
                                                    data-col="giaiTrinh"
                                                    disabled={isReadOnly}
                                                    className="input min-w-[260px] w-full px-3 py-2 text-sm resize-none"
                                                    placeholder="Nhập giải trình hoặc mô tả minh chứng..."
                                                />
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="min-w-[320px]">
                                                    <EvidenceUpload
                                                        files={res.evidenceFiles || []}
                                                        onChange={(newFiles) => handleResponseChange(row.id, 'evidenceFiles', newFiles)}
                                                        readOnly={isReadOnly}
                                                    />
                                                </div>
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

            {!isReadOnly && (
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitSubmitPage;
