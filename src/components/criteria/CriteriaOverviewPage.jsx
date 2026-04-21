import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useSubmissionPeriods } from '../../hooks/useSubmissionPeriods';
import { useUnits } from '../../hooks/useUnits';

const CriteriaOverviewPage = () => {
    const { periodId } = useParams();
    const { periods } = useSubmissionPeriods();
    const { submissions, loading: subLoading } = useSubmissions(periodId);
    const { units, loading: unitLoading } = useUnits();

    const [searchTerm, setSearchTerm] = useState('');

    const loading = subLoading || unitLoading;
    const currentPeriod = periods.find(p => p.id === periodId);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!currentPeriod && periods.length > 0) {
        return <div className="p-8 text-center text-red-600">Không tìm thấy đợt báo cáo!</div>;
    }

    // Kết hợp data unit và submission
    // Hiển thị tất cả các unit. Nếu chưa có submission, coi như chưa nộp.
    const overviewData = units.map(unit => {
        const sub = submissions.find(s => s.unitId === unit.id);
        return {
            unit,
            submission: sub || null,
            status: sub ? sub.status : 'not_submitted',
            totalSelfScore: sub ? sub.totalSelfScore : 0,
            totalGradedScore: sub ? sub.totalGradedScore : 0
        };
    }).filter(data =>
        data.unit.unitName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <Link to="/periods" className="text-sm text-primary hover:underline mb-2 inline-block">
                        &larr; Quay lại Quản lý Đợt
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Tổng quan chấm điểm
                    </h2>
                    <p className="text-gray-600">
                        Đợt: {currentPeriod ? currentPeriod.title : 'Đang tải...'}
                    </p>
                </div>

                <div className="w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Tìm kiếm Cơ sở..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-primary focus:border-primary"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Cơ Sở (Liên đội)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái Nộp</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm tự chấm</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm thẩm định</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {overviewData.map((data) => (
                                <tr key={data.unit.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{data.unit.unitName}</div>
                                        <div className="text-xs text-gray-500">{data.unit.contactEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {data.status === 'not_submitted' && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Chưa nộp</span>}
                                        {data.status === 'draft' && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Đang nháp</span>}
                                        {data.status === 'submitted' && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đã nộp</span>}
                                        {data.status === 'graded' && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã chấm điểm</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-600">
                                        {data.status !== 'not_submitted' ? data.totalSelfScore : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-green-600">
                                        {data.status === 'graded' ? data.totalGradedScore : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        {data.submission ? (
                                            <Link
                                                to={`/criteria-detail/${periodId}/${data.submission.id}`}
                                                className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded transition-colors"
                                            >
                                                Chấm điểm
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400 italic">Chưa có bài nộp</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {overviewData.length === 0 && (
                                <tr className="border-t">
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Không tìm thấy cơ sở nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CriteriaOverviewPage;
