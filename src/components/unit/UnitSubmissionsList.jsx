import { Link, useSearchParams } from 'react-router-dom';
import { MdAssignment, MdAccessTime, MdChevronRight, MdSend, MdChat } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useUnitAssignments } from '../../hooks/useAssignments';
import { useCriteriaSets } from '../../hooks/useCriteriaSets';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const UnitSubmissionsList = () => {
    const { userProfile } = useAuth();
    const unitId = userProfile?.id;
    const { assignments, loading } = useUnitAssignments(unitId);
    const { criteriaSets } = useCriteriaSets();
    const [searchParams] = useSearchParams();
    const isGiaiTrinh = searchParams.get('tab') === 'giaiTrinh';

    const [justificationMap, setJustificationMap] = useState({});
    const [jtLoading, setJtLoading] = useState(false);

    // For giải trình tab, fetch submission data to check which criteria sets have justification requests
    useEffect(() => {
        if (!isGiaiTrinh || !unitId) return;
        const fetchJustificationData = async () => {
            setJtLoading(true);
            try {
                const q = query(
                    collection(db, 'criteriaSubmissions'),
                    where('unitId', '==', unitId)
                );
                const snap = await getDocs(q);
                const map = {};
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const scores = data.gradedScores || {};
                    const jtItems = Object.values(scores).filter(s => s.justificationDeadline);
                    if (jtItems.length > 0) {
                        map[data.criteriaSetId] = {
                            totalItems: jtItems.length,
                            pendingItems: jtItems.filter(s => !data.responses?.[Object.keys(scores).find(k => scores[k] === s)]?.justificationText).length,
                            hasExpired: jtItems.some(s => new Date(s.justificationDeadline) < new Date(new Date().toDateString()))
                        };
                    }
                });
                setJustificationMap(map);
            } catch (err) {
                console.error('Error fetching justification data:', err);
            } finally {
                setJtLoading(false);
            }
        };
        fetchJustificationData();
    }, [isGiaiTrinh, unitId]);

    if (loading || jtLoading) {
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

    // For giải trình tab, filter to only criteria sets that have justification requests
    const displayItems = isGiaiTrinh
        ? enriched.filter(item => justificationMap[item.criteriaSetId])
        : enriched;

    const pageTitle = isGiaiTrinh ? 'Giải trình' : 'Bộ tiêu chí Thi đua';
    const pageDesc = isGiaiTrinh
        ? 'Danh sách bộ tiêu chí cần giải trình theo yêu cầu của cấp trên.'
        : 'Danh sách bộ tiêu chí được giao cho đơn vị.';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{pageTitle}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{pageDesc}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isGiaiTrinh
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
                    : 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-900/30'
                }`}>
                    {isGiaiTrinh ? (
                        <MdChat className="text-amber-600 dark:text-amber-400" />
                    ) : (
                        <MdSend className="text-primary-600 dark:text-primary-400" />
                    )}
                    <span className={`font-bold text-sm ${isGiaiTrinh
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-primary-700 dark:text-primary-300'
                    }`}>
                        {displayItems.length} {isGiaiTrinh ? 'Tiêu chí cần giải trình' : 'Tiêu chí được giao'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 animate-fade-in-up">
                {displayItems.length > 0 ? (
                    displayItems.map(item => {
                        const cs = item.criteriaSet;
                        const deadline = cs?.tieuChi?.[0]?.noiDung?.[0]?.muc?.[0]?.deadline;
                        const isValidDeadline = deadline && !isNaN(new Date(deadline).getTime());
                        const totalMucs = cs?.tieuChi?.reduce((sum, tc) =>
                            sum + (tc.noiDung || []).reduce((s, nd) => s + (nd.muc || []).length, 0), 0) || 0;
                        const jtInfo = justificationMap[item.criteriaSetId];

                        return (
                            <div key={item.id} className={`glass-card group hover:scale-[1.01] transition-all duration-300 relative overflow-hidden ${isGiaiTrinh ? 'border-l-4 border-l-amber-500' : ''}`}>
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between p-8 gap-8">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${isGiaiTrinh
                                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                            }`}>
                                                {isGiaiTrinh ? <MdChat size={20} /> : <MdAssignment size={20} />}
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {cs?.title || item.criteriaSetTitle || 'Tiêu chí'}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ml-1">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                <MdAssignment size={18} className="text-gray-400" />
                                                <span className="text-sm font-medium">Số mục chấm: <span className="text-gray-900 dark:text-gray-200 font-bold">{totalMucs}</span></span>
                                            </div>
                                            {isValidDeadline && (
                                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                    <MdAccessTime size={18} className="text-gray-400" />
                                                    <span className="text-sm font-medium">Hạn nộp: <span className="text-red-600 dark:text-red-400 font-bold">{new Date(deadline).toLocaleDateString('vi-VN')}</span></span>
                                                </div>
                                            )}
                                            {isGiaiTrinh && jtInfo && (
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-black rounded-full">
                                                        <MdChat size={14} />
                                                        {jtInfo.totalItems} nội dung cần GT
                                                    </span>
                                                    {jtInfo.hasExpired && (
                                                        <span className="text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Có mục hết hạn</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-4 min-w-[200px]">
                                        <Link
                                            to={`/unit/submit/${item.criteriaSetId}${isGiaiTrinh ? '?tab=giaiTrinh' : ''}`}
                                            className={`py-3 px-8 w-full sm:w-auto text-center group/btn rounded-2xl font-black text-sm transition-all ${isGiaiTrinh
                                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                                                : 'btn-primary'
                                            }`}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                {isGiaiTrinh ? 'Giải trình ngay' : 'Báo cáo ngay'}
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
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isGiaiTrinh
                            ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}>
                            {isGiaiTrinh ? <MdChat size={32} /> : <MdAssignment size={32} />}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">
                            {isGiaiTrinh
                                ? 'Chưa có yêu cầu giải trình nào từ cấp trên.'
                                : 'Chưa có tiêu chí nào được giao cho đơn vị.'}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mx-auto">
                            {isGiaiTrinh
                                ? 'Khi cấp trên yêu cầu giải trình, danh sách sẽ hiển thị ở đây.'
                                : 'Vui lòng quay lại sau hoặc liên hệ quản trị viên.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnitSubmissionsList;
