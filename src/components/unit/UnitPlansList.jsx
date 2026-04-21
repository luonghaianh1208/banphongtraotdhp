import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlans } from '../../hooks/usePlans';

const UnitPlansList = () => {
    const [filter, setFilter] = useState('all');
    const { plans, loading } = usePlans();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Lọc kế hoạch đang hiển thị
    const activePlans = plans.filter(p => ['published', 'active'].includes(p.status));
    const filteredPlans = filter === 'all'
        ? activePlans
        : activePlans.filter(p => p.type === filter);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Kế hoạch & Hội thi</h2>
                    <p className="text-gray-600 mt-1">Danh sách các chuyên đề, hội thi và kế hoạch cần nộp hồ sơ, báo cáo minh chứng.</p>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setFilter('plan')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'plan' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        Kế hoạch
                    </button>
                    <button
                        onClick={() => setFilter('contest')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'contest' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        Hội thi
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPlans.length > 0 ? (
                    filteredPlans.map(plan => (
                        <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4 gap-4">
                                <h3 className="text-lg font-bold text-gray-800 line-clamp-2">{plan.title}</h3>
                                <span className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap flex-shrink-0 ${plan.type === 'contest' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {plan.type === 'contest' ? 'Hội thi' : 'Kế hoạch'}
                                </span>
                            </div>

                            <div className="text-sm text-gray-600 space-y-2 mb-6 flex-1">
                                {plan.description && (
                                    <p className="line-clamp-2">{plan.description}</p>
                                )}
                                <div className="flex items-center mt-2">
                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Hạn nộp hồ sơ: <span className="ml-1 font-medium text-red-600 text-sm">
                                        {plan.submissionDeadline ? new Date(plan.submissionDeadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end">
                                <Link
                                    to={`/unit/plans/${plan.id}`}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark shadow-sm transition-colors"
                                >
                                    Tham gia
                                    <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full p-12 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-gray-500">Chưa có kế hoạch/hội thi nào phù hợp.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnitPlansList;
