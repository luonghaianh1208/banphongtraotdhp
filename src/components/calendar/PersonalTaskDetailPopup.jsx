import { MdClose, MdAccessTime, MdStickyNote2, MdEdit, MdDelete, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';

const PersonalTaskDetailPopup = ({ task, onClose, onEdit, onDelete, onToggle }) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 animate-fade-in-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-lg shadow-sky-500/30" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Việc cá nhân</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <MdClose size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Title + Done status */}
          <div className="flex items-start gap-3">
            <button
              onClick={() => { onToggle(task.id, task.done); onClose(); }}
              className="mt-0.5 shrink-0 text-sky-500 hover:text-sky-600 transition-colors"
            >
              {task.done ? <MdCheckBox size={22} /> : <MdCheckBoxOutlineBlank size={22} />}
            </button>
            <p className={`text-base font-bold leading-snug ${task.done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
              {task.title}
            </p>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
            <MdAccessTime size={18} className="text-sky-500 shrink-0" />
            <div>
              <p className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">Thời gian</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{task.time || 'Chưa đặt'}</p>
            </div>
          </div>

          {/* Note */}
          {task.note && (
            <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
              <MdStickyNote2 size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ghi chú</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{task.note}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => { onClose(); onEdit(task); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 text-sm font-bold hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all"
            >
              <MdEdit size={16} /> Sửa
            </button>
            <button
              onClick={() => { onDelete(task.id); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-500 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            >
              <MdDelete size={16} /> Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalTaskDetailPopup;
