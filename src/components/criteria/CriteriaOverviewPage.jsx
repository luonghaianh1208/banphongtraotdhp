import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdSearch, MdClose, MdAssignment, MdGrade } from 'react-icons/md';
import { useSetAssignments } from '../../hooks/useAssignments';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { subscribeToAllCriteriaSubmissions, gradeCriteriaSubmission } from '../../firebase/criteriaFirestore';
import toast from 'react-hot-toast';

const CriteriaOverviewPage = () => {
    const { criteriaSetId } = useParams();
    const navigate = useNavigate();
    const { criteriaSets } = useCriteriaSets();
    const { assignments } = useSetAssignments(criteriaSetId);
    const [submissions, setSubmissions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [gradingUnit, setGradingUnit] = useState(null); // unitId being graded
    const [gradedScores, setGradedScores] = useState({});
    const [gradedComment, setGradedComment] = useState('');
    const [isSavingGrade, setIsSavingGrade] = useState(false);

    const criteriaSet = criteriaSets.find(s => s.id === criteriaSetId);

    // Subscribe to submissions for this criteria set
    useEffect(() => {
        if (!criteriaSetId) return;
        const unsub = subscribeToAllCriteriaSubmissions(criteriaSetId,
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

    // Build overview: each assigned unit with their submission status
    const activeAssignments = assignments.filter(a => a.status === 'active');
    const overviewData = activeAssignments
        .map(a => {
            const sub = submissions.find(s => s.unitId === a.unitId);
            return {
                assignment: a,
                submission: sub || null,
                status: sub ? sub.status : 'not_submitted',
                totalSelfScore: sub ? (sub.totalSelfScore || 0) : 0,
                totalGradedScore: sub ? (sub.totalGradedScore || null) : null,
            };
        })
        .filter(d => d.assignment.unitName.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusMap = {
        not_submitted: { label: 'Chưa nộp', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
        draft: { label: 'Đang nháp', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
        submitted: { label: 'Đã nộp', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
        graded: { label: 'Đã thẩm định', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
    };

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
                    <button onClick={() => navigate('/criteria-sets')} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:gap-3 transition-all duration-300 group">
                        <MdArrowBack size={16} className="transition-transform group-hover:-translate-x-1" />
                        Quay lại Quản lý Bộ tiêu chí
                    </button>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">{criteriaSet.title}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {criteriaSet.description || 'Tổng quan nộp báo cáo theo đơn vị.'}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{activeAssignments.length}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Đơn vị</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
                        <p className="text-2xl font-black text-blue-600">{overviewData.filter(d => d.status === 'submitted').length}</p>
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Đã nộp</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
                        <p className="text-2xl font-black text-emerald-600">{overviewData.filter(d => d.status === 'graded').length}</p>
                        <p className="text-[10px] font-bold text-emerald-400 uppercase">Đã thẩm định</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-800">
                        <p className="text-2xl font-black text-slate-500">{overviewData.filter(d => d.status === 'not_submitted').length}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Chưa nộp</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 shadow-sm max-w-md">
                <MdSearch size={18} className="text-gray-400" />
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                    placeholder="Tìm đơn vị..."
                />
                {searchTerm && <button onClick={() => setSearchTerm('')}><MdClose size={16} className="text-gray-400 hover:text-red-500" /></button>}
            </div>

            {/* Unit list */}
            <div className="space-y-4">
                {overviewData.map(d => {
                    const st = statusMap[d.status];
                    const isGrading = gradingUnit === d.assignment.unitId;
                    const tieuChiList = criteriaSet.tieuChi || criteriaSet.groups || [];

                    return (
                        <div key={d.assignment.id} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                        <MdAssignment size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{d.assignment.unitName}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                                            {d.totalSelfScore > 0 && <span className="text-xs font-bold text-gray-400">Tự chấm: {d.totalSelfScore}đ</span>}
                                            {d.totalGradedScore !== null && <span className="text-xs font-bold text-emerald-600">Thẩm định: {d.totalGradedScore}đ</span>}
                                        </div>
                                    </div>
                                </div>

                                {d.submission && d.status !== 'not_submitted' && (
                                    <button
                                        onClick={() => {
                                            if (isGrading) { setGradingUnit(null); return; }
                                            setGradingUnit(d.assignment.unitId);
                                            // Pre-fill graded scores if already graded
                                            if (d.submission.gradedScores) setGradedScores(d.submission.gradedScores);
                                            if (d.submission.gradedComment) setGradedComment(d.submission.gradedComment);
                                        }}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        <MdGrade size={14} />
                                        {isGrading ? 'Đóng' : d.status === 'graded' ? 'Xem/Sửa điểm' : 'Thẩm định'}
                                    </button>
                                )}
                            </div>

                            {/* Grading panel expanded */}
                            {isGrading && d.submission && (
                                <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4 animate-fade-in-up">
                                    <p className="text-xs font-black uppercase text-gray-400">Chi tiết bài nộp & Chấm điểm</p>

                                    {tieuChiList.map(tc => (
                                        <div key={tc.id} className="space-y-2">
                                            <h5 className="text-sm font-black text-gray-700 dark:text-gray-200">{tc.title}</h5>
                                            {(tc.noiDung || []).map(nd => (
                                                <div key={nd.id}>
                                                    {(nd.muc || []).map(m => {
                                                        const res = d.submission.responses?.[m.id] || {};
                                                        return (
                                                            <div key={m.id} className="grid grid-cols-12 gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0 text-sm">
                                                                <div className="col-span-5 text-gray-600 dark:text-gray-300 text-xs">{m.dieuKienCham || `Mục ${m.stt}`}</div>
                                                                <div className="col-span-2 text-center">
                                                                    <span className="text-xs text-gray-400">Tự chấm:</span>
                                                                    <span className="font-bold text-blue-600 ml-1">{res.selfScore || '—'}</span>
                                                                </div>
                                                                <div className="col-span-2 text-center text-xs text-gray-400 truncate" title={res.notes}>{res.notes || '—'}</div>
                                                                <div className="col-span-3">
                                                                    <input
                                                                        type="number" min="0" max={m.khungDiem} step="0.5"
                                                                        value={gradedScores[m.id] ?? ''}
                                                                        onChange={e => setGradedScores(p => ({ ...p, [m.id]: e.target.value }))}
                                                                        className="input w-full text-xs py-1 text-center font-bold text-emerald-600"
                                                                        placeholder={`/${m.khungDiem}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Nhận xét</label>
                                        <textarea
                                            value={gradedComment}
                                            onChange={e => setGradedComment(e.target.value)}
                                            rows={2}
                                            className="input w-full text-sm"
                                            placeholder="Nhận xét chung..."
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleGrade(d.submission.id)}
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
