import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { updateSubmission } from '../../firebase/criteriaFirestore';
import GradeInputCard from './GradeInputCard';
import ConditionRow from './ConditionRow';
import { MdArrowBack, MdSave, MdTrendingUp, MdDescription, MdAttachFile } from 'react-icons/md';

const CriteriaDetailPage = () => {
    const { periodId, submissionId } = useParams();
    const navigate = useNavigate();

    const { submissions, loading: subLoading } = useSubmissions(periodId);
    const { criteriaSets, loading: criteriaLoading } = useCriteriaSets();

    const [submission, setSubmission] = useState(null);
    const [criteriaSet, setCriteriaSet] = useState(null);
    const [gradeData, setGradeData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!subLoading && submissions.length > 0) {
            const sub = submissions.find(s => s.id === submissionId);
            setSubmission(sub);

            // Initialize grading data from existing submission
            // We want to support both old flat format and new object format
            if (sub && sub.gradedPoints) {
                setGradeData(sub.gradedPoints);
            } else {
                setGradeData({});
            }
        }
    }, [subLoading, submissions, submissionId]);

    useEffect(() => {
        if (!criteriaLoading && submission && criteriaSets.length > 0) {
            const set = criteriaSets.find(c => c.id === submission.criteriaSetId);
            setCriteriaSet(set);
        }
    }, [criteriaLoading, submission, criteriaSets]);

    const handleGradeChange = (conditionId, field, value) => {
        setGradeData(prev => {
            const current = prev[conditionId] || { officialScore: '', feedback: '' };
            return {
                ...prev,
                [conditionId]: {
                    ...current,
                    [field]: field === 'officialScore' ? (value === '' ? '' : Number(value)) : value
                }
            };
        });
    };

    const handleSaveGrades = async () => {
        if (!submission) return;
        setIsSaving(true);
        try {
            // Calculate total graded score
            let total = 0;
            Object.values(gradeData).forEach(entry => {
                const score = typeof entry === 'object' ? entry.officialScore : entry;
                if (typeof score === 'number') total += score;
            });

            await updateSubmission(submission.id, {
                gradedPoints: gradeData,
                totalGradedScore: total,
                status: 'graded'
            });
            alert('Đã lưu điểm thẩm định thành công!');
            navigate(`/criteria-overview/${periodId}`);
        } catch (error) {
            console.error(error);
            alert('Lỗi khi lưu điểm!');
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

    return (
        <div className="max-w-6xl mx-auto pb-12 px-4">
            {/* Header section */}
            <div className="mb-8 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border border-emerald-100/20 dark:border-emerald-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <Link to={`/criteria-overview/${periodId}`} className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold hover:underline mb-2 transition-all">
                        <MdArrowBack className="mr-1" /> Quay lại danh sách
                    </Link>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                        Thẩm định: <span className="text-emerald-600 dark:text-emerald-400">{submission.unitName || 'Cơ sở'}</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                        {submission.periodTitle || 'Đợt báo cáo'}
                    </p>
                </div>

                <div className="card glass-morphism p-4 border-emerald-100/30 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <MdTrendingUp size={28} />
                    </div>
                    <div>
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Tổng điểm tự chấm</div>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{submission.totalSelfScore}</div>
                    </div>
                </div>
            </div>

            {/* Criteria sections */}
            <div className="space-y-10">
                {criteriaSet.groups?.map(group => (
                    <div key={group.id} className="card glass-morphism overflow-hidden border-emerald-100/10 dark:border-emerald-500/10">
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">{group.title}</h3>
                            {group.description && <p className="text-emerald-50 text-sm mt-1 font-medium opacity-90">{group.description}</p>}
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {group.conditions?.map((condition, idx) => (
                                <div key={condition.id} className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 hover:bg-emerald-50/5 transition-colors">
                                    {/* Left column: Criteria & Self-report */}
                                    <div className="flex-1 space-y-6">
                                        <ConditionRow condition={condition} index={idx} />

                                        {/* Unit Self-Report Detail */}
                                        <div className="bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-4">
                                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                                <MdDescription size={18} />
                                                <h4 className="text-xs font-black uppercase tracking-widest">Chi tiết từ cơ sở</h4>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Điểm tự chấm</span>
                                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                                        {submission.selfPoints?.[condition.id] || 0}
                                                        <small className="text-xs text-gray-400 font-bold ml-1">/ {condition.maxScore} đ</small>
                                                    </span>
                                                </div>
                                                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mô tả thực hiện</span>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                                        {submission.selfDescriptions?.[condition.id] || <span className="italic text-gray-400">Không có mô tả chi tiết</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                                    <MdAttachFile size={14} /> Minh chứng đính kèm
                                                </span>
                                                {submission.evidenceFiles?.[condition.id] && submission.evidenceFiles[condition.id].length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {submission.evidenceFiles[condition.id].map((file, fIdx) => (
                                                            <a
                                                                key={fIdx}
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all"
                                                            >
                                                                {file.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs font-medium text-gray-400 italic bg-white/50 dark:bg-gray-900/50 py-2 px-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                                                        Không có tệp minh chứng đính kèm
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right column: Official Evaluation */}
                                    <div className="w-full lg:w-80 flex-shrink-0">
                                        <GradeInputCard
                                            label="Kết quả thẩm định"
                                            maxScore={condition.maxScore}
                                            scoreData={gradeData[condition.id] || { officialScore: '', feedback: '' }}
                                            onChange={(field, val) => handleGradeChange(condition.id, field, val)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {(!criteriaSet.groups || criteriaSet.groups.length === 0) && (
                    <div className="card glass-morphism p-20 text-center">
                        <div className="text-emerald-500/20 mb-4 flex justify-center">
                            <MdDescription size={64} />
                        </div>
                        <p className="text-xl font-bold text-gray-400">Bộ tiêu chí này chưa được cấu hình các nhóm tiêu chí chi tiết.</p>
                    </div>
                )}
            </div>

            {/* Sticky bottom bar for save button */}
            {criteriaSet.groups && criteriaSet.groups.length > 0 && (
                <div className="sticky bottom-6 mt-12 z-20">
                    <div className="max-w-md mx-auto card glass-morphism p-3 border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
                        <button
                            onClick={handleSaveGrades}
                            disabled={isSaving}
                            className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                        >
                            {isSaving ? (
                                <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full font-bold"></span>
                            ) : (
                                <MdSave size={24} />
                            )}
                            {isSaving ? 'Đang lưu kết quả...' : 'Hoàn thành thẩm định điểm'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CriteriaDetailPage;
