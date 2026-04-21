import React from 'react';

const GradeInputCard = ({
    scoreData = {},
    maxScore,
    onChange,
    readOnly = false
}) => {
    return (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm">
            <h5 className="font-semibold text-blue-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Phần chấm điểm (Dành cho cán bộ)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                        Điểm chính thức
                    </label>
                    <input
                        type="number"
                        min="0"
                        max={maxScore}
                        step="0.5"
                        value={scoreData?.officialScore ?? ''}
                        onChange={(e) => onChange('officialScore', e.target.value)}
                        disabled={readOnly}
                        className="w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        placeholder={`Tối đa ${maxScore}`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                        Nhận xét / Phản hồi
                    </label>
                    <textarea
                        value={scoreData?.feedback || ''}
                        onChange={(e) => onChange('feedback', e.target.value)}
                        disabled={readOnly}
                        rows={2}
                        className="w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
                        placeholder="Nhập phản hồi nếu bị trừ điểm, hoặc ghi chú thêm..."
                    />
                </div>
            </div>
        </div>
    );
};

export default GradeInputCard;
