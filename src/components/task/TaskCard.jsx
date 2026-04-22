// TaskCard — card hiển thị task trên danh sách
import { MdAccessTime, MdPerson, MdAttachFile, MdCheckCircle, MdStickyNote2, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { useTaskConfig } from '../../context/TaskConfigContext';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

const TaskCard = ({ task, users, onClick, onApprove, canApprove, selectable, selected, onToggleSelect }) => {
  const { getCategoryById } = useTaskConfig();
  const cat = getCategoryById(task.category);
  // Tìm tên người thực hiện
  const assigneeNames = (task.assignees || [])
    .map(uid => users.find(u => u.id === uid)?.displayName || '?')
    .join(', ');

  const creatorName = users.find(u => u.id === task.createdBy)?.displayName || '?';

  return (
    <div
      onClick={() => onClick(task)}
      className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-5 cursor-pointer group transition-all duration-300 relative overflow-hidden hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600 active:scale-[0.98] ${task.isReminded && !task.isCompleted
        ? 'border-rose-500/50 animate-pulse-border shadow-xl shadow-rose-500/10'
        : 'hover:scale-[1.01]'
        }`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-2xl pointer-events-none group-hover:from-emerald-500/10 transition-colors duration-700" />

      {/* Top row: title + status */}
      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
        <div className="flex gap-3 items-start flex-1 min-w-0">
          {selectable && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
              className="mt-0.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {selected ? <MdCheckBox size={22} className="text-emerald-600" /> : <MdCheckBoxOutlineBlank size={22} className="text-slate-300 dark:text-slate-600" />}
            </button>
          )}
          <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-1 tracking-tight">
            {task.title}
          </h3>
        </div>
        <StatusBadge task={task} />
      </div>

      {/* Middle: meta info */}
      <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 relative z-10">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <MdPerson size={14} className="text-emerald-500" />
          {assigneeNames || 'CHƯA GIAO'}
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <MdAccessTime size={14} className="text-sky-500" />
          {formatDateTime(task.deadline)}
        </span>
        {task.attachments?.length > 0 && (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <MdAttachFile size={14} className="text-rose-500" />
            {task.attachments.length} FILE
          </span>
        )}
      </div>

      {/* Bottom: priority + actions */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {cat && cat.id !== 'other' && (
            <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: cat.color + '15', color: cat.color }}>
              {cat.name}
            </span>
          )}
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 italic ml-1">• BỞI {creatorName.split(' ').pop().toUpperCase()}</span>
        </div>

        {/* Nút duyệt hoàn thành — chỉ admin */}
        {canApprove && !task.isCompleted && (
          <button
            onClick={(e) => { e.stopPropagation(); onApprove(task.id); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-emerald-500/30"
          >
            <MdCheckCircle size={16} />
            DUYỆT XONG
          </button>
        )}
      </div>

      {/* Notes indicator */}
      {task.notes?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
          <div className="flex items-start gap-2">
            <MdStickyNote2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 italic line-clamp-1 italic">
              {task.notes[task.notes.length - 1].content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
