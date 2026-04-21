import { useState, useMemo } from 'react';
import { MdDownload, MdUpload, MdCorporateFare, MdDelete, MdEdit, MdClose, MdCheck, MdSelectAll } from 'react-icons/md';
import { useUnits } from '../../hooks/useUnits';
import { updateUnit, deleteUnit, batchDeleteUnits } from '../../firebase/criteriaFirestore';
import { UNIT_BLOCKS } from '../../utils/constants';
import { exportUnitTemplate } from '../../utils/exportExcel';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const UnitsPage = () => {
    const { units, loading, error } = useUnits();
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ email: '', unitName: '', blockId: '', blockName: '', typeId: '', typeName: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selected, setSelected] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [filterBlock, setFilterBlock] = useState('all');
    const [importProgress, setImportProgress] = useState(null);

    const selectedBlock = useMemo(() => UNIT_BLOCKS.find(b => b.id === formData.blockId), [formData.blockId]);
    const editBlock = useMemo(() => UNIT_BLOCKS.find(b => b.id === editData.blockId), [editData.blockId]);

    const filteredUnits = filterBlock === 'all' ? units : units.filter(u => u.blockId === filterBlock);

    // === HANDLERS ===
    const handleBlockChange = (e, target = 'form') => {
        const block = UNIT_BLOCKS.find(b => b.id === e.target.value);
        const setter = target === 'form' ? setFormData : setEditData;
        setter(prev => ({ ...prev, blockId: e.target.value, blockName: block?.name || '', typeId: '', typeName: '' }));
    };

    const handleTypeChange = (e, target = 'form') => {
        const src = target === 'form' ? selectedBlock : editBlock;
        const type = src?.types.find(t => t.id === e.target.value);
        const setter = target === 'form' ? setFormData : setEditData;
        setter(prev => ({ ...prev, typeId: e.target.value, typeName: type?.name || '' }));
    };

    // Thêm thủ công
    const handleCreateUnit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.unitName) { toast.error("Nhập đầy đủ Tên + Email"); return; }
        if (!formData.blockId || !formData.typeId) { toast.error("Chọn Khối và Loại"); return; }
        setIsSubmitting(true);
        try {
            const createUnitFn = httpsCallable(functions, 'createUnit');
            const result = await createUnitFn({
                email: formData.email, unitName: formData.unitName,
                blockId: formData.blockId, blockName: formData.blockName,
                typeId: formData.typeId, typeName: formData.typeName,
            });
            if (result.data?.success) {
                toast.success('Tạo đơn vị thành công!');
                setShowAddModal(false);
                setFormData({ email: '', unitName: '', blockId: '', blockName: '', typeId: '', typeName: '' });
            } else {
                toast.error(result.data?.message || 'Lỗi tạo đơn vị');
            }
        } catch (err) {
            toast.error('Lỗi: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Import Excel
    const handleImportExcel = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);
                const validRows = rows.filter(r => r['Tên đơn vị'] && r['Email'] && r['Khối'] && r['Loại']);

                if (validRows.length === 0) { toast.error('Không tìm thấy dòng hợp lệ nào.'); return; }

                const createUnitFn = httpsCallable(functions, 'createUnit');

                setImportProgress({ total: validRows.length, done: 0, errors: [] });
                let done = 0;
                const errors = [];

                for (const row of validRows) {
                    const block = UNIT_BLOCKS.find(b => b.name === row['Khối']);
                    const type = block?.types.find(t => t.name === row['Loại']);
                    try {
                        await createUnitFn({
                            email: row['Email'], unitName: row['Tên đơn vị'],
                            blockId: block?.id || '', blockName: block?.name || row['Khối'],
                            typeId: type?.id || '', typeName: type?.name || row['Loại'],
                        });
                        done++;
                    } catch (err) {
                        errors.push(`${row['Tên đơn vị']}: ${err.message}`);
                    }
                    setImportProgress({ total: validRows.length, done, errors: [...errors] });
                }
                if (errors.length === 0) toast.success(`Import thành công ${done} đơn vị!`);
                else toast.error(`Import xong. Thành công: ${done}, Lỗi: ${errors.length}`);
                setTimeout(() => setImportProgress(null), 5000);
            } catch (err) {
                toast.error('Lỗi đọc file: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    // Sửa inline
    const startEdit = (unit) => {
        setEditingId(unit.id);
        setEditData({ unitName: unit.unitName, blockId: unit.blockId || '', blockName: unit.blockName || '', typeId: unit.typeId || '', typeName: unit.typeName || '' });
    };
    const saveEdit = async () => {
        try {
            await updateUnit(editingId, editData);
            toast.success('Cập nhật thành công');
            setEditingId(null);
        } catch (err) { toast.error('Lỗi cập nhật: ' + err.message); }
    };

    // Xóa đơn lẻ
    const handleDelete = async (unitId, name) => {
        if (!confirm(`Xóa đơn vị "${name}"?`)) return;
        try {
            await deleteUnit(unitId);
            toast.success('Đã xóa');
        } catch (err) { toast.error('Lỗi xóa: ' + err.message); }
    };

    // Xóa hàng loạt
    const handleBulkDelete = async () => {
        if (!confirm(`Xóa ${selected.length} đơn vị đã chọn?`)) return;
        try {
            await batchDeleteUnits(selected);
            setSelected([]);
            toast.success(`Đã xóa ${selected.length} đơn vị`);
        } catch (err) { toast.error('Lỗi xóa hàng loạt: ' + err.message); }
    };

    // Toggle chọn
    const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleAll = () => setSelected(selected.length === filteredUnits.length ? [] : filteredUnits.map(u => u.id));

    const getBlockLabel = (unit) => {
        if (!unit.blockName) return '—';
        return `${unit.blockName}${unit.typeName ? ` / ${unit.typeName}` : ''}`;
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    if (error) return <div className="text-red-500 p-4">Lỗi: {error.message}</div>;

    return (
        <div className="animate-fade-in-up">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Quản lý <span className="text-primary-600 dark:text-primary-400">Đơn vị</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-primary-500"></span>
                        Hệ thống hiện có <strong className="text-gray-900 dark:text-white">{units.length}</strong> đơn vị cơ sở trực thuộc
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="flex flex-wrap gap-4 items-center">
                        <select
                            value={filterBlock}
                            onChange={e => setFilterBlock(e.target.value)}
                            className="glass-card !py-2.5 !px-4 !w-auto min-w-[180px] bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-emerald-500/10 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-sm font-semibold"
                        >
                            <option value="all">Tất cả Khối</option>
                            {UNIT_BLOCKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>

                        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2 hidden lg:block"></div>

                        <button onClick={exportUnitTemplate} className="btn-secondary py-2.5 px-5 shadow-sm group/btn">
                            <span className="flex items-center gap-2">
                                <MdDownload className="group-hover/btn:translate-y-1 transition-transform" size={20} />
                                <span className="hidden sm:inline">Mẫu Excel</span>
                            </span>
                        </button>

                        <label className="btn-emerald py-2.5 px-5 shadow-emerald-600/10 cursor-pointer group/btn">
                            <span className="flex items-center gap-2">
                                <MdUpload className="group-hover/btn:-translate-y-1 transition-transform" size={20} />
                                <span className="hidden sm:inline">Nhập dữ liệu</span>
                            </span>
                            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
                        </label>

                        <button onClick={() => setShowAddModal(true)} className="btn-primary py-2.5 px-5 shadow-emerald-600/20 group/btn">
                            <span className="flex items-center gap-2">
                                <MdAdd className="group-hover/btn:rotate-90 transition-transform" size={20} />
                                Thêm Đơn vị
                            </span>
                        </button>

                        {selected.length > 0 && (
                            <button onClick={handleBulkDelete} className="btn btn-danger animate-pulse">
                                <MdDelete size={20} /> Xóa ({selected.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Import progress */}
            {importProgress && (
                <div className="mb-6 glass p-6 rounded-2xl border-blue-200/50 dark:border-blue-800/50 animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                        <p className="font-bold text-blue-800 dark:text-blue-400">Đang xử lý dữ liệu import...</p>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">{importProgress.done}/{importProgress.total}</span>
                    </div>
                    <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-blue-500 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }}
                        ></div>
                    </div>
                    {importProgress.errors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1 uppercase tracking-wider">Cảnh báo lỗi ({importProgress.errors.length})</p>
                            <div className="max-h-24 overflow-y-auto text-xs text-red-500 dark:text-red-300 space-y-1">
                                {importProgress.errors.map((e, i) => <p key={i}>• {e}</p>)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Table */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-premium border border-white/40 dark:border-gray-800/40 overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left w-12">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selected.length === filteredUnits.length && filteredUnits.length > 0}
                                            onChange={toggleAll}
                                            className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 transition-all cursor-pointer"
                                        />
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Tên Cơ sở</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Email Liên kết</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Phân loại Khối</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredUnits.map((unit, idx) => (
                                <tr
                                    key={unit.id}
                                    className={`group transition-all duration-200 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 ${selected.includes(unit.id) ? 'bg-primary-50/40 dark:bg-primary-900/20' : ''}`}
                                    style={{ animationDelay: `${idx * 30}ms` }}
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(unit.id)}
                                            onChange={() => toggleSelect(unit.id)}
                                            className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 transition-all cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === unit.id ? (
                                            <input
                                                value={editData.unitName}
                                                onChange={e => setEditData(p => ({ ...p, unitName: e.target.value }))}
                                                className="input !py-1.5 !px-3 font-medium text-sm border-primary-300 dark:border-primary-700"
                                            />
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                                                    {unit.unitName}
                                                </span>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-tighter mt-0.5">ID: {unit.id.slice(0, 8)}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-700">
                                                {unit.email.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium">{unit.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === unit.id ? (
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                <select
                                                    value={editData.blockId}
                                                    onChange={e => handleBlockChange(e, 'edit')}
                                                    className="input !py-1.5 !px-3 text-xs bg-white dark:bg-gray-800"
                                                >
                                                    <option value="">Chọn Khối</option>
                                                    {UNIT_BLOCKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                </select>
                                                <select
                                                    value={editData.typeId}
                                                    onChange={e => handleTypeChange(e, 'edit')}
                                                    disabled={!editData.blockId}
                                                    className="input !py-1.5 !px-3 text-xs bg-white dark:bg-gray-800 disabled:opacity-50"
                                                >
                                                    <option value="">Chọn Loại</option>
                                                    {editBlock?.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold">
                                                    {unit.blockName || '—'}
                                                </span>
                                                {unit.typeName && (
                                                    <span className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg text-xs font-bold">
                                                        {unit.typeName}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`badge ${unit.isActive !== false ? 'badge-green' : 'badge-red'} shadow-sm`}>
                                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${unit.isActive !== false ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
                                            {unit.isActive !== false ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === unit.id ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={saveEdit} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl transition-all shadow-sm" title="Lưu">
                                                    <MdCheck size={20} />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-500 rounded-xl transition-all shadow-sm" title="Hủy">
                                                    <MdClose size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button onClick={() => startEdit(unit)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl transition-all shadow-sm" title="Chỉnh sửa">
                                                    <MdEdit size={20} />
                                                </button>
                                                <button onClick={() => handleDelete(unit.id, unit.unitName)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-xl transition-all shadow-sm" title="Xóa bỏ">
                                                    <MdDelete size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredUnits.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center grayscale opacity-40">
                                            <MdCorporateFare size={64} className="text-gray-300 mb-4" />
                                            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Không tìm thấy đơn vị nào phù hợp</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddModal(false)}></div>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10 border border-white/20 dark:border-gray-800 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Thêm Đơn vị</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-tighter mt-1 font-bold">Khởi tạo tài khoản hệ thống mới</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <MdClose size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUnit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tên cơ sở cơ sở</label>
                                <input
                                    required
                                    value={formData.unitName}
                                    onChange={e => setFormData(p => ({ ...p, unitName: e.target.value }))}
                                    className="input"
                                    placeholder="VD: Đoàn TN xã An Hưng"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Phân loại Khối</label>
                                    <select
                                        required
                                        value={formData.blockId}
                                        onChange={e => handleBlockChange(e, 'form')}
                                        className="input bg-white dark:bg-gray-800"
                                    >
                                        <option value="">— Chọn —</option>
                                        {UNIT_BLOCKS.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Loại hình</label>
                                    <select
                                        required
                                        value={formData.typeId}
                                        onChange={e => handleTypeChange(e, 'form')}
                                        disabled={!formData.blockId}
                                        className="input bg-white dark:bg-gray-800 disabled:opacity-40"
                                    >
                                        <option value="">— Chọn —</option>
                                        {selectedBlock?.types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Google (Liên kết Auth)</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                        className="input"
                                        placeholder="doanthanhnien@gmail.com"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic">* Đơn vị sẽ bắt buộc đăng nhập qua Google bằng email này để xác thực.</p>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 btn btn-secondary"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] btn btn-primary shadow-glow disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Đang xử lý...
                                        </span>
                                    ) : 'Xác nhận tạo mới'}
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
