import { useState, useMemo } from 'react';
import { MdDownload, MdUpload, MdCorporateFare } from 'react-icons/md';
import { useUnits } from '../../hooks/useUnits';
import { httpsCallable, getFunctions } from 'firebase/functions';
import app from '../../firebase/config';
import { UNIT_BLOCKS } from '../../utils/constants';
import { exportUnitTemplate } from '../../utils/exportExcel';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const UnitsPage = () => {
    const { units, loading, error } = useUnits();

    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        unitName: '',
        blockId: '',
        blockName: '',
        typeId: '',
        typeName: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Options cho dropdown
    const selectedBlock = useMemo(
        () => UNIT_BLOCKS.find(b => b.id === formData.blockId),
        [formData.blockId]
    );

    const handleBlockChange = (e) => {
        const block = UNIT_BLOCKS.find(b => b.id === e.target.value);
        setFormData(prev => ({
            ...prev,
            blockId: e.target.value,
            blockName: block?.name || '',
            typeId: '',
            typeName: '',
        }));
    };

    const handleTypeChange = (e) => {
        const type = selectedBlock?.types.find(t => t.id === e.target.value);
        setFormData(prev => ({
            ...prev,
            typeId: e.target.value,
            typeName: type?.name || '',
        }));
    };

    const handleCreateUnit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password || !formData.unitName) {
            alert("Vui lòng điền đầy đủ thông tin");
            return;
        }
        if (!formData.blockId || !formData.typeId) {
            alert("Vui lòng chọn Khối và Loại");
            return;
        }

        setIsSubmitting(true);
        try {
            const fns = getFunctions(app, 'asia-southeast1');
            const createUnitFn = httpsCallable(fns, 'createUnit');

            const result = await createUnitFn({
                email: formData.email,
                password: formData.password,
                unitName: formData.unitName,
                blockId: formData.blockId,
                blockName: formData.blockName,
                typeId: formData.typeId,
                typeName: formData.typeName,
            });

            if (result.data?.success) {
                toast.success('Tạo tài khoản Cơ sở thành công!');
                setShowAddModal(false);
                setFormData({ email: '', password: '', unitName: '', blockId: '', blockName: '', typeId: '', typeName: '' });
            } else {
                toast.error('Có lỗi xảy ra: ' + result.data?.error);
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi gọi Cloud Function tạo Unit: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImportExcel = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);

                const validRows = rows.filter(r => r['Tên đơn vị'] && r['Email'] && r['Khối'] && r['Loại']);
                toast.success(`Đọc được ${validRows.length} đơn vị hợp lệ. (Chức năng import đang phát triển)`);
                console.log('[Import Excel]', validRows);
            } catch (err) {
                toast.error('Lỗi đọc file Excel: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const getBlockLabel = (unit) => {
        if (!unit.blockName) return '—';
        return `${unit.blockName}${unit.typeName ? ` / ${unit.typeName}` : ''}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 p-4">Lỗi tải danh sách cơ sở: {error.message}</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý Đơn vị (Cơ sở)</h2>
                    <p className="text-gray-600">Danh sách các Liên đội / Trường / Cơ sở và tài khoản truy cập.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportUnitTemplate}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-sm font-medium transition-colors flex items-center gap-1"
                    >
                        <MdDownload size={18} /> Tải mẫu Excel
                    </button>
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm font-medium transition-colors flex items-center gap-1 cursor-pointer">
                        <MdUpload size={18} /> Import Excel
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
                    </label>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded shadow-sm font-medium transition-colors flex items-center gap-1"
                    >
                        <MdCorporateFare size={18} /> Thêm Cơ sở
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Cơ sở</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài khoản (Email)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khối / Loại</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {units.map((unit) => (
                                <tr key={unit.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{unit.unitName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{unit.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {getBlockLabel(unit)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {unit.createdAt ? new Date(unit.createdAt).toLocaleDateString('vi-VN') : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${unit.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {unit.isActive !== false ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {units.length === 0 && (
                                <tr className="border-t">
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        Chưa có cơ sở nào hiển thị.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Tạo Tài Khoản Cơ Sở Mới</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Tài khoản này sẽ cấp cho cơ sở để đăng nhập vào trang `/unit/dashboard` nộp báo cáo.
                        </p>
                        <form onSubmit={handleCreateUnit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên cơ sở (Liên đội/...)</label>
                                <input
                                    required
                                    value={formData.unitName}
                                    onChange={e => setFormData(p => ({ ...p, unitName: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                    placeholder="VD: Liên đội TH Nguyễn Du"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Khối</label>
                                <select
                                    required
                                    value={formData.blockId}
                                    onChange={handleBlockChange}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary bg-white"
                                >
                                    <option value="">— Chọn Khối —</option>
                                    {UNIT_BLOCKS.map(block => (
                                        <option key={block.id} value={block.id}>{block.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                                <select
                                    required
                                    value={formData.typeId}
                                    onChange={handleTypeChange}
                                    disabled={!formData.blockId}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary bg-white disabled:bg-gray-100"
                                >
                                    <option value="">— Chọn Loại —</option>
                                    {selectedBlock?.types.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                    placeholder="VD: thnguyendu@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu khởi tạo</label>
                                <input
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
                                    placeholder="********"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors flex items-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></span>}
                                    Tạo Cơ Sở
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitsPage;
