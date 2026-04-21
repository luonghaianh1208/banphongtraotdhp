import React from 'react';
import EvidenceUpload from './EvidenceUpload';

const ConditionRow = ({
    condition,
    index,
    response = {},
    onChange,
    readOnly = false
}) => {
    return (
        <div className="p-4 border rounded-lg bg-white mb-4 shadow-sm border-gray-200">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-800 text-base">
                        {index + 1}. {condition.text}
                    </h4>
                    {condition.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic border-l-2 border-gray-300 pl-2">
                            Ghi chú: {condition.notes}
                        </p>
                    )}
                </div>
                <div className="ml-2 px-3 py-1 bg-green-50 text-green-700 font-semibold rounded whitespace-nowrap">
                    Tối đa: {condition.maxScore} đ
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 rounded-md border border-gray-100">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Điểm tự chấm
                    </label>
                    <input
                        type="number"
                        min="0"
                        max={condition.maxScore}
                        step="0.5"
                        value={response?.selfScore ?? ''}
                        onChange={(e) => onChange('selfScore', e.target.value)}
                        disabled={readOnly}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                        placeholder="0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giải trình / Ghi chú thêm
                    </label>
                    <textarea
                        value={response?.notes || ''}
                        onChange={(e) => onChange('notes', e.target.value)}
                        disabled={readOnly}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                        placeholder="Nhập lý do hoặc giải trình minh chứng..."
                    />
                </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minh chứng đính kèm
                </label>
                <EvidenceUpload
                    files={response?.evidenceFiles || []}
                    onChange={(newFiles) => onChange('evidenceFiles', newFiles)}
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
};

export default ConditionRow;
