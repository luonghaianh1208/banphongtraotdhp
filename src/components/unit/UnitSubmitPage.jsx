import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MdAssignment, MdAccessTime, MdSave, MdSend, MdArrowBack, MdCheckCircle, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { getCriteriaSet, saveUnitCriteriaResponse, submitCriteriaSubmission, subscribeToUnitCriteriaSubmission } from '../../firebase/criteriaFirestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import EvidenceUpload from '../criteria/EvidenceUpload';

const UnitSubmitPage = () => {
    const { criteriaSetId } = useParams();
    const navigate = useNavigate();
    const { userProfile } = useAuth();

    const [criteriaSet, setCriteriaSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedTC, setExpandedTC] = useState({});
    const [responses, setResponses] = useState({});
    const [submissionStatus, setSubmissionStatus] = useState(null);
    const [assignmentRevoked, setAssignmentRevoked] = useState(false);

    // Load criteria set
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
                const exp = {};
                (cData.tieuChi || cData.groups || []).forEach(tc => { exp[tc.id] = true; });
                setExpandedTC(exp);
            } catch (err) {
                console.error('Lỗi khi tải dữ liệu:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [criteriaSetId, navigate]);

    // Check assignment status (revoked = locked)
    useEffect(() => {
        if (!criteriaSetId || !userProfile?.unitId) return;
        const checkAssignment = async () => {
            try {
                const q2 = query(
                    collection(db, 'criteriaAssignments'),
                    where('criteriaSetId', '==', criteriaSetId),
                    where('unitId', '==', userProfile.unitId)
                );
                const snap = await getDocs(q2);
                if (!snap.empty) {
                    const assignment = snap.docs[0].data();
                    setAssignmentRevoked(assignment.status === 'revoked');
                }
            } catch (err) {
                console.error('Lỗi kiểm tra assignment:', err);
            }
        };
        checkAssignment();
    }, [criteriaSetId, userProfile?.unitId]);

    // Subscribe to existing submission
    useEffect(() => {
        if (!criteriaSetId || !userProfile?.unitId) return;
        const unsub = subscribeToUnitCriteriaSubmission(criteriaSetId, userProfile.unitId,
            (sub) => {
                if (sub) {
                    setResponses(prev => {
                        // Only set if we haven't modified locally yet
                        if (Object.keys(prev).length === 0 && sub.responses) return sub.responses;
                        return prev;
                    });
                    setSubmissionStatus(sub.status);
                }
            },
            (err) => console.error(err)
        );
        return unsub;
    }, [criteriaSetId, userProfile?.unitId]);

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

    const isReadOnly = submissionStatus === 'submitted' || submissionStatus === 'graded' || assignmentRevoked;
    const isNewFormat = !!criteriaSet.tieuChi;
    const tieuChiList = criteriaSet.tieuChi || criteriaSet.groups || [];

    const toggleTC = (tcId) => setExpandedTC(prev => ({ ...prev, [tcId]: !prev[tcId] }));

    const handleResponseChange = (mucId, field, value) => {
        if (isReadOnly) return;
        setResponses(prev => ({
            ...prev,
            [mucId]: { ...(prev[mucId] || {}), [field]: value }
        }));
    };

    // Calculate total self score
    let currentTotalScore = 0;
    Object.values(responses).forEach(res => {
        currentTotalScore += (Number(res.selfScore) || 0);
    });

    const handleSaveDraft = async () => {
        if (!userProfile) return;
        if (assignmentRevoked) { toast.error('Đợt nộp đã bị thu hồi, không thể lưu.'); return; }
        setSaving(true);
        try {
            await saveUnitCriteriaResponse(
                criteriaSetId,
                userProfile.unitId,
                userProfile.unitName || userProfile.displayName,
                responses,
                currentTotalScore
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
        if (assignmentRevoked) { toast.error('Đợt nộp đã bị thu hồi, không thể nộp.'); return; }
        if (!window.confirm('Bạn có chắc chắn muốn nộp báo cáo chính thức? Sau khi nộp sẽ không thể chỉnh sửa.')) return;

        setSaving(true);
        try {
            // Save first
            await saveUnitCriteriaResponse(
                criteriaSetId,
                userProfile.unitId,
                userProfile.unitName || userProfile.displayName,
                responses,
                currentTotalScore
            );
            // Then submit
            await submitCriteriaSubmission(criteriaSetId, userProfile.unitId);
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
        <div className="max-w-6xl mx-auto pb-32 relative">
            {/* Nav Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/unit/submissions')} className="p-3 rounded-2xl glass-card hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                    <MdArrowBack size={24} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{criteriaSet.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <MdAssignment /> Năm: {criteriaSet.academicYear || '—'}
                        </div>
                        {submissionStatus && (
                            <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${submissionStatus === 'submitted' ? 'bg-blue-100 text-blue-600' :
                                submissionStatus === 'graded' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-amber-100 text-amber-600'
                                }`}>{submissionStatus === 'submitted' ? 'Đã nộp' : submissionStatus === 'graded' ? 'Đã thẩm định' : 'Bản nháp'}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Floating Score Progress */}
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
                                <span className="text-xs font-black text-gray-900 dark:text-white">{Math.round((currentTotalScore / (criteriaSet.totalMaxScore || 1)) * 100)}%</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                                <div className="h-full bg-primary-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(5,150,105,0.5)]"
                                    style={{ width: `${Math.min(100, (currentTotalScore / (criteriaSet.totalMaxScore || 1)) * 100)}%` }}>
                                </div>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-primary-600 dark:text-primary-400 whitespace-nowrap">
                            {currentTotalScore} <span className="text-lg text-gray-400 dark:text-gray-600">/ {criteriaSet.totalMaxScore}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3-level sections */}
            <div className="space-y-8">
                {tieuChiList.map((tc, tcIdx) => {
                    const isOpen = expandedTC[tc.id];
                    const noiDungList = isNewFormat ? (tc.noiDung || []) : [];
                    const conditionsList = !isNewFormat ? (tc.conditions || []) : [];
                    const tcScore = tc.totalScore || tc.maxScore || 0;

                    return (
                        <div key={tc.id} className="animate-fade-in-up" style={{ animationDelay: `${tcIdx * 80}ms` }}>
                            {/* TC Header */}
                            <div
                                className="flex items-center gap-4 mb-4 cursor-pointer group"
                                onClick={() => toggleTC(tc.id)}
                            >
                                <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                                    {tcIdx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase truncate">{tc.title}</h3>
                                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400">Tối đa: {tcScore} điểm</p>
                                </div>
                                {isOpen ? <MdExpandLess size={28} className="text-gray-400" /> : <MdExpandMore size={28} className="text-gray-400" />}
                            </div>

                            {isOpen && (
                                <div className="glass-card overflow-hidden">
                                    {/* NEW FORMAT: tieuChi → noiDung → muc */}
                                    {isNewFormat && noiDungList.map(nd => (
                                        <div key={nd.id} className="p-5 space-y-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                            <h4 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-tight flex items-center gap-2 px-1">
                                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                {nd.title}
                                            </h4>

                                            <div className="space-y-4">
                                                {(nd.muc || []).map(m => {
                                                    const res = responses[m.id] || {};
                                                    return (
                                                        <div key={m.id} className="bg-gray-50/80 dark:bg-gray-800/30 rounded-2xl p-5 border border-gray-100 dark:border-gray-800/50 space-y-4">
                                                            <div className="flex items-start gap-3">
                                                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">{m.stt}</span>
                                                                <div className="flex-1 min-w-0 space-y-2">
                                                                    {m.dieuKienCham && (
                                                                        <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold whitespace-pre-line">{m.dieuKienCham}</p>
                                                                    )}
                                                                    {m.yeucauMinhChung && (
                                                                        <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg whitespace-pre-line">{m.yeucauMinhChung}</div>
                                                                    )}
                                                                    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                                                                        {m.toTheoDoi && <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">Tổ: {m.toTheoDoi}</span>}
                                                                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">Tối đa: {m.khungDiem}đ</span>
                                                                        {m.deadline && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md">Hạn: {m.deadline}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800/50">
                                                                <div className="lg:col-span-3">
                                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Điểm tự chấm</label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="number" min="0" max={m.khungDiem} step="0.5"
                                                                            value={res.selfScore ?? ''}
                                                                            onChange={(e) => handleResponseChange(m.id, 'selfScore', e.target.value)}
                                                                            disabled={isReadOnly}
                                                                            className="input w-full pl-4 pr-10 py-3 text-lg font-black text-emerald-600 dark:text-emerald-400"
                                                                            placeholder="0"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">đ</span>
                                                                    </div>
                                                                </div>
                                                                <div className="lg:col-span-9">
                                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Giải trình / Minh chứng chi tiết</label>
                                                                    <textarea
                                                                        value={res.notes || ''}
                                                                        onChange={(e) => handleResponseChange(m.id, 'notes', e.target.value)}
                                                                        disabled={isReadOnly}
                                                                        rows={2}
                                                                        className="input w-full px-4 py-3 text-sm resize-none"
                                                                        placeholder="Nhập giải trình hoặc mô tả minh chứng..."
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="ml-1">
                                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Tệp minh chứng đính kèm</label>
                                                                <EvidenceUpload
                                                                    files={res.evidenceFiles || []}
                                                                    onChange={(newFiles) => handleResponseChange(m.id, 'evidenceFiles', newFiles)}
                                                                    readOnly={isReadOnly}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {/* OLD FORMAT: groups → conditions (backward compat) */}
                                    {!isNewFormat && (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {conditionsList.map((cond, cIdx) => {
                                                const res = responses[cond.id] || {};
                                                return (
                                                    <div key={cond.id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors space-y-4">
                                                        <div className="flex items-start gap-3">
                                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">{cIdx + 1}</span>
                                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{cond.text}</h4>
                                                        </div>
                                                        <div className="px-4 py-1 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-full w-fit">Tối đa: {cond.maxScore} đ</div>
                                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800/50">
                                                            <div className="lg:col-span-3">
                                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Điểm tự chấm</label>
                                                                <input
                                                                    type="number" min="0" max={cond.maxScore} step="0.5"
                                                                    value={res.selfScore ?? ''}
                                                                    onChange={(e) => handleResponseChange(cond.id, 'selfScore', e.target.value)}
                                                                    disabled={isReadOnly}
                                                                    className="input w-full py-3 text-lg font-black text-emerald-600 dark:text-emerald-400"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div className="lg:col-span-9">
                                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Giải trình</label>
                                                                <textarea
                                                                    value={res.notes || ''}
                                                                    onChange={(e) => handleResponseChange(cond.id, 'notes', e.target.value)}
                                                                    disabled={isReadOnly} rows={2}
                                                                    className="input w-full px-4 py-3 text-sm resize-none"
                                                                    placeholder="Nhập giải trình..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <EvidenceUpload
                                                            files={res.evidenceFiles || []}
                                                            onChange={(newFiles) => handleResponseChange(cond.id, 'evidenceFiles', newFiles)}
                                                            readOnly={isReadOnly}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Floating Actions Bar */}
            {!isReadOnly && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
                    <div className="glass-card p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-2xl border border-primary-500/30 flex justify-between items-center gap-4">
                        <button type="button" onClick={() => navigate('/unit/submissions')} className="px-6 py-3 text-gray-500 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors" disabled={saving}>
                            Quay lại
                        </button>
                        <div className="flex gap-4">
                            <button type="button" onClick={handleSaveDraft} disabled={saving}
                                className="px-8 py-3 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-all flex items-center gap-2">
                                {saving ? <span className="animate-spin h-4 w-4 border-b-2 border-primary-700 rounded-full"></span> : <MdSave size={18} />}
                                <span>Lưu</span>
                            </button>
                            <button type="button" onClick={handleSubmit} disabled={saving}
                                className="btn-primary px-10 py-3 flex items-center gap-2 group/submit">
                                {saving ? <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span> : <MdSend size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
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
