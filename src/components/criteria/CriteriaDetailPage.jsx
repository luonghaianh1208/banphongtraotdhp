import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { useAuth } from '../../context/AuthContext';
import { getCriteriaSubmission, gradeCriteriaSubmission } from '../../firebase/criteriaFirestore';
import GradeInputCard from './GradeInputCard';
import { MdArrowBack, MdSave, MdTrendingUp, MdDescription, MdAttachFile, MdExpandMore, MdExpandLess } from 'react-icons/md';

const CriteriaDetailPage = () => {
    const { periodId, submissionId } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();

    const { criteriaSets, loading: criteriaLoading } = useCriteriaSets();

    const [submission, setSubmission] = useState(null);
    const [subLoading, setSubLoading] = useState(true);
    const [criteriaSet, setCriteriaSet] = useState(null);
    const [gradeData, setGradeData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [expandedTC, setExpandedTC] = useState({});

    useEffect(() => {
        const fetchSubmission = async () => {
            setSubLoading(true);
            try {
                const sub = await getCriteriaSubmission(submissionId);
                setSubmission(sub);
                if (sub && sub.gradedScores) setGradeData(sub.gradedScores);
                else setGradeData({});
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
            // Expand all tiêu chí by default
            if (set) {
                const exp = {};
                (set.tieuChi || set.groups || []).forEach(tc => { exp[tc.id] = true; });
                setExpandedTC(exp);
            }
        }
    }, [criteriaLoading, submission, criteriaSets]);

    const toggleTC = (tcId) => setExpandedTC(prev => ({ ...prev, [tcId]: !prev[tcId] }));

    // Grade change at mục level
    const handleGradeChange = (mucId, field, value) => {
        setGradeData(prev => ({
            ...prev,
            [mucId]: {
                ...(prev[mucId] || { officialScore: '', feedback: '' }),
                [field]: field === 'officialScore' ? (value === '' ? '' : Number(value)) : value,
            }
        }));
    };

    const handleSaveGrades = async () => {
        if (!submission) return;
        setIsSaving(true);
        try {
            await gradeCriteriaSubmission(
                submission.id,
                gradeData,
                '',
                userProfile?.id || 'admin_uid'
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

    // Support both old (groups→conditions) and new (tieuChi→noiDung→muc) format
    const tieuChiList = criteriaSet.tieuChi || criteriaSet.groups || [];
    const isNewFormat = !!criteriaSet.tieuChi;

    const isStaff = ['member', 'manager'].includes(userProfile?.role);
    // Remove broken assignedTo filter (BUG-010) - Members can grade all criteria
    const visibleTieuChi = tieuChiList;

    const hasMuc = visibleTieuChi.length > 0;

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

            {/* Criteria sections — NEW 3-LEVEL */}
            <div className="space-y-6">
                {visibleTieuChi.map(tc => {
                    const isOpen = expandedTC[tc.id];
                    const noiDungList = tc.noiDung || [];
                    // Old format: conditions array directly on group
                    const conditionsList = tc.conditions || [];

                    return (
                        <div key={tc.id} className="card glass-morphism overflow-hidden border-emerald-100/10 dark:border-emerald-500/10">
                            {/* TC Header */}
                            <div
                                className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4 flex items-center cursor-pointer"
                                onClick={() => toggleTC(tc.id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{tc.title}</h3>
                                    {tc.description && <p className="text-emerald-50 text-sm mt-1 font-medium opacity-90">{tc.description}</p>}
                                </div>
                                {isOpen ? <MdExpandLess className="text-white" size={24} /> : <MdExpandMore className="text-white" size={24} />}
                            </div>

                            {isOpen && (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {/* NEW FORMAT: tieuChi → noiDung → muc */}
                                    {isNewFormat && noiDungList.map(nd => (
                                        <div key={nd.id} className="p-4 space-y-3">
                                            <h4 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-tight flex items-center gap-2 px-2">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                {nd.title}
                                            </h4>

                                            {(nd.muc || []).map(m => (
                                                <div key={m.id} className="bg-gray-50/80 dark:bg-gray-800/30 rounded-2xl p-5 border border-gray-100 dark:border-gray-800/50">
                                                    <div className="flex flex-col lg:flex-row gap-6">
                                                        {/* Left: mục info + self-score */}
                                                        <div className="flex-1 space-y-4">
                                                            <div className="flex items-start gap-3">
                                                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">{m.stt}</span>
                                                                <div className="flex-1 min-w-0 space-y-2">
                                                                    {m.dieuKienCham && (
                                                                        <div>
                                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Điều kiện chấm</span>
                                                                            <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5 whitespace-pre-line">{m.dieuKienCham}</p>
                                                                        </div>
                                                                    )}
                                                                    {m.yeucauMinhChung && (
                                                                        <div>
                                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Yêu cầu MC & nguyên tắc</span>
                                                                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 whitespace-pre-line bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg">{m.yeucauMinhChung}</p>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex flex-wrap gap-3 text-[11px] font-bold">
                                                                        {m.toTheoDoi && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">Tổ: {m.toTheoDoi}</span>}
                                                                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">{m.khungDiem} đ</span>
                                                                        {m.deadline && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md">Hạn: {m.deadline}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Self-score from unit */}
                                                            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Điểm tự chấm</span>
                                                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                                                        {submission.responses?.[m.id]?.selfScore ?? submission.selfPoints?.[m.id] ?? 0}
                                                                        <small className="text-xs text-gray-400 font-bold ml-1">/ {m.khungDiem}đ</small>
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Mô tả thực hiện</span>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                                                        {submission.responses?.[m.id]?.notes || submission.selfDescriptions?.[m.id] || <span className="italic text-gray-400">Không có mô tả</span>}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Evidence files */}
                                                            {(submission.responses?.[m.id]?.evidenceFiles || submission.evidenceFiles?.[m.id]) && (submission.responses?.[m.id]?.evidenceFiles || submission.evidenceFiles?.[m.id]).length > 0 && (
                                                                <div>
                                                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                                                        <MdAttachFile size={14} /> Minh chứng
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {(submission.responses?.[m.id]?.evidenceFiles || submission.evidenceFiles?.[m.id]).map((file, fIdx) => (
                                                                            <a key={fIdx} href={file.url} target="_blank" rel="noreferrer"
                                                                                className="inline-flex items-center px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all">
                                                                                {file.name}
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Right: Grading input */}
                                                        <div className="w-full lg:w-72 flex-shrink-0">
                                                            <GradeInputCard
                                                                label="Kết quả thẩm định"
                                                                maxScore={m.khungDiem}
                                                                scoreData={gradeData[m.id] || { officialScore: '', feedback: '' }}
                                                                onChange={(field, val) => handleGradeChange(m.id, field, val)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    {/* OLD FORMAT: groups → conditions (backward compat) */}
                                    {!isNewFormat && conditionsList.map((condition, idx) => (
                                        <div key={condition.id} className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 hover:bg-emerald-50/5 transition-colors">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">{idx + 1}</span>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{condition.text}</h4>
                                                </div>
                                                <div className="bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Điểm tự chấm</span>
                                                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                                                {submission.selfPoints?.[condition.id] || 0}
                                                                <small className="text-xs text-gray-400 font-bold ml-1">/ {condition.maxScore} đ</small>
                                                            </span>
                                                        </div>
                                                        <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mô tả thực hiện</span>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                                {submission.selfDescriptions?.[condition.id] || <span className="italic text-gray-400">Không có</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
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
                            )}
                        </div>
                    );
                })}

                {!hasMuc && (
                    <div className="card glass-morphism p-20 text-center">
                        <MdDescription size={64} className="text-emerald-500/20 mx-auto mb-4" />
                        <p className="text-xl font-bold text-gray-400">
                            {isStaff ? 'Bạn chưa được giao tiêu chí nào trong bộ này.' : 'Bộ tiêu chí này chưa được cấu hình chi tiết.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Sticky save */}
            {hasMuc && (
                <div className="sticky bottom-6 mt-12 z-20">
                    <div className="max-w-md mx-auto card glass-morphism p-3 border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
                        <button
                            onClick={handleSaveGrades}
                            disabled={isSaving}
                            className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                        >
                            {isSaving ? (
                                <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></span>
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
