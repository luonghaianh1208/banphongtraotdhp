import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUnitSubmission } from '../../hooks/useSubmissions';
import ConditionRow from '../criteria/ConditionRow';
import {
    getSubmissionPeriod,
    getCriteriaSet,
    createOrUpdateDraftSubmission,
    submitSubmission
} from '../../firebase/criteriaFirestore';

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
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!period || !criteriaSet) {
        return <div className="text-center mt-10">Dữ liệu không hợp lệ.</div>;
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
            // 1. Chắc chắn đã lưu lần cuối
            await createOrUpdateDraftSubmission(
                periodId,
                user.id,
                { unitName: user.unitName, unitCode: user.unitCode },
                responses
            );

            // 2. Nếu đã có subId thì nộp luôn, nếu không thì lấy ID mới tạo để submit
            // Vì hook `useUnitSubmission` subscribe realtime, `submission` có thể chưa cập nhật kip nếu vừa tạo
            // (Trong thực tế nên refactor `createOrUpdateDraftSubmission` trả về docRef/ID)
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
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{period.title}</h2>
                        <p className="text-gray-500 mt-2">Năm học: {period.academicYear} • Hạn nộp: {new Date(period.deadline).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${submission?.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                period.status !== 'active' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                            }`}>
                            {submission?.status === 'submitted' ? 'Đã Nộp Chính Thức' :
                                period.status !== 'active' ? 'Đã Khóa Nộp' : 'Đang Làm (Nháp)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tóm tắt */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 flex justify-between items-center shadow-sm">
                <div>
                    <h3 className="font-semibold text-blue-900">Tổng điểm tự chấm hiện tại</h3>
                    <p className="text-blue-700 text-sm mt-1">Hệ thống sẽ tự động cộng dồn các điểm thành phần ở dưới.</p>
                </div>
                <div className="text-3xl font-bold text-blue-700">
                    {currentTotalScore} / {criteriaSet.totalMaxScore}
                </div>
            </div>

            {/* Danh sách các chuyên đề / Tiêu chí */}
            <div className="space-y-6">
                {criteriaSet.groups?.map((group, gIdx) => (
                    <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">
                                Phần {gIdx + 1}: {group.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Tổng điểm phần này: {group.maxScore} điểm</p>
                        </div>
                        <div className="p-6 bg-white space-y-6">
                            {group.conditions?.map((cond, cIdx) => (
                                <ConditionRow
                                    key={cond.id}
                                    index={cIdx}
                                    condition={cond}
                                    response={responses[cond.id]}
                                    onChange={(field, value) => handleResponseChange(cond.id, field, value)}
                                    readOnly={isReadOnly}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Hành động */}
            {!isReadOnly && (
                <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/unit/submissions')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        disabled={saving}
                    >
                        Hủy và Quay lại
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center"
                    >
                        {saving ? (
                            <span className="animate-spin h-4 w-4 border-b-2 border-blue-700 rounded-full mr-2"></span>
                        ) : null}
                        Lưu Bản Nháp
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center shadow-sm"
                    >
                        {saving ? (
                            <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></span>
                        ) : null}
                        Nộp Chính Thức
                    </button>
                </div>
            )}
        </div>
    );
};

export default UnitSubmitPage;
