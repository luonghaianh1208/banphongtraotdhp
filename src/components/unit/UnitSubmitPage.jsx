import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdAssignment, MdAccessTime, MdSave, MdSend, MdArrowBack, MdInfo, MdCheckCircle } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { getSubmissionPeriod, getCriteriaSet, createOrUpdateDraftSubmission, submitSubmission } from '../../firebase/criteriaFirestore';
import { useUnitSubmission } from '../../hooks/useSubmissions';
import ConditionRow from '../criteria/ConditionRow';

const UnitSubmitPage = () => {
    const { periodId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [period, setPeriod] = useState(null);
    const [criteriaSet, setCriteriaSet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Trạng thái cục bộ cho các câu trả lời
    const [responses, setResponses] = useState({});

    // Hook lấy dữ liệu nộp cũ của Unit (nếu có)
    const { submission, loading: subLoading } = useUnitSubmission(periodId, user?.id);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const pData = await getSubmissionPeriod(periodId);
                if (!pData) {
                    alert('Không tìm thấy đợt báo cáo!');
                    navigate('/unit/submissions');
                    return;
                }
                setPeriod(pData);

                if (pData.criteriaSetId) {
                    const cData = await getCriteriaSet(pData.criteriaSetId);
                    setCriteriaSet(cData);
                }
            } catch (err) {
                console.error('Lỗi khi tải dữ liệu báo cáo:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [periodId, navigate]);

    // Khởi tạo responses từ dữ liệu cũ nếu có
    useEffect(() => {
        if (submission && submission.responses) {
            setResponses(submission.responses);
        }
    }, [submission]);

    if (loading || subLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Đang tải dữ liệu báo cáo...</p>
            </div>
        );
    }

    if (!period || !criteriaSet) {
        return <div className="text-center mt-10 dark:text-white font-bold">Dữ liệu không hợp lệ.</div>;
    }

    const isReadOnly = period.status !== 'active' || submission?.status === 'submitted';

    const handleResponseChange = (conditionId, field, value) => {
        if (isReadOnly) return;

        setResponses(prev => ({
            ...prev,
            [conditionId]: {
                ...(prev[conditionId] || {}),
                [field]: value
            }
        }));
    };

    const handleSaveDraft = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await createOrUpdateDraftSubmission(
                periodId,
                user.id,
                { unitName: user.unitName, unitCode: user.unitCode },
                responses
            );
            alert('Đã lưu bản nháp thành công!');
        } catch (err) {
            console.error('Lỗi lưu bản nháp:', err);
            alert('Có lỗi xảy ra khi lưu bản nháp.');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        if (!window.confirm('Bạn có chắc chắn muốn nộp báo cáo chính thức? Sau khi nộp sẽ không thể chỉnh sửa.')) {
            return;
        }

        setSaving(true);
        try {
            await createOrUpdateDraftSubmission(
                periodId,
                user.id,
                { unitName: user.unitName, unitCode: user.unitCode },
                responses
            );

            if (submission?.id) {
                await submitSubmission(submission.id);
                alert('Đã nộp báo cáo chính thức thành công!');
                navigate('/unit/submissions');
            } else {
                alert('Vui lòng lưu bản nháp một lần trước khi nộp chính thức.');
            }
        } catch (err) {
            console.error('Lỗi khi nộp báo cáo:', err);
            alert('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    // Tính tổng điểm tự chấm hiện tại
    let currentTotalScore = 0;
    Object.values(responses).forEach(res => {
        currentTotalScore += (Number(res.selfScore) || 0);
    });

    return (
        <div className="max-w-6xl mx-auto pb-32 relative">
            {/* Nav Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/unit/submissions')}
                    className="p-3 rounded-2xl glass-card hover:bg-white dark:hover:bg-gray-800 transition-colors group"
                >
                    <MdArrowBack size={24} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{period.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-primary-600 dark:text-primary-400">
                            <MdAccessTime />
                            Hạn: {new Date(period.deadline).toLocaleString('vi-VN')}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <MdAssignment />
                            Năm học: {period.academicYear}
                        </div>
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
                                <span className="text-xs font-black text-gray-900 dark:text-white">{Math.round((currentTotalScore / criteriaSet.totalMaxScore) * 100)}%</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                                <div
                                    className="h-full bg-primary-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(5,150,105,0.5)]"
                                    style={{ width: `${Math.min(100, (currentTotalScore / criteriaSet.totalMaxScore) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="text-4xl font-black text-primary-600 dark:text-primary-400 whitespace-nowrap">
                            {currentTotalScore} <span className="text-lg text-gray-400 dark:text-gray-600">/ {criteriaSet.totalMaxScore}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-12">
                {criteriaSet.groups?.map((group, gIdx) => (
                    <div key={group.id} className="animate-fade-in-up" style={{ animationDelay: `${gIdx * 100}ms` }}>
                        <div className="flex items-center gap-4 mb-6 ml-1">
                            <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center font-black text-lg">
                                {gIdx + 1}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                                    {group.title}
                                </h3>
                                <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                    Điểm tối đa phần này: {group.maxScore} điểm
                                </p>
                            </div>
                        </div>

                        <div className="glass-card overflow-hidden">
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {group.conditions?.map((cond, cIdx) => (
                                    <div key={cond.id} className="p-8 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <ConditionRow
                                            index={cIdx}
                                            condition={cond}
                                            response={responses[cond.id]}
                                            onChange={(field, value) => handleResponseChange(cond.id, field, value)}
                                            readOnly={isReadOnly}
                                            showInput={true}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Actions Bar */}
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
                                {saving ? (
                                    <span className="animate-spin h-4 w-4 border-b-2 border-primary-700 rounded-full"></span>
                                ) : <MdSave size={18} />}
                                <span>Lưu nháp</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={saving}
                                className="btn-primary px-10 py-3 flex items-center gap-2 group/submit"
                            >
                                {saving ? (
                                    <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
                                ) : <MdSend size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
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

