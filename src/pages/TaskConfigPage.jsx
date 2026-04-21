// TaskConfigPage — trang cấu hình phân loại & mức độ ưu tiên (admin only)
import { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSave, MdClose, MdArrowUpward, MdArrowDownward, MdTune, MdLabel, MdFlag, MdGavel, MdCheckCircle } from 'react-icons/md';
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
    <div className="max-w-4xl mx-auto space-y-10 pb-10">
      <div className="flex items-center gap-4">
        <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-inner">
          <MdTune size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cấu hình công việc</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">Quản lý phân loại, mức độ và vi phạm</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* === PHÂN LOẠI CÔNG VIỆC === */}
        <div className="glass-card p-6 border border-white/20 dark:border-white/5 rounded-3xl shadow-xl">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-blue-500 rounded-full" />
            Phân loại công việc
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 transition-all hover:border-blue-300 group">
                {editCatId === cat.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm font-bold flex-1"
                      autoFocus
                    />
                    <ColorPicker selected={editCatColor} onChange={setEditCatColor} />
                    <button onClick={handleEditCategory} disabled={saving} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><MdSave size={18} /></button>
                    <button onClick={() => setEditCatId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><MdClose size={18} /></button>
                  </div>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full shadow-sm shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-black text-gray-800 dark:text-gray-200 flex-1 truncate">{cat.name}</span>
                    {cat.id !== 'other' ? (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditCat(cat)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><MdEdit size={16} /></button>
                        <button onClick={() => setDeleteCatId(cat.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><MdDelete size={16} /></button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pr-2">Mặc định</span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-950">
            <input
              value={catName}
              onChange={e => setCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              className="bg-white dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-2 text-sm font-bold flex-1 outline-none transition-all dark:text-white"
              placeholder="Tên phân loại mới..."
            />
            <div className="flex items-center gap-3">
              <ColorPicker selected={catColor} onChange={setCatColor} />
              <button
                onClick={handleAddCategory}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2"
              >
                <MdAdd size={20} /> Thêm Mới
              </button>
            </div>
          </div>
        </div>

        {/* === MỨC ĐỘ ƯU TIÊN === */}
        <div className="glass-card p-6 border border-white/20 dark:border-white/5 rounded-3xl shadow-xl">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-red-500 rounded-full" />
            Mức độ ưu tiên
          </h3>

          <div className="space-y-3 mb-6">
            {priorities.map((pri, index) => (
              <div key={pri.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 transition-all hover:border-red-300 group">
                {editPriId === pri.id ? (
                  <div className="flex flex-1 items-center gap-3">
                    <input
                      value={editPriName}
                      onChange={e => setEditPriName(e.target.value)}
                      className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-bold flex-1"
                      autoFocus
                    />
                    <ColorPicker selected={editPriColor} onChange={setEditPriColor} />
                    <button onClick={handleEditPriority} disabled={saving} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><MdSave size={20} /></button>
                    <button onClick={() => setEditPriId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><MdClose size={20} /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-md shrink-0" style={{ backgroundColor: pri.color }} />
                      <span className="text-sm font-black text-gray-800 dark:text-gray-200">{pri.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleMovePriority(index, -1)} disabled={index === 0} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 rounded-lg"><MdArrowUpward size={18} /></button>
                      <button onClick={() => handleMovePriority(index, 1)} disabled={index === priorities.length - 1} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-20 rounded-lg"><MdArrowDownward size={18} /></button>
                      <button onClick={() => startEditPri(pri)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><MdEdit size={18} /></button>
                      <button onClick={() => setDeletePriId(pri.id)} disabled={priorities.length <= 1} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg disabled:opacity-20"><MdDelete size={18} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-red-50/30 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-950">
            <input
              value={priName}
              onChange={e => setPriName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPriority()}
              className="bg-white dark:bg-gray-900 border-2 border-transparent focus:border-red-500 rounded-xl px-4 py-2 text-sm font-bold flex-1 outline-none transition-all dark:text-white"
              placeholder="Tên mức độ mới..."
            />
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <ColorPicker selected={priColor} onChange={setPriColor} />
              <button
                onClick={handleAddPriority}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                <MdAdd size={20} /> Thêm Mức Độ
              </button>
            </div>
          </div>
        </div>

        {/* === DANH MỤC LỖI VI PHẠM === */}
        <div className="glass-card p-6 border-l-8 border-amber-500 dark:border-amber-600 rounded-3xl shadow-xl bg-gradient-to-r from-amber-50/20 to-white dark:from-amber-950/10 dark:to-gray-900">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-3 mb-2">
            <MdGavel size={24} className="text-amber-600" /> Danh mục Lỗi Vi Phạm
          </h3>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-6 opacity-70">Cấu hình tự động tính phạt và xử lý vi phạm</p>

          <div className="space-y-3 mb-8">
            {penaltyTypes?.map((pen) => (
              <div key={pen.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/30 hover:shadow-md transition-all group">
                {editPenId === pen.id ? (
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    <input placeholder="Tên lỗi..." value={editPenName} onChange={e => setEditPenName(e.target.value)} className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-bold flex-1 min-w-[150px]" autoFocus />
                    <input placeholder="Số tiền..." value={editPenAmount} onChange={e => setEditPenAmount(e.target.value)} className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-bold w-32" type="number" />
                    <ColorPicker selected={editPenColor} onChange={setEditPenColor} />
                    <div className="flex gap-1">
                      <button onClick={handleEditPenaltyType} disabled={saving} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><MdSave size={20} /></button>
                      <button onClick={() => setEditPenId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><MdClose size={20} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-700 shadow-sm shrink-0" style={{ backgroundColor: pen.color || COLOR_PALETTE[0] }} />
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          {pen.name}
                          {pen.isAutoOverdue && <span className="px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/50 text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-tighter">Tự động</span>}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {pen.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <span className="px-4 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-black shadow-inner">
                        {formatVND(pen.defaultAmount)}
                      </span>
                      {!pen.isAutoOverdue && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditPen(pen)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><MdEdit size={18} /></button>
                          <button onClick={() => setDeletePenId(pen.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><MdDelete size={18} /></button>
                        </div>
                      )}
                      {pen.isAutoOverdue && (
                        <button onClick={() => startEditPen(pen)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><MdEdit size={18} /></button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5 bg-amber-100/30 dark:bg-amber-900/20 rounded-3xl border border-amber-200 dark:border-amber-900/50">
            <input
              value={penName}
              onChange={e => setPenName(e.target.value)}
              className="bg-white dark:bg-gray-900 border-2 border-transparent focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm font-bold outline-none transition-all dark:text-white"
              placeholder="Tên lỗi vi phạm..."
            />
            <input
              value={penAmount}
              onChange={e => setPenAmount(e.target.value)}
              className="bg-white dark:bg-gray-900 border-2 border-transparent focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm font-bold outline-none transition-all dark:text-white"
              type="number"
              placeholder="Số tiền phạt (VND)..."
            />
            <div className="flex items-center justify-between sm:justify-center p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3">Chọn màu</span>
              <ColorPicker selected={penColor} onChange={setPenColor} />
            </div>
            <button
              onClick={handleAddPenaltyType}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <MdAdd size={22} /> Thiết Lập Lỗi
            </button>
          </div>
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
        className="w-8 h-8 rounded-full border-4 border-white dark:border-gray-800 hover:scale-110 transition-all shadow-lg active:scale-95"
        style={{ backgroundColor: selected }}
        title="Chọn màu"
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-3 grid grid-cols-4 gap-2 w-[160px] animate-in fade-in zoom-in duration-200">
            {COLOR_PALETTE.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => { onChange(color); setOpen(false); }}
                className={`w-7 h-7 rounded-lg transition-all hover:scale-110 relative ${selected === color ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900 border-none' : 'border border-gray-200 dark:border-gray-700'}`}
                style={{ backgroundColor: color }}
              >
                {selected === color && <MdCheckCircle className="absolute inset-0 m-auto text-white drop-shadow-md" size={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TaskConfigPage;
