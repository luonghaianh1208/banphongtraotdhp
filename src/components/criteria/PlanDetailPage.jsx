import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePlans } from '../../hooks/usePlans';
import { useContestEntries } from '../../hooks/useContestEntries';
import { updatePlan } from '../../firebase/criteriaFirestore';

const PlanDetailPage = () => {
    const { planId } = useParams();
    const navigate = useNavigate();

    const { plans, loading: plansLoading } = usePlans();
    const { entries, loading: entriesLoading } = useContestEntries(planId);

    const [plan, setPlan] = useState(null);
    const [reviewNote, setReviewNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!plansLoading && plans.length > 0) {
            const p = plans.find(x => x.id === planId);
            setPlan(p);
            if (p && p.reviewNote) setReviewNote(p.reviewNote);
        }
    }, [plans, planId, plansLoading]);

    const handleUpdateStatus = async (newStatus) => {
        if (!plan) return;
        setIsSaving(true);
        try {
            await updatePlan(plan.id, {
                status: newStatus,
                reviewNote: reviewNote,
                reviewedAt: new Date().toISOString()
            });
            alert(`Đã cập nhật trạng thái: ${newStatus}`);
            navigate('/plans-manage');
        } catch (err) {
            console.error(err);
            alert('Lỗi cập nhật');
        } finally {
            setIsSaving(false);
        }
    };

    if (plansLoading || entriesLoading || !plan) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <div className="mb-6">
                <Link to="/plans-manage" className="text-sm text-primary hover:underline mb-2 inline-block">
                    &larr; Quay lại Danh sách Kế hoạch
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{plan.title}</h2>
                        <p className="text-gray-600">Loại: {plan.category}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${plan.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                            plan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                plan.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                        }`}>
                        {plan.status === 'reviewed' ? 'Đã duyệt' :
                            plan.status === 'rejected' ? 'Cần sửa' :
                                plan.status === 'submitted' ? 'Đã nộp, chờ duyệt' : 'Đang nháp'}
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Thông tin Kế hoạch</h3>
                <div className="my-4 text-gray-700 whitespace-pre-wrap">{plan.description || 'Không có mô tả chi tiết.'}</div>

                {plan.files && plan.files.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Tài liệu đính kèm:</h4>
                        <div className="flex flex-wrap gap-2">
                            {plan.files.map((file, idx) => (
                                <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                    </svg>
                                    {file.name}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {plan.category === 'Hội thi' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Danh sách thí sinh đăng ký ({entries.length})</h3>

                    {entries.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ và tên</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chi đội / Lớp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày sinh</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {entries.map(entry => (
                                        <tr key={entry.id}>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">{entry.fullName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{entry.classOrBranch}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{entry.dob}</td>
                                            <td className="px-6 py-4">{entry.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-center py-4">Chưa có danh sách đăng ký dự thi</p>
                    )}
                </div>
            )}

            {/* Form duyệt / Thẩm định */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Phê duyệt & Đánh giá</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét / Yêu cầu sửa đổi (Nội bộ):</label>
                    <textarea
                        rows="4"
                        value={reviewNote}
                        onChange={e => setReviewNote(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                        placeholder="Nhập phản hồi cho cơ sở nếu cần..."
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => handleUpdateStatus('rejected')}
                        disabled={isSaving}
                        className="px-6 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md font-medium transition-colors"
                    >
                        Từ chối / Cần sửa
                    </button>
                    <button
                        onClick={() => handleUpdateStatus('reviewed')}
                        disabled={isSaving}
                        className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium transition-colors"
                    >
                        Duyệt & Chấp nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanDetailPage;
