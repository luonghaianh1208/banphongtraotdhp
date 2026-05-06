import { MdDelete, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';

const PersonalTaskItem = ({ task, onToggle, onDelete, onClick }) => (
  <div
    onClick={() => onClick && onClick()}
    className={`flex items-start gap-2 px-2 py-1.5 rounded-lg group transition-all cursor-pointer ${task.done ? 'opacity-50' : ''} hover:bg-sky-50 dark:hover:bg-sky-950/20`}
  >
    <button onClick={(e) => { e.stopPropagation(); onToggle(task.id, task.done); }} className="mt-0.5 shrink-0 text-sky-500">
      {task.done ? <MdCheckBox size={14} /> : <MdCheckBoxOutlineBlank size={14} />}
    </button>
    <div className="flex-1 min-w-0">
      <p className={`text-[11px] font-bold leading-snug ${task.done ? 'line-through text-slate-400' : 'text-sky-700 dark:text-sky-300'}`}>
        {task.title}
      </p>
      {task.time && (
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{task.time}</span>
      )}
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-500 transition-all"
    >
      <MdDelete size={12} />
    </button>
  </div>
);

export default PersonalTaskItem;
