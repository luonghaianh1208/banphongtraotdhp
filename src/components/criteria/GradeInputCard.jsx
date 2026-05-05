import React from 'react';
import { MdOutlineGrade, MdOutlineRateReview } from 'react-icons/md';

const GradeInputCard = ({
    scoreData = {},
    maxScore,
    onChange,
    readOnly = false,
    label = "Thẩm định điểm"
}) => {
    // Nếu scoreData là một object (officialScore, feedback) thì dùng trực tiếp
    // Nếu là một giá trị đơn (dành cho backward compatibility hoặc giản lược)
    const officialScore = typeof scoreData === 'object' ? (scoreData?.officialScore ?? '') : scoreData;
    const feedback = typeof scoreData === 'object' ? (scoreData?.feedback || '') : '';
    const requireJustification = typeof scoreData === 'object' ? (scoreData?.requireJustification || false) : false;
    const afterJustificationScore = typeof scoreData === 'object' ? (scoreData?.afterJustificationScore ?? '') : '';

    const handleValueChange = (field, value) => {
        if (typeof scoreData === 'object') {
            onChange(field, value);
        } else {
            // Nếu ban đầu là giá trị đơn, chuyển sang object khi có thay đổi
            onChange(field, value);
        }
    };

    return (
        <div className="card glass-morphism overflow-hidden border-emerald-100/20 dark:border-emerald-500/20">
            <div className="bg-emerald-500/10 px-4 py-2 border-b border-emerald-100/20">
                <h5 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center text-sm uppercase tracking-wider">
                    <MdOutlineGrade className="mr-2" size={18} />
                    {label}
                </h5>
            </div>

            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">
                        Điểm chính thức
                    </label>
                    <div className="relative group">
                        <input
                            type="number"
                            min="0"
                            max={maxScore}
                            step="0.5"
                            value={officialScore}
                            onChange={(e) => handleValueChange('officialScore', e.target.value)}
                            disabled={readOnly}
                            className="input w-full pl-4 pr-12 py-3 text-lg font-black text-emerald-600 dark:text-emerald-400"
                            placeholder={`0 / ${maxScore}`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none group-focus-within:text-emerald-500 transition-colors uppercase text-xs">Điểm</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 ml-1">
                        Phản hồi / Ghi chú
                    </label>
                    <div className="relative">
                        <textarea
                            value={feedback}
                            onChange={(e) => handleValueChange('feedback', e.target.value)}
                            disabled={readOnly}
                            rows={2}
                            className="input w-full px-4 py-3 text-sm resize-none pr-10"
                            placeholder="Nhập lý do trừ điểm hoặc ghi chú..."
                        />
                        <MdOutlineRateReview className="absolute right-3 top-3 text-gray-400" size={18} />
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <input
                        type="checkbox"
                        id="requireJustification"
                        checked={requireJustification}
                        onChange={(e) => handleValueChange('requireJustification', e.target.checked)}
                        disabled={readOnly}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="requireJustification" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                        Yêu cầu giải trình
                    </label>
                </div>

                {requireJustification && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <label className="block text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2 ml-1">
                            Điểm sau giải trình
                        </label>
                        <div className="relative group">
                            <input
                                type="number"
                                min="0"
                                max={maxScore}
                                step="0.5"
                                value={afterJustificationScore}
                                onChange={(e) => handleValueChange('afterJustificationScore', e.target.value)}
                                disabled={readOnly}
                                className="input w-full pl-4 pr-12 py-3 text-lg font-black text-amber-600 dark:text-amber-500 border-amber-200 focus:border-amber-500 focus:ring-amber-500/20"
                                placeholder={`0 / ${maxScore}`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none transition-colors uppercase text-xs">Điểm</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GradeInputCard;
