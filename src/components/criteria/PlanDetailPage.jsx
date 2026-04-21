import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePlans } from '../../hooks/usePlans';
import { useContestEntries } from '../../hooks/useContestEntries';
import { updatePlan } from '../../firebase/criteriaFirestore';
import {
    MdArrowBack, MdInfo, MdAttachFile, MdPeople,
    MdRateReview, MdCheckCircle, MdCancel, MdPending
} from 'react-icons/md';

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
            alert(`Đã cập nhật trạng thái: ${newStatus === 'reviewed' ? 'Đã duyệt' : 'Cần sửa'}`);
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'reviewed': return <MdCheckCircle className="mr-1" />;
            case 'rejected': return <MdCancel className="mr-1" />;
            case 'submitted': return <MdPending className="mr-1" />;
            default: return <MdInfo className="mr-1" />;
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-12 px-4">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-2">
                    <Link to="/plans-manage" className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold hover:underline mb-2 transition-all">
                        <MdArrowBack className="mr-1" /> Quay lại danh sách
                    </Link>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-tight">
                        {plan.title}
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="badge badge-emerald">
                            {plan.category}
                        </span>
                        <span className={`flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${plan.status === 'reviewed' ? 'bg-emerald-500 text-white' :
                                plan.status === 'rejected' ? 'bg-red-500 text-white' :
                                    plan.status === 'submitted' ? 'bg-blue-500 text-white' :
                                        'bg-gray-500 text-white'
                            }`}>
                            {getStatusIcon(plan.status)}
                            {plan.status === 'reviewed' ? 'Đã duyệt' :
                                plan.status === 'rejected' ? 'Cần sửa' :
                                    plan.status === 'submitted' ? 'Chờ duyệt' : 'Nháp'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="card glass-morphism overflow-hidden">
                        <div className="bg-emerald-500/10 px-6 py-4 border-b border-emerald-100/20 flex items-center justify-between">
                            <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center">
                                <MdInfo className="mr-2" size={20} /> Nội dung kế hoạch
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
                                {plan.description || <span className="italic text-gray-400">Không có mô tả chi tiết.</span>}
                            </div>

                            {plan.files && plan.files.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                        <MdAttachFile className="mr-1" size={16} /> Tài liệu đính kèm
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {plan.files.map((file, idx) => (
                                            <a
                                                key={idx}
                                                href={file.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-gray-100 dark:border-gray-800 rounded-xl transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-3 group-hover:scale-110 transition-transform">
                                                    <MdAttachFile size={18} />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                                                    {file.name}
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {plan.category === 'Hội thi' && (
                        <div className="card glass-morphism overflow-hidden">
                            <div className="bg-emerald-500/10 px-6 py-4 border-b border-emerald-100/20 flex items-center justify-between">
                                <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center">
                                    <MdPeople className="mr-2" size={20} /> Danh sách thí sinh ({entries.length})
                                </h3>
                            </div>

                            <div className="p-0 overflow-x-auto">
                                {entries.length > 0 ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Họ và tên</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Chi đội / Lớp</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ngày sinh</th>
                                                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Ghi chú</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {entries.map(entry => (
                                                <tr key={entry.id} className="hover:bg-emerald-50/5 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-gray-100">{entry.fullName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{entry.classOrBranch}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{entry.dob}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 italic">{entry.note || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-12 text-center">
                                        <MdPeople size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                                        <p className="text-gray-400 font-medium font-italic">Chưa có danh sách đăng ký dự thi</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Column: Review Form */}
                <div className="lg:col-span-1">
                    <div className="card glass-morphism sticky top-24 overflow-hidden border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                        <div className="bg-emerald-600 px-6 py-4 text-white">
                            <h3 className="text-lg font-black uppercase tracking-wider flex items-center">
                                <MdRateReview className="mr-2" size={20} /> Phê duyệt & Đánh giá
                            </h3>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 ml-1">
                                    Nhận xét / Yêu cầu sửa đổi
                                </label>
                                <textarea
                                    rows="6"
                                    value={reviewNote}
                                    onChange={e => setReviewNote(e.target.value)}
                                    className="input w-full p-4 text-sm font-medium leading-relaxed resize-none"
                                    placeholder="Ghi chú phản hồi cho cơ sở nếu cần sửa đổi nội dung..."
                                ></textarea>
                            </div>

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={() => handleUpdateStatus('reviewed')}
                                    disabled={isSaving}
                                    className="btn btn-primary w-full py-4 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                >
                                    <MdCheckCircle size={22} />
                                    {isSaving ? 'Đang xử lý...' : 'Duyệt & Chấp nhận'}
                                </button>

                                <button
                                    onClick={() => handleUpdateStatus('rejected')}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-red-100 dark:border-red-900/20"
                                >
                                    <MdCancel size={20} />
                                    Từ chối / Yêu cầu sửa
                                </button>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-tighter">
                                    Thao tác này sẽ cập nhật trạng thái ngay lập tức
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanDetailPage;
