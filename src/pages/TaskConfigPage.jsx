// TaskConfigPage — trang cấu hình phân loại & mức độ ưu tiên (admin only)
import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSave, MdClose, MdArrowUpward, MdArrowDownward, MdTune, MdLabel, MdFlag, MdGavel } from 'react-icons/md';
import { useTaskConfig } from '../context/TaskConfigContext';
import { saveCategories, savePriorities, savePenaltyTypes } from '../firebase/firestore';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const COLOR_PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#F43F5E', '#9CA3AF',
  '#374151', '#0EA5E9', '#14B8A6', '#A855F7',
];

const generateId = (name) => {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item-' + Date.now();
};

const TaskConfigPage = () => {
  const { categories, priorities, penaltyTypes } = useTaskConfig();
  
  // Category state
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(COLOR_PALETTE[0]);
  const [editCatId, setEditCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const [deleteCatId, setDeleteCatId] = useState(null);

  // Priority state
  const [priName, setPriName] = useState('');
  const [priColor, setPriColor] = useState(COLOR_PALETTE[0]);
  const [editPriId, setEditPriId] = useState(null);
  const [editPriName, setEditPriName] = useState('');
  const [editPriColor, setEditPriColor] = useState('');
  const [deletePriId, setDeletePriId] = useState(null);

  // Penalty state
  const [penName, setPenName] = useState('');
  const [penAmount, setPenAmount] = useState('');
  const [penColor, setPenColor] = useState(COLOR_PALETTE[0]);
  const [editPenId, setEditPenId] = useState(null);
  const [editPenName, setEditPenName] = useState('');
  const [editPenAmount, setEditPenAmount] = useState('');
  const [editPenColor, setEditPenColor] = useState('');
  const [deletePenId, setDeletePenId] = useState(null);

  const [saving, setSaving] = useState(false);

  // === CATEGORY ACTIONS ===
  const handleAddCategory = async () => {
    if (!catName.trim()) return toast.error('Vui lòng nhập tên phân loại');
    if (categories.find(c => c.name.toLowerCase() === catName.trim().toLowerCase())) {
      return toast.error('Phân loại này đã tồn tại');
    }
    setSaving(true);
    try {
      const newItem = { id: generateId(catName.trim()), name: catName.trim(), color: catColor };
      // Đảm bảo "Khác" luôn ở cuối
      const others = categories.filter(c => c.id !== 'other');
      const otherItem = categories.find(c => c.id === 'other') || { id: 'other', name: 'Khác', color: '#9CA3AF' };
      await saveCategories([...others, newItem, otherItem]);
      setCatName('');
      setCatColor(COLOR_PALETTE[0]);
      toast.success('Đã thêm phân loại');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editCatName.trim()) return toast.error('Tên không được để trống');
    setSaving(true);
    try {
      const updated = categories.map(c =>
        c.id === editCatId ? { ...c, name: editCatName.trim(), color: editCatColor } : c
      );
      await saveCategories(updated);
      setEditCatId(null);
      toast.success('Đã cập nhật phân loại');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    setSaving(true);
    try {
      const updated = categories.filter(c => c.id !== deleteCatId);
      await saveCategories(updated);
      setDeleteCatId(null);
      toast.success('Đã xóa phân loại');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // === PRIORITY ACTIONS ===
  const handleAddPriority = async () => {
    if (!priName.trim()) return toast.error('Vui lòng nhập tên mức độ');
    if (priorities.find(p => p.name.toLowerCase() === priName.trim().toLowerCase())) {
      return toast.error('Mức độ này đã tồn tại');
    }
    setSaving(true);
    try {
      const newItem = {
        id: generateId(priName.trim()),
        name: priName.trim(),
        color: priColor,
        order: priorities.length + 1,
      };
      await savePriorities([...priorities, newItem]);
      setPriName('');
      setPriColor(COLOR_PALETTE[0]);
      toast.success('Đã thêm mức độ ưu tiên');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditPriority = async () => {
    if (!editPriName.trim()) return toast.error('Tên không được để trống');
    setSaving(true);
    try {
      const updated = priorities.map(p =>
        p.id === editPriId ? { ...p, name: editPriName.trim(), color: editPriColor } : p
      );
      await savePriorities(updated);
      setEditPriId(null);
      toast.success('Đã cập nhật mức độ');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePriority = async () => {
    if (priorities.length <= 1) return toast.error('Phải giữ ít nhất 1 mức độ');
    setSaving(true);
    try {
      const updated = priorities.filter(p => p.id !== deletePriId)
        .map((p, i) => ({ ...p, order: i + 1 }));
      await savePriorities(updated);
      setDeletePriId(null);
      toast.success('Đã xóa mức độ');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMovePriority = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= priorities.length) return;
    const updated = [...priorities];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    await savePriorities(updated.map((p, i) => ({ ...p, order: i + 1 })));
  };

  // === PENALTY ACTIONS ===
  const handleAddPenaltyType = async () => {
    if (!penName.trim()) return toast.error('Vui lòng nhập tên vi phạm');
    if (penaltyTypes.find(p => p.name.toLowerCase() === penName.trim().toLowerCase())) {
      return toast.error('Lỗi này đã tồn tại');
    }
    setSaving(true);
    try {
      const parsedAmount = parseInt(String(penAmount).replace(/\D/g, ''), 10) || null;
      const newItem = {
        id: generateId(penName.trim()),
        name: penName.trim(),
        defaultAmount: parsedAmount,
        color: penColor,
        isAutoOverdue: false,
      };
      await savePenaltyTypes([...penaltyTypes, newItem]);
      setPenName('');
      setPenAmount('');
      setPenColor(COLOR_PALETTE[0]);
      toast.success('Đã thêm cấu hình vi phạm');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditPenaltyType = async () => {
    if (!editPenName.trim()) return toast.error('Tên không được để trống');
    setSaving(true);
    try {
      const parsedAmount = parseInt(String(editPenAmount).replace(/\D/g, ''), 10) || null;
      const updated = penaltyTypes.map(p =>
        p.id === editPenId ? { ...p, name: editPenName.trim(), defaultAmount: parsedAmount, color: editPenColor } : p
      );
      await savePenaltyTypes(updated);
      setEditPenId(null);
      toast.success('Đã cập nhật lỗi vi phạm');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePenaltyType = async () => {
    setSaving(true);
    try {
      const updated = penaltyTypes.filter(p => p.id !== deletePenId);
      await savePenaltyTypes(updated);
      setDeletePenId(null);
      toast.success('Đã xóa cấu hình lỗi');
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEditCat = (cat) => { setEditCatId(cat.id); setEditCatName(cat.name); setEditCatColor(cat.color); };
  const startEditPri = (pri) => { setEditPriId(pri.id); setEditPriName(pri.name); setEditPriColor(pri.color); };
  const startEditPen = (pen) => {
    setEditPenId(pen.id);
    setEditPenName(pen.name);
    setEditPenAmount(pen.defaultAmount ? String(pen.defaultAmount) : '');
    setEditPenColor(pen.color || COLOR_PALETTE[0]);
  };

  const formatVND = (val) => val != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val) : 'Nhập tay';

  return (
    <div className="max-w-3xl mx-auto fade-in space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600"><MdTune size={24} /></div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cấu hình công việc</h1>
          <p className="text-sm text-gray-500">Quản lý phân loại và mức độ ưu tiên</p>
        </div>
      </div>

      {/* === PHÂN LOẠI CÔNG VIỆC === */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <MdLabel size={20} className="text-blue-500" /> Phân loại công việc
        </h3>

        {/* Danh sách categories */}
        <div className="space-y-2 mb-4">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 group">
              {editCatId === cat.id ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: editCatColor }} />
                  <input value={editCatName} onChange={e => setEditCatName(e.target.value)} className="input flex-1 text-sm" autoFocus />
                  <ColorPicker selected={editCatColor} onChange={setEditCatColor} />
                  <button onClick={handleEditCategory} disabled={saving} className="p-1.5 rounded-md text-green-600 hover:bg-green-50"><MdSave size={18} /></button>
                  <button onClick={() => setEditCatId(null)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200"><MdClose size={18} /></button>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-medium text-gray-800 flex-1">{cat.name}</span>
                  {cat.id !== 'other' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditCat(cat)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200 hover:text-blue-600"><MdEdit size={16} /></button>
                      <button onClick={() => setDeleteCatId(cat.id)} className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"><MdDelete size={16} /></button>
                    </div>
                  )}
                  {cat.id === 'other' && <span className="text-xs text-gray-400 italic">Mặc định</span>}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Form thêm mới */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: catColor }} />
          <input
            value={catName}
            onChange={e => setCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            className="input flex-1 text-sm"
            placeholder="Tên phân loại mới..."
          />
          <ColorPicker selected={catColor} onChange={setCatColor} />
          <button onClick={handleAddCategory} disabled={saving} className="btn btn-primary text-sm px-3 py-2">
            <MdAdd size={18} /> Thêm
          </button>
        </div>
      </div>

      {/* === MỨC ĐỘ ƯU TIÊN === */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <MdFlag size={20} className="text-red-500" /> Mức độ ưu tiên
        </h3>

        {/* Danh sách priorities */}
        <div className="space-y-2 mb-4">
          {priorities.map((pri, index) => (
            <div key={pri.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 group">
              {editPriId === pri.id ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: editPriColor }} />
                  <input value={editPriName} onChange={e => setEditPriName(e.target.value)} className="input flex-1 text-sm" autoFocus />
                  <ColorPicker selected={editPriColor} onChange={setEditPriColor} />
                  <button onClick={handleEditPriority} disabled={saving} className="p-1.5 rounded-md text-green-600 hover:bg-green-50"><MdSave size={18} /></button>
                  <button onClick={() => setEditPriId(null)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200"><MdClose size={18} /></button>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: pri.color }} />
                  <span className="text-sm font-medium text-gray-800 flex-1">{pri.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleMovePriority(index, -1)} disabled={index === 0} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200 disabled:opacity-30"><MdArrowUpward size={16} /></button>
                    <button onClick={() => handleMovePriority(index, 1)} disabled={index === priorities.length - 1} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200 disabled:opacity-30"><MdArrowDownward size={16} /></button>
                    <button onClick={() => startEditPri(pri)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200 hover:text-blue-600"><MdEdit size={16} /></button>
                    <button onClick={() => setDeletePriId(pri.id)} disabled={priorities.length <= 1} className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><MdDelete size={16} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Form thêm mới */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: priColor }} />
          <input
            value={priName}
            onChange={e => setPriName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddPriority()}
            className="input flex-1 text-sm"
            placeholder="Tên mức độ mới..."
          />
          <ColorPicker selected={priColor} onChange={setPriColor} />
          <button onClick={handleAddPriority} disabled={saving} className="btn btn-primary text-sm px-3 py-2">
            <MdAdd size={18} /> Thêm
          </button>
        </div>
      </div>


      {/* === DANH MỤC LỖI VI PHẠM (PENALTIES) === */}
      <div className="card p-6 border-l-4 border-red-500">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <MdGavel size={20} className="text-red-600" /> Danh mục Lỗi Vi Phạm & Phạt Tiền
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">Các lỗi được thiết lập ở đây sẽ hiện trong menu xử phạt. Bỏ trống giá tiền nếu muốn nhập tự do mỗi khi phạt.</p>

        {/* Danh sách penalties */}
        <div className="space-y-2 mb-4">
          {penaltyTypes?.map((pen) => (
            <div key={pen.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 group border border-transparent hover:border-gray-200">
              {editPenId === pen.id ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: editPenColor }} />
                  <input placeholder="Tên lỗi..." value={editPenName} onChange={e => setEditPenName(e.target.value)} className="input flex-1 text-sm" autoFocus />
                  <input placeholder="Đơn giá (VD: 50000)" value={editPenAmount} onChange={e => setEditPenAmount(e.target.value)} className="input flex-1 text-sm" type="number" />
                  <ColorPicker selected={editPenColor} onChange={setEditPenColor} />
                  <button onClick={handleEditPenaltyType} disabled={saving} className="p-1.5 rounded-md text-green-600 hover:bg-green-50"><MdSave size={18} /></button>
                  <button onClick={() => setEditPenId(null)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200"><MdClose size={18} /></button>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: pen.color || COLOR_PALETTE[0] }} />
                  <div className="flex-1">
                     <span className="text-sm font-medium text-gray-800 flex items-center gap-2">{pen.name} {pen.isAutoOverdue && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">Tự động</span>}</span>
                  </div>
                  <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">{formatVND(pen.defaultAmount)}</span>
                  
                  {pen.isAutoOverdue ? (
                    <div className="flex gap-1 opacity-100 pl-2">
                      <button onClick={() => startEditPen(pen)} className="btn-icon text-blue-600 bg-blue-50 hover:bg-blue-100"><MdEdit size={16} /></button>
                    </div>
                  ) : (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                        <button onClick={() => startEditPen(pen)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200 hover:text-blue-600"><MdEdit size={16} /></button>
                        <button onClick={() => setDeletePenId(pen.id)} className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"><MdDelete size={16} /></button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Form thêm mới phạt */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" style={{ backgroundColor: penColor }} />
          <input
            value={penName}
            onChange={e => setPenName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddPenaltyType()}
            className="input w-1/3 text-sm"
            placeholder="Nhập tên lỗi (VD: Đi làm trễ)..."
          />
          <input
            value={penAmount}
            onChange={e => setPenAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddPenaltyType()}
            className="input flex-1 text-sm"
            type="number"
            placeholder="Giá phạt mặc định (để trống nếu nhập linh động)..."
          />
          <ColorPicker selected={penColor} onChange={setPenColor} />
          <button onClick={handleAddPenaltyType} disabled={saving} className="btn bg-red-600 text-white hover:bg-red-700 text-sm px-3 py-2">
            <MdAdd size={18} /> Thêm Lỗi
          </button>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={!!deleteCatId}
        onClose={() => setDeleteCatId(null)}
        onConfirm={handleDeleteCategory}
        title="Xóa phân loại"
        message={`Bạn chắc chắn muốn xóa phân loại "${categories.find(c => c.id === deleteCatId)?.name}"? Các công việc thuộc phân loại này sẽ tự động chuyển về "Khác".`}
        confirmText="Xóa"
        danger
      />
      <ConfirmDialog
        isOpen={!!deletePriId}
        onClose={() => setDeletePriId(null)}
        onConfirm={handleDeletePriority}
        title="Xóa mức độ ưu tiên"
        message={`Bạn chắc chắn muốn xóa mức độ "${priorities.find(p => p.id === deletePriId)?.name}"?`}
        confirmText="Xóa"
        danger
      />
      <ConfirmDialog
        isOpen={!!deletePenId}
        onClose={() => setDeletePenId(null)}
        onConfirm={handleDeletePenaltyType}
        title="Xóa lỗi vi phạm"
        message={`Bạn chắc chắn muốn xóa lỗi "${penaltyTypes.find(p => p.id === deletePenId)?.name}"?`}
        confirmText="Xóa"
        danger
      />
    </div>
  );
};

// === SUB COMPONENT: Bảng chọn màu ===
const ColorPicker = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors shadow-sm"
        style={{ backgroundColor: selected }}
        title="Chọn màu"
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-2 grid grid-cols-4 gap-1.5 w-[140px]">
            {COLOR_PALETTE.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => { onChange(color); setOpen(false); }}
                className={`w-7 h-7 rounded-lg transition-all hover:scale-110 ${selected === color ? 'ring-2 ring-offset-1 ring-primary-500' : 'border border-gray-200'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TaskConfigPage;
