import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useUnitContestEntry } from '../../hooks/useContestEntries';
import {
    getPlan,
    createOrUpdateContestEntry,
    submitContestEntry
} from '../../firebase/criteriaFirestore';
import EvidenceUpload from '../criteria/EvidenceUpload';

const UnitPlanDetail = () => {
    const { planId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Custom form state để linh hoạt
    const [docsData, setDocsData] = useState([]);

    // Hook lấy data cũ đã lưu (nếu có)
    const { entry, loading: entryLoading } = useUnitContestEntry(planId, user?.id);

    useEffect(() => {
        const fetchPlanData = async () => {
            try {
                const pData = await getPlan(planId);
                if (!pData) {
                    toast.error('Không tìm thấy Kế hoạch/Hội thi này!');
                    navigate('/unit/plans');
                    return;
                }
                setPlan(pData);
            } catch (err) {
                console.error('Lỗi khi tải dữ liệu kế hoạch:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlanData();
    }, [planId, navigate]);

    useEffect(() => {
        if (entry && entry.docs) {
            setDocsData(entry.docs);
        }
    }, [entry]);

    if (loading || entryLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!plan) return null;

    const isReadOnly = entry?.status === 'submitted' || plan.status === 'locked';

    const handleSaveDraft = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await createOrUpdateContestEntry(
                planId,
                user.id,
                { unitName: user.unitName, unitCode: user.unitCode },
                docsData
            );
            toast.success('Đã lưu bản nháp thành công!');
        } catch (err) {
            console.error('Lỗi lưu bản nháp hồ sơ:', err);
            toast.error('Có lỗi xảy ra khi lưu bản nháp.');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        if (docsData.length === 0) {
            toast.error('Vui lòng đính kèm ít nhất 1 hồ sơ hoặc minh chứng trước khi nộp.');
            return;
        }

        if (!window.confirm('Bạn có chắc chắn muốn nộp chính thức? Sau khi nộp sẽ không thể chỉnh sửa hồ sơ.')) {
            return;
        }

        setSaving(true);
        try {
            // 1. Save một lần nữa để chắc chắn
            await createOrUpdateContestEntry(
                planId,
                user.id,
                { unitName: user.unitName, unitCode: user.unitCode },
                docsData
            );

            // 2. Submit (phải có entryId. Nếu chưa có là do hook chưa kịp cập nhật, ta cần đợi hoặc fallback)
            if (entry?.id) {
                await submitContestEntry(entry.id);
                toast.success('Đã nộp hồ sơ chính thức thành công!');
                navigate('/unit/plans');
            } else {
                toast.error('Hệ thống đang đồng bộ, vui lòng bấm lưu nháp trước rồi mới nộp.');
            }
        } catch (err) {
            console.error('Lỗi khi nộp hồ sơ:', err);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <button
                onClick={() => navigate('/unit/plans')}
                className="text-gray-500 hover:text-gray-800 mb-6 flex items-center font-medium"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Quay lại ds Kế hoạch
            </button>

            {/* Header Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 bg-white/20 rounded text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                            {plan.type === 'contest' ? 'Hội thi' : 'Kế hoạch'}
                        </span>
                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider backdrop-blur-sm ${entry?.status === 'submitted' ? 'bg-green-500/80' : 'bg-yellow-500/80'
                            }`}>
                            {entry?.status === 'submitted' ? 'Đã Nộp Chính Thức' : 'Đang Làm (Nháp)'}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">{plan.title}</h1>
                    <p className="text-blue-100">{plan.description}</p>
                </div>

                {plan.attachments?.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Tài liệu đính kèm từ Ban tổ chức:</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {plan.attachments.map((file, i) => (
                                <li key={i} className="flex items-center bg-white p-3 rounded border border-gray-200">
                                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    <a href={file.url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate text-sm font-medium">
                                        {file.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Upload Hồ sơ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Hồ sơ / Báo cáo của Đơn vị</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Vui lòng đính kèm các biểu mẫu, báo cáo, bài dự thi hoặc minh chứng liên quan. Hệ thống hỗ trợ đa dạng định dạng file (Word, Excel, PDF, Hình ảnh, Video, vv).
                </p>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <EvidenceUpload
                        files={docsData}
                        onChange={setDocsData}
                        readOnly={isReadOnly}
                    />
                </div>
            </div>

            {/* Actions */}
            {!isReadOnly && (
                <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto text-center"
                    >
                        Lưu Nháp
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors shadow-sm flex justify-center items-center w-full sm:w-auto"
                    >
                        {saving && <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></span>}
                        Nộp Chính Thức
                    </button>
                </div>
            )}
        </div>
    );
};

export default UnitPlanDetail;
