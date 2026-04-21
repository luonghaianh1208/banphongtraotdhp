import React from 'react';
import EvidenceUpload from './EvidenceUpload';
import { MdInfoOutline } from 'react-icons/md';

const ConditionRow = ({
    condition,
    index = null,
    response = null,
    onChange = () => { },
    readOnly = false,
    showInput = false
}) => {
    return (
        <div className="relative">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                    <div className="flex items-start gap-3">
                        {index !== null && (
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                                {index + 1}
                            </span>
                        )}
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight tracking-tight">
                            {condition.text}
                        </h4>
                    </div>
                    {condition.notes && (
                        <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50/80 dark:bg-blue-900/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                            <MdInfoOutline className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-bold italic leading-relaxed">
                                {condition.notes}
                            </p>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="px-4 py-1 bg-emerald-600 dark:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg shadow-emerald-600/20">
                        Tối đa: {condition.maxScore} đ
                    </div>
                </div>
            </div>

            {showInput && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gray-50/50 dark:bg-gray-800/20 p-6 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                        <div className="lg:col-span-3">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">
                                Điểm tự chấm
                            </label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    min="0"
                                    max={condition.maxScore}
                                    step="0.5"
                                    value={response?.selfScore ?? ''}
                                    onChange={(e) => onChange('selfScore', e.target.value)}
                                    disabled={readOnly}
                                    className="input w-full pl-4 pr-12 py-3 text-lg font-black text-emerald-600 dark:text-emerald-400"
                                    placeholder="0.0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none group-focus-within:text-emerald-500 transition-colors">đ</span>
                            </div>
                        </div>

                        <div className="lg:col-span-9">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">
                                Giải trình / Minh chứng chi tiết
                            </label>
                            <textarea
                                value={response?.notes || ''}
                                onChange={(e) => onChange('notes', e.target.value)}
                                disabled={readOnly}
                                rows={2}
                                className="input w-full px-4 py-3 text-sm resize-none"
                                placeholder="Nhập lý do hoặc giải trình minh chứng cụ thể để hội đồng thẩm định ghi nhận..."
                            />
                        </div>
                    </div>

                    <div className="mt-6 ml-1">
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
                            Tệp minh chứng đính kèm
                        </label>
                        <EvidenceUpload
                            files={response?.evidenceFiles || []}
                            onChange={(newFiles) => onChange('evidenceFiles', newFiles)}
                            readOnly={readOnly}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default ConditionRow;
