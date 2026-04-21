import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd } from 'react-icons/md';
import { usePlans } from '../../hooks/usePlans';
import { useUnits } from '../../hooks/useUnits';
import { UNIT_BLOCKS } from '../../utils/constants';
import toast from 'react-hot-toast';

const PlansManagePage = () => {
    const { plans, loading: plansLoading } = usePlans();
    const { units, loading: unitsLoading } = useUnits();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        targetBlocks: [],
        targetTypes: [],
    });

    const loading = plansLoading || unitsLoading;

    const filteredPlans = plans.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getUnitName = (unitId) => {
        const u = units.find(u => u.id === unitId);
        return u ? u.unitName : 'Cơ sở không xác định';
    };

    const getBlockLabel = (plan) => {
        if (!plan.targetBlocks?.length) return 'Tất cả khối';
        return `${plan.targetBlocks.length} khối, ${plan.targetTypes?.length || 0} loại`;
    };

    const handleBlockToggle = (blockId) => {
        setFormData(prev => ({
            ...prev,
            targetBlocks: prev.targetBlocks.includes(blockId)
                ? prev.targetBlocks.filter(id => id !== blockId)
                : [...prev.targetBlocks, blockId],
        }));
    };

    const handleTypeToggle = (blockId, typeId) => {
        setFormData(prev => {
            const key = `${blockId}:${typeId}`;
            return {
                ...prev,
                targetTypes: prev.targetTypes.includes(key)
                    ? prev.targetTypes.filter(t => t !== key)
                    : [...prev.targetTypes, key],
            };
        });
    };

    const isTypeSelected = (blockId, typeId) => {
        return formData.targetTypes.includes(`${blockId}:${typeId}`);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.title) {
            toast.error('Vui lòng nhập tên kế hoạch');
            return;
        }
        setIsSubmitting(true);
        try {
            // TODO: gọi hàm tạo plan trong criteriaFirestore
            console.log('[Create Plan]', formData);
            toast.success('Tạo kế hoạch thành công! (Đang phát triển)');
            setShowAddModal(false);
            setFormData({ title: '', category: '', targetBlocks: [], targetTypes: [] });
        } catch (err) {
            toast.error('Lỗi tạo kế hoạch: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý Kế hoạch & Hội thi</h2>
                    <p className="text-gray-600">Xem và đánh giá các kế hoạch/hồ sơ hội thi do cơ sở nạp lên.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary bg-white"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="submitted">Chờ duyệt (Đã nộp)</option>
                        <option value="reviewed">Đã duyệt</option>
                        <option value="rejected">Cần sửa (Từ chối)</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo Tên kế hoạch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 border border-gray-300 rounded-md px-4 py-2 focus:ring-primary focus:border-primary"
                    />
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded shadow-sm font-medium transition-colors flex items-center gap-1 justify-center"
                    >
                        <MdAdd size={18} /> Thêm Kế hoạch
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Kế hoạch / Hội thi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị (Cơ sở)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại (Category)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giao cho</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredPlans.map(plan => (
                                <tr key={plan.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{plan.title}</div>
                                        <div className="text-xs text-gray-400">Nộp lúc: {plan.submittedAt ? new Date(plan.submittedAt).toLocaleDateString('vi-VN') : '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {getUnitName(plan.unitId)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-medium rounded bg-purple-50 text-purple-700">
                                            {plan.category || 'Khác'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-blue-600">
                                        {getBlockLabel(plan)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${plan.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                                                plan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {plan.status === 'reviewed' ? 'Đã duyệt' :
                                                plan.status === 'rejected' ? 'Cần sửa' : 'Chờ duyệt'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <Link
                                            to={`/plans/${plan.id}`}
                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors"
                                        >
                                            {plan.status === 'submitted' ? 'Duyệt bài' : 'Xem chi tiết'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredPlans.length === 0 && (
                                <tr className="border-t">
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        Không có kế hoạch nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal tạo kế hoạch */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Thêm Kế hoạch / Hội thi Mới</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên kế hoạch / hội thi</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                    placeholder="VD: Hội thi Dân vũ cấp huyện 2025"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại (Category)</label>
                                <input
                                    value={formData.category}
                                    onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                    placeholder="VD: Hội thi, Kế hoạch, Sinh hoạt"
                                />
                            </div>

                            {/* Chọn Khối / Loại được nhận kế hoạch */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Giao cho Khối/Loại nào</label>
                                <p className="text-xs text-gray-500 mb-3">Để trống = áp dụng cho tất cả. Chọn cụ thể = chỉ cơ sở thuộc khối/loại đó mới thấy.</p>
                                <div className="space-y-3 border rounded-lg p-3 max-h-60 overflow-y-auto">
                                    {UNIT_BLOCKS.map(block => (
                                        <div key={block.id}>
                                            <label className="flex items-center gap-2 font-medium text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.targetBlocks.includes(block.id)}
                                                    onChange={() => handleBlockToggle(block.id)}
                                                    className="rounded text-primary"
                                                />
                                                {block.name}
                                            </label>
                                            {formData.targetBlocks.includes(block.id) && (
                                                <div className="ml-6 mt-1 space-y-1">
                                                    {block.types.map(type => (
                                                        <label key={type.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                                                            <input
                                                                type="checkbox"
                                                                checked={isTypeSelected(block.id, type.id)}
                                                                onChange={() => handleTypeToggle(block.id, type.id)}
                                                                className="rounded text-primary"
                                                            />
                                                            {type.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Đang tạo...' : 'Tạo kế hoạch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlansManagePage;
