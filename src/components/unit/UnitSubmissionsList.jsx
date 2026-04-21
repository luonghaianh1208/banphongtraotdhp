import { useSubmissionPeriods } from '../../hooks/useSubmissionPeriods';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

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
            <div className="flex justify-center items-center h-full min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const activePeriods = periods.filter(p =>
        ['active', 'published', 'locked'].includes(p.status) && isPeriodVisible(p)
    );

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Báo cáo Chỉ tiêu Thi đua</h2>
                <p className="text-gray-600 mt-1">Danh sách các đợt nộp báo cáo chỉ tiêu dành cho cơ sở.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {activePeriods.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {activePeriods.map(period => (
                            <li key={period.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800">{period.title}</h3>
                                        <div className="text-sm text-gray-500 mt-1 space-y-1">
                                            <p>Năm học: <span className="font-medium text-gray-700">{period.academicYear}</span></p>
                                            <p>Hạn nộp: <span className="font-medium text-red-600">{new Date(period.deadline).toLocaleString('vi-VN')}</span></p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-center min-w-[120px]">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium mb-3 ${period.status === 'active' ? 'bg-green-100 text-green-800' :
                                                period.status === 'locked' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {period.status === 'active' ? 'Đang mở nộp' :
                                                period.status === 'locked' ? 'Đã khóa nộp' : 'Đã công bố điểm'}
                                        </span>

                                        <Link
                                            to={`/unit/submissions/${period.id}`}
                                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark shadow-sm w-full md:w-auto text-center"
                                        >
                                            {period.status === 'active' ? 'Báo cáo ngay' : 'Xem chi tiết'}
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        Không có đợt nộp báo cáo nào đang mở.
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnitSubmissionsList;
