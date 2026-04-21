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
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý Đơn vị (Cơ sở)</h2>
                    <p className="text-gray-600 mt-1">Quản lý tài khoản các đơn vị cơ sở trực thuộc. Tổng: <strong>{units.length}</strong></p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select value={filterBlock} onChange={e => setFilterBlock(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm bg-white">
                        <option value="all">Tất cả Khối</option>
                        {UNIT_BLOCKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <button onClick={exportUnitTemplate} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center gap-1">
                        <MdDownload size={16} /> Tải mẫu Excel
                    </button>
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center gap-1 cursor-pointer">
                        <MdUpload size={16} /> Import Excel
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
                    </label>
                    <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center gap-1">
                        <MdCorporateFare size={16} /> Thêm thủ công
                    </button>
                    {selected.length > 0 && (
                        <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center gap-1">
                            <MdDelete size={16} /> Xóa ({selected.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Import progress */}
            {importProgress && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-medium text-blue-800">Đang import: {importProgress.done}/{importProgress.total}</p>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(importProgress.done / importProgress.total) * 100}%` }}></div>
                    </div>
                    {importProgress.errors.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">{importProgress.errors.map((e, i) => <p key={i}>⚠ {e}</p>)}</div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input type="checkbox" checked={selected.length === filteredUnits.length && filteredUnits.length > 0}
                                        onChange={toggleAll} className="rounded border-gray-300" />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên Cơ sở</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khối / Loại</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUnits.map((unit) => (
                                <tr key={unit.id} className={`hover:bg-gray-50 ${selected.includes(unit.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <input type="checkbox" checked={selected.includes(unit.id)}
                                            onChange={() => toggleSelect(unit.id)} className="rounded border-gray-300" />
                                    </td>
                                    <td className="px-4 py-3">
                                        {editingId === unit.id ? (
                                            <input value={editData.unitName} onChange={e => setEditData(p => ({ ...p, unitName: e.target.value }))}
                                                className="border rounded px-2 py-1 text-sm w-full" />
                                        ) : (
                                            <span className="text-sm font-medium text-gray-900">{unit.unitName}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{unit.email}</td>
                                    <td className="px-4 py-3">
                                        {editingId === unit.id ? (
                                            <div className="flex gap-1">
                                                <select value={editData.blockId} onChange={e => handleBlockChange(e, 'edit')}
                                                    className="border rounded px-1 py-1 text-xs">
                                                    <option value="">Khối</option>
                                                    {UNIT_BLOCKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                </select>
                                                <select value={editData.typeId} onChange={e => handleTypeChange(e, 'edit')}
                                                    className="border rounded px-1 py-1 text-xs">
                                                    <option value="">Loại</option>
                                                    {editBlock?.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-600">{getBlockLabel(unit)}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${unit.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {unit.isActive !== false ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {editingId === unit.id ? (
                                            <div className="flex justify-end gap-1">
                                                <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><MdCheck size={18} /></button>
                                                <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><MdClose size={18} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => startEdit(unit)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><MdEdit size={18} /></button>
                                                <button onClick={() => handleDelete(unit.id, unit.unitName)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Xóa"><MdDelete size={18} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredUnits.length === 0 && (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Chưa có đơn vị nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Thêm Đơn vị Mới</h3>
                        <p className="text-sm text-gray-500 mb-4">Đơn vị sẽ đăng nhập bằng Google với email được cấp.</p>
                        <form onSubmit={handleCreateUnit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên cơ sở</label>
                                <input required value={formData.unitName} onChange={e => setFormData(p => ({ ...p, unitName: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2" placeholder="VD: Đoàn TN xã An Hưng" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Khối</label>
                                <select required value={formData.blockId} onChange={e => handleBlockChange(e, 'form')}
                                    className="w-full border rounded-md px-3 py-2 bg-white">
                                    <option value="">— Chọn Khối —</option>
                                    {UNIT_BLOCKS.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                                <select required value={formData.typeId} onChange={e => handleTypeChange(e, 'form')}
                                    disabled={!formData.blockId} className="w-full border rounded-md px-3 py-2 bg-white disabled:bg-gray-100">
                                    <option value="">— Chọn Loại —</option>
                                    {selectedBlock?.types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Google</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                    className="w-full border rounded-md px-3 py-2" placeholder="VD: doanthanhnien@gmail.com" />
                                <p className="text-xs text-gray-400 mt-1">Đơn vị sẽ đăng nhập bằng Google với email này</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Hủy</button>
                                <button type="submit" disabled={isSubmitting}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60">
                                    {isSubmitting ? 'Đang tạo...' : 'Tạo đơn vị'}
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
