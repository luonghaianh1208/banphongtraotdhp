import { MdCheckCircle, MdPerson } from 'react-icons/md';
import PriorityBadge from '../task/PriorityBadge';
import { getTaskDisplayStatus } from '../../utils/statusUtils';
import { TASK_DISPLAY_STATUS } from '../../utils/constants';

const statusColorMap = {
  [TASK_DISPLAY_STATUS.OVERDUE]: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10',
  [TASK_DISPLAY_STATUS.URGENT]: 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/10',
  [TASK_DISPLAY_STATUS.NEAR_DUE]: 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/10',
  [TASK_DISPLAY_STATUS.NOT_DUE]: 'border-l-emerald-500 bg-white dark:bg-slate-800/50',
  [TASK_DISPLAY_STATUS.EXTENDED]: 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10',
  [TASK_DISPLAY_STATUS.PENDING_APPROVAL]: 'border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/10',
};

const MiniTaskCard = ({ task, userMap, onClick, onApprove, canApprove }) => {
  const status = getTaskDisplayStatus(task);
  const assigneeNames = (task.assignees || [])
    .map(uid => userMap[uid]?.displayName?.split(' ').pop() || '?')
    .join(', ');
  const cardColor = statusColorMap[status] || 'border-l-slate-300 bg-white dark:bg-slate-800/50';

  return (
    <div
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
      className={`border-l-[3px] rounded-lg px-2.5 py-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] group ${cardColor}`}
    >
      <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        {task.title}
      </p>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {assigneeNames && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            <MdPerson size={11} />
            {assigneeNames}
          </span>
        )}
      </div>
      {canApprove && !task.isCompleted && status === TASK_DISPLAY_STATUS.PENDING_APPROVAL && (
        <button
          onClick={e => { e.stopPropagation(); onApprove(task.id); }}
          className="mt-1.5 flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-500 hover:text-white transition-all"
        >
          <MdCheckCircle size={12} />
          Duyệt
        </button>
      )}
    </div>
  );
};

export default MiniTaskCard;
