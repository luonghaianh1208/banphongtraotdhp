import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { updateSubmission } from '../../firebase/criteriaFirestore';
import GradeInputCard from './GradeInputCard';
import ConditionRow from './ConditionRow';

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
            if (sub && sub.gradedPoints) {
                setGradeData(sub.gradedPoints);
            } else if (sub && sub.selfPoints) {
                // Nếu chưa từng chấm, có thể lấy điểm tự chấm làm điểm mặc định (tuỳ workflow)
                setGradeData({});
            }
        }
    }, [subLoading, submissions, submissionId]);

    useEffect(() => {
        if (!criteriaLoading && submission && criteriaSets.length > 0) {
            // Find the period to get criteriaSetId
            // Or if submission has criteriaSetId (it should have copied it from period)
            // Giả sử criteriaSetId có trong submission (nếu không, cần load period để lấy)
            const set = criteriaSets.find(c => c.id === submission.criteriaSetId);
            setCriteriaSet(set);
        }
    }, [criteriaLoading, submission, criteriaSets]);

    const handleGradeChange = (conditionId, value) => {
        setGradeData(prev => ({ ...prev, [conditionId]: value === '' ? '' : Number(value) }));
    };

    const handleSaveGrades = async () => {
        if (!submission) return;
        setIsSaving(true);
        try {
            // Calculate total graded score
            let total = 0;
            Object.values(gradeData).forEach(val => {
                if (typeof val === 'number') total += val;
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <Link to={`/criteria-overview/${periodId}`} className="text-sm text-primary hover:underline mb-2 inline-block">
                        &larr; Quay lại Danh sách Cơ sở
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Thẩm định điểm: {submission.unitName || 'Cơ sở'}
                    </h2>
                    <p className="text-gray-600">Đợt báo cáo: {submission.periodTitle}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Tổng điểm tự chấm</div>
                    <div className="text-2xl font-bold text-gray-800">{submission.totalSelfScore}</div>
                </div>
            </div>

            <div className="space-y-8">
                {criteriaSet.groups?.map(group => (
                    <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800">{group.title}</h3>
                            {group.description && <p className="text-sm text-gray-600 mt-1">{group.description}</p>}
                        </div>

                        <div className="divide-y divide-gray-100">
                            {group.conditions?.map(condition => (
                                <div key={condition.id} className="p-6 flex flex-col lg:flex-row gap-6">
                                    {/* Cột Chi tiết Tiêu chí & Minh chứng */}
                                    <div className="flex-1">
                                        <ConditionRow condition={condition} />

                                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <h4 className="text-sm font-semibold text-blue-800 mb-2">Chi tiết tự chấm của cơ sở:</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                                <div>
                                                    <span className="text-gray-500">Điểm tự chấm: </span>
                                                    <span className="font-bold text-gray-800">{submission.selfPoints?.[condition.id] || 0} / {condition.maxScore}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Mô tả thực hiện: </span>
                                                    <span className="text-gray-800">{submission.selfDescriptions?.[condition.id] || 'Không có mô tả'}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-gray-500 text-sm">Minh chứng đính kèm: </span>
                                                {submission.evidenceFiles?.[condition.id] && submission.evidenceFiles[condition.id].length > 0 ? (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {submission.evidenceFiles[condition.id].map((file, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center px-3 py-1 bg-white border border-blue-200 rounded text-xs text-blue-600 hover:bg-blue-100"
                                                            >
                                                                📎 {file.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-800 text-sm">Không có minh chứng</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cột Nhập điểm Thẩm định */}
                                    <div className="w-full lg:w-64">
                                        <GradeInputCard
                                            label="Điểm thẩm định"
                                            maxScore={condition.maxScore}
                                            value={gradeData[condition.id] !== undefined ? gradeData[condition.id] : ''}
                                            onChange={(val) => handleGradeChange(condition.id, val)}
                                            placeholder="Nhập điểm..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {(!criteriaSet.groups || criteriaSet.groups.length === 0) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                        Bộ tiêu chí này chưa có cấu hình chi tiết (groups).
                    </div>
                )}
            </div>

            {criteriaSet.groups && criteriaSet.groups.length > 0 && (
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSaveGrades}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-sm transition-colors flex items-center"
                    >
                        {isSaving && <span className="animate-spin h-5 w-5 border-b-2 border-white rounded-full mr-2"></span>}
                        Lưu Điểm Thẩm Định & Hoàn Thành
                    </button>
                </div>
            )}
        </div>
    );
};

export default CriteriaDetailPage;
