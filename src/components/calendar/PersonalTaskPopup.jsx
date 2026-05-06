import { useState } from 'react';
import { MdClose, MdAccessTime, MdStickyNote2 } from 'react-icons/md';

const PersonalTaskPopup = ({ date, dateLabel, onSave, onClose, editingTask }) => {
  const [title, setTitle] = useState(editingTask?.title || '');
  const [time, setTime] = useState(editingTask?.time || '08:00');
  const [note, setNote] = useState(editingTask?.note || '');
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingTask;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), time, note: note.trim(), date, ...(isEditing ? { id: editingTask.id } : {}) });
      onClose();
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">{isEditing ? 'Sửa việc cá nhân' : 'Thêm việc cá nhân'}</h3>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><MdClose size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Tiêu đề công việc..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
          <div className="flex items-center gap-2">
            <MdAccessTime size={16} className="text-slate-400" />
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div className="flex items-start gap-2">
            <MdStickyNote2 size={16} className="text-slate-400 mt-3" />
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú (tuỳ chọn)..."
              rows={2}
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Lưu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PersonalTaskPopup;
