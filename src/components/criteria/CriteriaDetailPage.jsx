import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { useAuth } from '../../context/AuthContext';
import { getCriteriaSubmission, gradeCriteriaSubmission, sendJustificationRequest } from '../../firebase/criteriaFirestore';
import EvidenceUpload from './EvidenceUpload';
import { MdArrowBack, MdSave, MdTrendingUp, MdCheckCircle, MdGrade, MdList, MdChat, MdSend, MdAccessTime, MdClose } from 'react-icons/md';
import { buildCriteriaTableRows } from '../../utils/criteriaTable';
import TextareaAutosize from 'react-textarea-autosize';

const CriteriaDetailPage = () => {
    const { periodId, submissionId } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();

    const { criteriaSets, loading: criteriaLoading } = useCriteriaSets();

    const [submission, setSubmission] = useState(null);
    const [subLoading, setSubLoading] = useState(true);
    const [criteriaSet, setCriteriaSet] = useState(null);
    const [gradeData, setGradeData] = useState({});
    const [generalComment, setGeneralComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('bTC');
    const [jtSelections, setJtSelections] = useState(new Set());
    const [jtDeadline, setJtDeadline] = useState(null);
    const [isSendingJt, setIsSendingJt] = useState(false);

    const toggleJt = (mucId) => {
        setJtSelections(prev => {
            const next = new Set(prev);
            if (next.has(mucId)) next.delete(mucId); else next.add(mucId);
            return next;
        });
    };

    const handleSendJt = async () => {
        if (jtSelections.size === 0) return toast.error('Chưa chọn nội dung nào.');
        if (!jtDeadline) return toast.error('Vui lòng chọn thời hạn giải trình.');
        setIsSendingJt(true);
        try {
            const unitId = submission.unitId;
            const criteriaSetId = submission.criteriaSetId;
            const deadlineStr = jtDeadline.toISOString().split('T')[0];
            await sendJustificationRequest(criteriaSetId, { [unitId]: [...jtSelections] }, deadlineStr, userProfile?.id || 'admin');
            toast.success('Đã gửi yêu cầu giải trình!');
            setJtSelections(new Set()); setJtDeadline(null);
            const refreshed = await getCriteriaSubmission(submission.id);
            if (refreshed) { setSubmission(refreshed); setGradeData(refreshed.gradedScores || {}); }
        } catch (err) { console.error(err); toast.error('Lỗi khi gửi.'); }
        finally { setIsSendingJt(false); }
    };

    useEffect(() => {
        const fetchSubmission = async () => {
            setSubLoading(true);
            try {
                const sub = await getCriteriaSubmission(submissionId);
                setSubmission(sub);
                if (sub && sub.gradedScores) setGradeData(sub.gradedScores);
                else setGradeData({});
                if (sub && sub.gradedComment) setGeneralComment(sub.gradedComment);
            } catch (err) {
                console.error(err);
                toast.error('Lỗi khi tải bài nộp');
            } finally {
                setSubLoading(false);
            }
        };
        if (submissionId) fetchSubmission();
    }, [submissionId]);

    useEffect(() => {
        if (!criteriaLoading && submission && criteriaSets.length > 0) {
            const set = criteriaSets.find(c => c.id === submission.criteriaSetId);
            setCriteriaSet(set);
        }
    }, [criteriaLoading, submission, criteriaSets]);

    const tableRows = useMemo(() => {
        if (!criteriaSet) return [];
        return buildCriteriaTableRows(criteriaSet);
    }, [criteriaSet]);

    // Grade change at mục level
    const handleGradeChange = (mucId, field, value) => {
        setGradeData(prev => {
            const currentMuc = prev[mucId] || { officialScore: '', feedback: '', requireJustification: false, afterJustificationScore: '' };
            let newVal = value;
            if (field === 'officialScore' || field === 'afterJustificationScore') {
                newVal = value === '' ? '' : Number(value);
            }
            if (field === 'requireJustification') {
                newVal = !!value; // boolean
            }
            return {
                ...prev,
                [mucId]: {
                    ...currentMuc,
                    [field]: newVal,
                }
            };
        });
    };

    const handleSaveGrades = async () => {
        if (!submission) return;
        setIsSaving(true);
        try {
            await gradeCriteriaSubmission(
                submission.id,
                gradeData,
                generalComment,
                userProfile?.id || 'admin'
            );
            toast.success('Đã lưu điểm thẩm định thành công!');
            navigate(`/criteria-overview/${periodId}`);
        } catch (error) {
            console.error(error);
            toast.error('Lỗi khi lưu điểm!');
        } finally {
            setIsSaving(false);
        }
    };

    if (subLoading || criteriaLoading || !submission || !criteriaSet) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const isStaff = ['member', 'manager', 'admin'].includes(userProfile?.role);

    const isRowReadOnly = (row) => {
        if (userProfile?.role === 'admin') return false;
        const tc = criteriaSet?.tieuChi?.find(t => t.id === row.tcId) || criteriaSet?.groups?.find(t => t.id === row.tcId);
        // Member/Manager must be explicitly assigned to edit; unassigned rows are read-only
        if (!tc || !tc.assignedTo || tc.assignedTo !== userProfile?.id) return true;
        return false;
    };

    let currentTotalGradedScore = 0;
    tableRows.forEach(row => {
        const graded = gradeData[row.id] || {};
        const score = graded.afterJustificationScore !== undefined && graded.afterJustificationScore !== ''
            ? Number(graded.afterJustificationScore)
            : (graded.officialScore !== undefined && graded.officialScore !== '' ? Number(graded.officialScore) : 0);
        currentTotalGradedScore += score;
    });

    return (
        <div className="max-w-[1920px] w-full mx-auto pb-32 relative px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-8">
                <Link to={`/criteria-overview/${periodId}`} className="p-3 rounded-2xl glass-card hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                    <MdArrowBack size={24} className="group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Thẩm định: <span className="text-emerald-600 dark:text-emerald-400">{submission.unitName || 'Cơ sở'}</span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                            {submission.periodTitle || 'Đợt báo cáo'}
                        </div>
                        <span className="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                            Đang thẩm định
                        </span>
                    </div>
                </div>
            </div>

            <div className="sticky top-4 z-40 mb-10">
                <div className="glass-card p-6 border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-emerald-500/20">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                            <MdTrendingUp size={32} />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 dark:text-white text-lg leading-tight">Điểm cơ sở tự chấm</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">Tổng điểm tự chấm</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                        <div className="text-4xl font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            {submission.totalSelfScore} <span className="text-lg text-gray-400 dark:text-gray-600">/ {criteriaSet.totalMaxScore}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-6 border-l border-emerald-200 dark:border-emerald-800">
                            <MdGrade className="text-emerald-500" size={24} />
                            <div>
                                <span className="block text-xs font-black uppercase text-emerald-500 tracking-widest">Tổng điểm thẩm định</span>
                                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{currentTotalGradedScore}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-2 glass-card px-5 py-3 border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l-4 border-l-emerald-500">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Nhận xét chung cho cơ sở</span>
                    <TextareaAutosize
                        minRows={2}
                        value={generalComment}
                        onChange={(e) => setGeneralComment(e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm text-gray-700 dark:text-gray-300 resize-none"
                        placeholder="Nhập nhận xét chung..."
                    />
                </div>
            </div>

            <div className="flex gap-2 mb-0">
                <button
                    onClick={() => setActiveTab('bTC')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === 'bTC' ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl text-emerald-600 border-t-2 border-emerald-500 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 relative' : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <MdList size={20} /> Bộ tiêu chí
                </button>
                <button
                    onClick={() => setActiveTab('giaiTrinh')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === 'giaiTrinh' ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl text-amber-600 border-t-2 border-amber-500 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 relative' : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <MdChat size={20} /> Giải trình
                </button>
            </div>

            <div className="glass-card overflow-hidden rounded-tl-none">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">
                            {activeTab === 'bTC' ? 'Bảng thẩm định (Toàn bộ tiêu chí)' : 'Bảng yêu cầu giải trình'}
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap gap-2 text-xs font-bold">
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                {activeTab === 'bTC' ? tableRows.length : tableRows.filter(r => gradeData[r.id]?.requireJustification).length} mục
                            </span>
                        </div>
                    </div>
                </div>

                {tableRows.length > 0 ? (
                    <div className="overflow-x-auto">
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
                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-amber-600">Thời hạn GT</th>
                                    <th className="px-2 py-4 text-center text-[11px] font-black uppercase tracking-wider text-blue-600">Điểm sau GT</th>
                                    <th className="min-w-[140px] px-3 py-4 text-left text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Nhận xét</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
                                {tableRows.map((row, index) => {
                                    const res = submission.responses?.[row.id] || {};
                                    const graded = gradeData[row.id] || { officialScore: '', feedback: '', requireJustification: false, afterJustificationScore: '' };
                                    const showTc = index === 0 || tableRows[index - 1].tcId !== row.tcId;
                                    const showNd = index === 0 || tableRows[index - 1].tcId !== row.tcId || tableRows[index - 1].ndId !== row.ndId;

                                    if (activeTab === 'giaiTrinh' && !graded.justificationDeadline) {
                                        return null;
                                    }

                                    const isRowLocked = isRowReadOnly(row);

                                    return (
                                        <tr key={row.id} className="align-top hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors">
                                            <td className="px-4 py-4 sticky left-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 border-r border-gray-100 dark:border-gray-800">
                                                {showTc ? (
                                                    <div className="font-black text-gray-900 dark:text-white">{row.tcTitle}</div>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-300 dark:text-gray-700">↳</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 sticky left-[120px] bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10">
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
                                            <td className="px-4 py-4">
                                                {row.toTheoDoi ? (
                                                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                        {row.toTheoDoi}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">{row.deadline || '—'}</td>
                                            <td className="px-4 py-4 text-center">
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
                                                    <EvidenceUpload
                                                        files={res.evidenceFiles || []}
                                                        onChange={() => {}}
                                                        readOnly={true}
                                                    />
                                                </div>
                                            </td>
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
                                                    value={graded.officialScore}
                                                    onChange={(e) => handleGradeChange(row.id, 'officialScore', e.target.value)}
                                                    disabled={isRowLocked}
                                                    className={`input w-16 text-center text-sm font-black text-emerald-600 dark:text-emerald-400 mx-auto block ${isRowLocked ? 'opacity-70 bg-gray-100' : ''}`}
                                                    placeholder="0"
                                                />
                                            </td>

                                            {/* Y/C Giải trình - Checkbox (locked if not assigned) */}
                                            <td className="px-2 py-4 text-center">
                                                <label className={`flex items-center justify-center ${isRowLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={jtSelections.has(row.id)}
                                                        onChange={() => toggleJt(row.id)}
                                                        disabled={isRowLocked}
                                                        className={`w-5 h-5 text-amber-500 rounded border-gray-300 focus:ring-amber-500 dark:bg-gray-800 dark:border-gray-600 ${isRowLocked ? 'opacity-50' : ''}`}
                                                    />
                                                </label>
                                            </td>

                                            {/* Nội dung giải trình - Readonly */}
                                            <td className="px-3 py-4">
                                                <div className="min-w-[160px] text-xs text-amber-700 dark:text-amber-400 whitespace-pre-line p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                    {res.justificationText || <span className="text-gray-400 italic">Chưa giải trình</span>}
                                                </div>
                                            </td>

                                            {/* Thời hạn GT */}
                                            {(() => {
                                                const dl = graded.justificationDeadline;
                                                const isExpired = dl && new Date(dl) < new Date(new Date().toDateString());
                                                return (
                                                    <td className="px-2 py-4 text-center text-xs">
                                                        {dl ? (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="font-bold text-gray-700 dark:text-gray-300">{new Date(dl).toLocaleDateString('vi-VN')}</span>
                                                                {isExpired && <span className="text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Hết hạn</span>}
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
                                                    value={graded.afterJustificationScore}
                                                    onChange={(e) => handleGradeChange(row.id, 'afterJustificationScore', e.target.value)}
                                                    disabled={isRowLocked}
                                                    className={`input w-16 text-center text-sm font-black text-blue-600 dark:text-blue-400 mx-auto block ${isRowLocked ? 'opacity-70 bg-gray-100' : ''}`}
                                                    placeholder="0"
                                                />
                                            </td>

                                            {/* Nhận xét - Editable */}
                                            <td className="px-3 py-4">
                                                <TextareaAutosize
                                                    minRows={1}
                                                    maxRows={5}
                                                    value={graded.feedback || ''}
                                                    onChange={(e) => handleGradeChange(row.id, 'feedback', e.target.value)}
                                                    disabled={isRowLocked}
                                                    className={`input min-w-[160px] w-full px-3 py-2 text-xs resize-none ${isRowLocked ? 'opacity-70 bg-gray-100' : ''}`}
                                                    placeholder="Nhận xét..."
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-10 text-center text-sm font-bold text-gray-400">
                        Bộ tiêu chí này chưa có mục nào.
                    </div>
                )}
            </div>

            {/* Floating Justification Control Bar */}
            {jtSelections.size > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
                    <div className="flex items-center gap-4 bg-amber-600 dark:bg-amber-700 text-white rounded-2xl px-6 py-3 shadow-2xl shadow-amber-600/30 border border-amber-500">
                        <div className="text-sm font-bold">
                            <span className="text-amber-100">Đã chọn</span>{' '}
                            <span className="text-white text-lg font-black">{jtSelections.size}</span>{' '}
                            <span className="text-amber-100">nội dung</span>
                        </div>
                        <div className="h-8 w-px bg-amber-400/50" />
                        <div className="flex items-center gap-2">
                            <MdAccessTime size={18} className="text-amber-200" />
                            <DatePicker
                                selected={jtDeadline}
                                onChange={setJtDeadline}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Chọn hạn GT..."
                                minDate={new Date()}
                                className="bg-white/20 backdrop-blur text-white placeholder-amber-200 border border-amber-400/50 rounded-xl px-3 py-2 text-sm font-bold w-40 focus:outline-none focus:ring-2 focus:ring-white/50"
                            />
                        </div>
                        <button
                            onClick={handleSendJt}
                            disabled={isSendingJt}
                            className="flex items-center gap-2 bg-white text-amber-700 font-black rounded-xl px-5 py-2 text-sm hover:bg-amber-50 transition-colors disabled:opacity-50"
                        >
                            <MdSend size={16} />
                            {isSendingJt ? 'Đang gửi...' : 'Gửi yêu cầu GT'}
                        </button>
                        <button onClick={() => { setJtSelections(new Set()); setJtDeadline(null); }} className="text-amber-200 hover:text-white">
                            <MdClose size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
                <div className="glass-card p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl border border-emerald-500/30 flex justify-between items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(`/criteria-overview/${periodId}`)}
                        className="px-6 py-3 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
                        disabled={isSaving}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveGrades}
                        disabled={isSaving}
                        className="btn-primary px-10 py-3 flex items-center gap-2 shadow-[0_0_15px_rgba(5,150,105,0.4)]"
                    >
                        {isSaving ? (
                            <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
                        ) : (
                            <MdSave size={20} />
                        )}
                        <span>{isSaving ? 'Đang lưu...' : 'Lưu kết quả thẩm định'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CriteriaDetailPage;
