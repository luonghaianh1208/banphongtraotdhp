import { Link } from 'react-router-dom';
import { MdAssignment, MdStars, MdChevronRight, MdAccessTime, MdCalendarToday } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useSubmissionPeriods } from '../../hooks/useSubmissionPeriods';
import { usePlans } from '../../hooks/usePlans';

const UnitDashboard = () => {
    const { userProfile } = useAuth();
    const { periods, loading: periodsLoading } = useSubmissionPeriods();
    const { plans, loading: plansLoading } = usePlans();

    const loading = periodsLoading || plansLoading;

    const unitBlockId = userProfile?.blockId;
    const unitTypeId = userProfile?.typeId;
    const unitTypeKey = `${unitBlockId}:${unitTypeId}`;

    const isPeriodVisible = (period) => {
        if (!period.targetBlocks?.length) return true;
        if (!period.targetBlocks.includes(unitBlockId)) return false;
        if (period.targetTypes?.length > 0 && !period.targetTypes.includes(unitTypeKey)) return false;
        return true;
    };

    const isPlanVisible = (plan) => {
        if (!plan.targetBlocks?.length) return true;
        if (!plan.targetBlocks.includes(unitBlockId)) return false;
        if (plan.targetTypes?.length > 0 && !plan.targetTypes.includes(unitTypeKey)) return false;
        return true;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const activePeriods = periods.filter(p =>
        ['active', 'published'].includes(p.status) && isPeriodVisible(p)
    );
    const activePublishedPlans = plans.filter(p =>
        ['published', 'active'].includes(p.status) && isPlanVisible(p)
    );

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-10">
            {/* Hero Welcome Section */}
            <div className="relative overflow-hidden glass-card p-10 lg:p-12 border-0 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-2xl shadow-emerald-500/30">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-white/10 blur-[80px] rounded-full rotate-12 pointer-events-none" />
                <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest border border-white/20">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Cổng thông tin Cơ sở
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                        Xin chào, <br />
                        <span className="text-emerald-300">{userProfile?.unitName || 'Đơn vị'}</span>!
                    </h2>
                    <p className="text-primary-50/80 max-w-2xl text-lg font-medium leading-relaxed">
                        Chào mừng quay trở lại hệ thống quản trị thi đua. Bạn có <span className="text-white font-bold">{activePeriods.length} kỳ đánh giá</span> đang mở
                        {activePublishedPlans.length > 0 && <> và <span className="text-white font-bold">{activePublishedPlans.length} kế hoạch/hội thi</span> cần tham gia</>}.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
                {/* Widget Chỉ tiêu */}
                <div className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
                        <MdAssignment size={120} />
                    </div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <MdAssignment size={28} />
                        </div>
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200 dark:border-emerald-900/20">
                            {activePeriods.length} kỳ đang mở
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Chỉ tiêu Thi đua</h3>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-4 leading-relaxed">
                        Theo dõi và nộp báo cáo kết quả thực hiện các chỉ tiêu thi đua theo quý và năm.
                    </p>

                    {/* Quick list of active periods */}
                    {activePeriods.length > 0 && (
                        <div className="space-y-2 mb-6">
                            {activePeriods.slice(0, 3).map(p => (
                                <Link key={p.id} to={`/unit/submit/${p.id}`}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors group/item">
                                    <MdCalendarToday size={16} className="text-gray-400 group-hover/item:text-emerald-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{p.title}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                            <MdAccessTime size={12} />
                                            Hạn: {p.deadline ? new Date(p.deadline).toLocaleDateString('vi-VN') : '—'}
                                        </p>
                                    </div>
                                    <MdChevronRight size={16} className="text-gray-300 group-hover/item:text-emerald-500" />
                                </Link>
                            ))}
                        </div>
                    )}

                    <Link to="/unit/submissions"
                        className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold hover:gap-3 transition-all group/link">
                        <span>Truy cập báo cáo</span>
                        <MdChevronRight size={20} className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Widget Kế hoạch & Hội thi */}
                <div className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-slate-500">
                        <MdStars size={120} />
                    </div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400">
                            <MdStars size={28} />
                        </div>
                        <span className="bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-slate-200 dark:border-slate-800/50">
                            {activePublishedPlans.length} đang mở
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Kế hoạch & Hội thi</h3>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-4 leading-relaxed">
                        Đăng ký tham gia và nộp hồ sơ cho các kế hoạch chuyên đề, hội thi.
                    </p>

                    {/* Quick list of active plans */}
                    {activePublishedPlans.length > 0 && (
                        <div className="space-y-2 mb-6">
                            {activePublishedPlans.slice(0, 3).map(p => (
                                <Link key={p.id} to={`/unit/plans/${p.id}`}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group/item">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.type === 'contest' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{p.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {p.type === 'contest' ? 'Hội thi' : 'Kế hoạch'}
                                            {p.submissionDeadline && ` · Hạn: ${new Date(p.submissionDeadline).toLocaleDateString('vi-VN')}`}
                                        </p>
                                    </div>
                                    <MdChevronRight size={16} className="text-gray-300 group-hover/item:text-blue-500" />
                                </Link>
                            ))}
                        </div>
                    )}

                    <Link to="/unit/plans"
                        className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold hover:gap-3 transition-all group/link">
                        <span>Xem danh sách</span>
                        <MdChevronRight size={20} className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UnitDashboard;
