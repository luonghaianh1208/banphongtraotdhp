import { Link } from 'react-router-dom';
import { MdAssignment, MdAccessTime, MdChevronRight, MdSend } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useUnitAssignments } from '../../hooks/useAssignments';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';

const UnitSubmissionsList = () => {
    const { userProfile } = useAuth();
    const unitId = userProfile?.unitId;
    const { assignments, loading } = useUnitAssignments(unitId);
    const { criteriaSets } = useCriteriaSets();

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Đang tải danh sách...</p>
            </div>
        );
    }

    // Enrich assignments with criteria set data
    const enriched = assignments.map(a => {
        const cs = criteriaSets.find(s => s.id === a.criteriaSetId);
        return { ...a, criteriaSet: cs || null };
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Báo cáo Chỉ tiêu Thi đua</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Danh sách tiêu chí được giao cho đơn vị.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-900/30">
                    <MdSend className="text-primary-600 dark:text-primary-400" />
                    <span className="text-primary-700 dark:text-primary-300 font-bold text-sm">{enriched.length} Tiêu chí được giao</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 animate-fade-in-up">
                {enriched.length > 0 ? (
                    enriched.map(item => {
                        const cs = item.criteriaSet;
                        const deadline = cs?.tieuChi?.[0]?.noiDung?.[0]?.muc?.[0]?.deadline;
                        const totalMucs = cs?.tieuChi?.reduce((sum, tc) =>
                            sum + (tc.noiDung || []).reduce((s, nd) => s + (nd.muc || []).length, 0), 0) || 0;

                        return (
                            <div key={item.id} className="glass-card group hover:scale-[1.01] transition-all duration-300 relative overflow-hidden">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between p-8 gap-8">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                                                <MdAssignment size={20} />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {cs?.title || item.criteriaSetTitle || 'Tiêu chí'}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-1">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <MdAssignment size={18} className="text-gray-400" />
                                                <span className="text-sm font-medium">Số mục chấm: <span className="text-gray-900 dark:text-gray-200 font-bold">{totalMucs}</span></span>
                                            </div>
                                            {deadline && (
                                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                    <MdAccessTime size={18} className="text-gray-400" />
                                                    <span className="text-sm font-medium">Hạn nộp: <span className="text-red-600 dark:text-red-400 font-bold">{new Date(deadline).toLocaleDateString('vi-VN')}</span></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-4 min-w-[200px]">
                                        <Link
                                            to={`/unit/submit/${item.criteriaSetId}`}
                                            className="btn-primary py-3 px-8 w-full sm:w-auto text-center group/btn"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                Báo cáo ngay
                                                <MdChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="glass-card p-20 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                            <MdAssignment size={32} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">
                            Chưa có tiêu chí nào được giao cho đơn vị.
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mx-auto">
                            Vui lòng quay lại sau hoặc liên hệ quản trị viên.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnitSubmissionsList;
