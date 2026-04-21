import { Link } from 'react-router-dom';
import { MdAssignment, MdAccessTime, MdCalendarToday, MdChevronRight, MdLock } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useSubmissionPeriods } from '../../hooks/useSubmissionPeriods';

const UnitSubmissionsList = () => {
    const { periods, loading } = useSubmissionPeriods();
    const { userProfile } = useAuth();

    const unitBlockId = userProfile?.blockId;
    const unitTypeId = userProfile?.typeId;
    const unitTypeKey = `${unitBlockId}:${unitTypeId}`;

    const isPeriodVisible = (period) => {
        if (!period.targetBlocks?.length) return true;
        if (!period.targetBlocks.includes(unitBlockId)) return false;
        if (period.targetTypes?.length > 0 && !period.targetTypes.includes(unitTypeKey)) return false;
        return true;
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Đang tải danh sách...</p>
            </div>
        );
    }

    const activePeriods = periods.filter(p =>
        ['active', 'published', 'locked'].includes(p.status) && isPeriodVisible(p)
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Báo cáo Chỉ tiêu Thi đua</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Danh sách các đợt nộp báo cáo chỉ tiêu dành cho cơ sở.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-900/30">
                    <MdAssignment className="text-primary-600 dark:text-primary-400" />
                    <span className="text-primary-700 dark:text-primary-300 font-bold text-sm">{activePeriods.length} Đợt đang mở</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 animate-fade-in-up">
                {activePeriods.length > 0 ? (
                    activePeriods.map(period => (
                        <div key={period.id} className="glass-card group hover:scale-[1.01] transition-all duration-300 relative overflow-hidden">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-8 gap-8">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                                            <MdCalendarToday size={20} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {period.title}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-1">
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <MdAssignment size={18} className="text-gray-400" />
                                            <span className="text-sm font-medium">Năm học: <span className="text-gray-900 dark:text-gray-200 font-bold">{period.academicYear}</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <MdAccessTime size={18} className="text-gray-400" />
                                            <span className="text-sm font-medium">Hạn nộp: <span className="text-red-600 dark:text-red-400 font-bold">{new Date(period.deadline).toLocaleString('vi-VN')}</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4 min-w-[280px]">
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border w-full sm:w-auto justify-center ${period.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' :
                                        period.status === 'locked' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30' :
                                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
                                        }`}>
                                        {period.status === 'locked' && <MdLock size={14} />}
                                        {period.status === 'active' ? 'Đang mở nộp' :
                                            period.status === 'locked' ? 'Đã khóa nộp' : 'Đã công bố điểm'}
                                    </div>

                                    <Link
                                        to={`/unit/submit/${period.id}`}
                                        className="btn-primary py-3 px-8 w-full sm:w-auto text-center group/btn"
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            {period.status === 'active' ? 'Báo cáo ngay' : 'Xem chi tiết'}
                                            <MdChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="glass-card p-20 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                            <MdAssignment size={32} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">
                            Không có đợt nộp báo cáo nào đang mở.
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mx-auto">
                            Vui lòng quay lại sau hoặc liên hệ quản trị viên để biết thêm chi tiết.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnitSubmissionsList;
