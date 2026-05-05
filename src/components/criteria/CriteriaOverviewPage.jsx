import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdClose, MdAssignment, MdGrade } from 'react-icons/md';
import EvidenceUpload from './EvidenceUpload';
import toast from 'react-hot-toast';
import { useSetAssignments } from '../../hooks/useAssignments';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { subscribeToAllCriteriaSubmissions, gradeCriteriaSubmission } from '../../firebase/criteriaFirestore';
import { buildCriteriaTableRows } from '../../utils/criteriaTable';

const CriteriaOverviewPage = () => {
    const { criteriaSetId } = useParams();
    const navigate = useNavigate();
    const { criteriaSets } = useCriteriaSets();
    const { assignments } = useSetAssignments(criteriaSetId);
    const [submissions, setSubmissions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [gradingUnit, setGradingUnit] = useState(null);
    const [gradedScores, setGradedScores] = useState({});
    const [gradedComment, setGradedComment] = useState('');
    const [isSavingGrade, setIsSavingGrade] = useState(false);

    const criteriaSet = criteriaSets.find((s) => s.id === criteriaSetId);
    const tableRows = buildCriteriaTableRows(criteriaSet);

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
        })
        .filter((item) => item.assignment.unitName.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusMap = {
        not_submitted: { label: 'Chưa nộp', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
        draft: { label: 'Bản nháp', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
        submitted: { label: 'Đã nộp', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
        graded: { label: 'Đã thẩm định', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
    };

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
            await gradeCriteriaSubmission(submissionId, gradedScores, gradedComment, 'admin');
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
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{activeAssignments.length}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Đơn vị</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
                        <p className="text-2xl font-black text-blue-600">{overviewData.filter((d) => d.status === 'submitted').length}</p>
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Đã nộp</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
                        <p className="text-2xl font-black text-emerald-600">{overviewData.filter((d) => d.status === 'graded').length}</p>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase">Đã thẩm định</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
                        <p className="text-2xl font-black text-slate-500">{overviewData.filter((d) => d.status === 'not_submitted').length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Chưa nộp</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 shadow-sm max-w-md">
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

            <div className="space-y-4">
                {overviewData.map((item) => {
                    const statusInfo = statusMap[item.status];
                    const isGrading = gradingUnit === item.assignment.unitId;

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
                                        </div>
                                    </div>
                                </div>

                                {item.submission && item.status !== 'not_submitted' && (
                                    <button
                                        onClick={() => {
                                            if (isGrading) {
                                                setGradingUnit(null);
                                                return;
                                            }
                                            setGradingUnit(item.assignment.unitId);
                                            setGradedScores(item.submission.gradedScores || {});
                                            setGradedComment(item.submission.gradedComment || '');
                                        }}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        <MdGrade size={14} />
                                        {isGrading ? 'Đóng' : item.status === 'graded' ? 'Xem/Sửa điểm' : 'Thẩm định'}
                                    </button>
                                )}
                            </div>

                            {isGrading && item.submission && (
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
                                                    <th className="px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500 sticky left-0 bg-gray-50/80 dark:bg-gray-900/90 z-10">Tiêu chí</th>
                                                    <th className="px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500 sticky left-[120px] bg-gray-50/80 dark:bg-gray-900/90 z-10">Nội dung</th>
                                                    <th className="min-w-[200px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Điều kiện chấm</th>
                                                    <th className="min-w-[160px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Yêu cầu minh chứng</th>
                                                    <th className="px-2 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Tổ</th>
                                                    <th className="px-2 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Hạn nộp</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Điểm tối đa</th>
                                                    <th className="min-w-[160px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Đánh giá của đơn vị</th>
                                                    <th className="min-w-[100px] px-2 py-4 text-left text-[11px] font-black uppercase tracking-wider text-gray-500">Minh chứng</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-gray-500">Điểm tự chấm</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Điểm cấp trên (trước GT)</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-amber-600">Y/C Giải trình</th>
                                                    <th className="min-w-[160px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-amber-600">Nội dung giải trình</th>
                                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-blue-600">Điểm sau GT</th>
                                                    <th className="min-w-[140px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Nhận xét</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
                                                {tableRows.map((row, index) => {
                                                    const res = item.submission.responses?.[row.id] || {};
                                                    const evidenceFiles = res.evidenceFiles || [];
                                                    const showTc = index === 0 || tableRows[index - 1].tcId !== row.tcId;
                                                    const showNd = index === 0 || tableRows[index - 1].tcId !== row.tcId || tableRows[index - 1].ndId !== row.ndId;

                                                    return (
                                                        <tr key={row.id} className="align-top hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors">
                                                            {/* Tiêu chí - Sticky */}
                                                            <td className="px-3 py-4 sticky left-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 border-r border-gray-100 dark:border-gray-800">
                                                                {showTc ? (
                                                                    <div className="font-black text-gray-900 dark:text-white">{row.tcTitle}</div>
                                                                ) : (
                                                                    <span className="text-xs font-bold text-gray-300 dark:text-gray-700">↳</span>
                                                                )}
                                                            </td>
                                                            {/* Nội dung - Sticky */}
                                                            <td className="px-3 py-4 sticky left-[120px] bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 border-r border-gray-100 dark:border-gray-800">
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
                                                            {/* Điều kiện chấm */}
                                                            <td className="px-3 py-4">
                                                                <div className="whitespace-pre-line font-medium text-gray-700 dark:text-gray-200 text-xs">
                                                                    {row.dieuKienCham || '—'}
                                                                </div>
                                                            </td>
                                                            {/* YC minh chứng */}
                                                            <td className="px-3 py-4">
                                                                <div className="whitespace-pre-line text-xs text-blue-700 dark:text-blue-300">
                                                                    {row.yeucauMinhChung || '—'}
                                                                </div>
                                                            </td>
                                                            {/* Tổ */}
                                                            <td className="px-2 py-4">
                                                                {row.toTheoDoi ? (
                                                                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                                        {row.toTheoDoi}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">—</span>
                                                                )}
                                                            </td>
                                                            {/* Hạn nộp */}
                                                            <td className="px-2 py-4 text-xs text-gray-600 dark:text-gray-300">{row.deadline || '—'}</td>
                                                            {/* Điểm tối đa */}
                                                            <td className="px-2 py-4 text-center">
                                                                <span className="inline-flex rounded-xl bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                                    {row.khungDiem}
                                                                </span>
                                                            </td>
                                                            {/* Đánh giá của đơn vị */}
                                                            <td className="px-3 py-4">
                                                                <div className="min-w-[160px] text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                                                    {res.notes || <span className="text-gray-400 italic">Không có mô tả</span>}
                                                                </div>
                                                            </td>
                                                            {/* Minh chứng */}
                                                            <td className="px-2 py-4">
                                                                <div className="max-w-[180px]">
                                                                    <EvidenceUpload files={evidenceFiles} readOnly={true} />
                                                                </div>
                                                            </td>
                                                            {/* Điểm tự chấm */}
                                                            <td className="px-2 py-4 text-center">
                                                                <span className="inline-flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-sm font-black text-blue-700 dark:text-blue-400">
                                                                    {res.selfScore ?? '—'}
                                                                </span>
                                                            </td>
                                                            {/* Điểm cấp trên (trước GT) - Editable */}
                                                            <td className="px-2 py-4">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={row.khungDiem}
                                                                    step="0.5"
                                                                    value={getOfficialScoreValue(gradedScores[row.id])}
                                                                    onChange={(e) => handleGradedScoreChange(row.id, e.target.value)}
                                                                    className="input w-16 text-center font-black text-emerald-600 dark:text-emerald-400 mx-auto block"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            {/* Y/C Giải trình - Checkbox */}
                                                            <td className="px-2 py-4 text-center">
                                                                <label className="flex items-center justify-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={typeof gradedScores[row.id] === 'object' ? (gradedScores[row.id]?.requireJustification || false) : false}
                                                                        onChange={(e) => {
                                                                            setGradedScores((prev) => {
                                                                                const current = prev[row.id];
                                                                                if (current && typeof current === 'object') {
                                                                                    return { ...prev, [row.id]: { ...current, requireJustification: e.target.checked } };
                                                                                }
                                                                                return { ...prev, [row.id]: { officialScore: '', feedback: '', requireJustification: e.target.checked, afterJustificationScore: '' } };
                                                                            });
                                                                        }}
                                                                        className="w-5 h-5 text-amber-500 rounded border-gray-300 focus:ring-amber-500 dark:bg-gray-800 dark:border-gray-600"
                                                                    />
                                                                </label>
                                                            </td>
                                                            {/* Nội dung giải trình - Readonly */}
                                                            <td className="px-3 py-4">
                                                                <div className="min-w-[160px] text-xs text-amber-700 dark:text-amber-400 whitespace-pre-line p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                                    {res.justificationText || <span className="text-gray-400 italic">Chưa giải trình</span>}
                                                                </div>
                                                            </td>
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
                                                                    className="input w-16 text-center font-black text-blue-600 dark:text-blue-400 mx-auto block"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            {/* Nhận xét - Editable */}
                                                            <td className="px-3 py-4">
                                                                <textarea
                                                                    value={getFeedbackValue(gradedScores[row.id])}
                                                                    onChange={(e) => handleFeedbackChange(row.id, e.target.value)}
                                                                    rows={2}
                                                                    className="input min-w-[140px] w-full text-xs resize-none"
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

                                    <button
                                        onClick={() => handleGrade(item.submission.id)}
                                        disabled={isSavingGrade}
                                        className="btn btn-primary text-xs !py-2 !px-6"
                                    >
                                        {isSavingGrade ? 'Đang lưu...' : 'Lưu thẩm định'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {overviewData.length === 0 && (
                    <div className="text-center py-20 text-gray-400 font-bold">
                        Chưa có đơn vị nào được giao tiêu chí này.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CriteriaOverviewPage;
