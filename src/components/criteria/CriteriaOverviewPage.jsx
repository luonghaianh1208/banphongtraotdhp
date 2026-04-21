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

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-emerald-200 dark:border-emerald-900/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );

    if (!currentPeriod && periods.length > 0) {
        return (
            <div className="card p-12 text-center">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Không tìm thấy đợt báo cáo!</h3>
                <Link to="/periods" className="btn btn-primary inline-flex items-center gap-2 mt-2">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

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

    const statusMap = {
        not_submitted: { label: 'Chưa nộp', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
        draft: { label: 'Đang nháp', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
        submitted: { label: 'Đã nộp', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
        graded: { label: 'Đã thẩm định', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
    };

    return (
        <div className="space-y-6">
            <div className="mb-6 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
                <div className="space-y-3">
                    <Link to="/periods" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:gap-3 transition-all duration-300 group">
                        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                        Quay lại Quản lý Đợt
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Tổng quan chấm điểm</h2>
                        <div className="mt-1 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Đợt: <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentPeriod?.title}</span></span>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-96 relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm Cơ sở (Liên đội)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input w-full pl-11"
                    />
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên Cơ Sở (Liên đội)</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái Nộp</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Tự chấm</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Thẩm định</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {overviewData.map((data) => (
                                <tr key={data.unit.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-200">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            {data.unit.unitName}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{data.unit.contactEmail}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span className={`badge ${statusMap[data.status]?.color} px-3 py-1 shadow-sm`}>
                                                {statusMap[data.status]?.label}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                                        <span className={data.status !== 'not_submitted' ? 'bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg' : 'text-slate-300 dark:text-slate-700'}>
                                            {data.status !== 'not_submitted' ? data.totalSelfScore : '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                                        {data.status === 'graded' ? (
                                            <span className="bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                                {data.totalGradedScore}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-700">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                            {data.submission ? (
                                                <Link
                                                    to={`/criteria-detail/${periodId}/${data.submission.id}`}
                                                    className="btn btn-primary px-4 py-1.5 text-xs font-bold flex items-center gap-2"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Thẩm định
                                                </Link>
                                            ) : (
                                                <span className="text-xs font-medium text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    Chưa có bài nộp
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {overviewData.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">Không tìm thấy cơ sở nào phù hợp.</p>
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
