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
      className={`card cursor-pointer group transition-all duration-200 ${
        task.isReminded
          ? 'border-2 border-red-500 animate-blink-border shadow-lg shadow-red-200/60 ring-1 ring-red-300'
          : 'hover:shadow-lg hover:border-primary-200'
      }`}
    >
      {/* Top row: title + status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex gap-2 items-start flex-1 min-w-0">
          {selectable && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
              className="mt-0.5 p-0.5 rounded hover:bg-gray-100 transition-colors shrink-0"
            >
              {selected ? <MdCheckBox size={20} className="text-primary-600" /> : <MdCheckBoxOutlineBlank size={20} className="text-gray-400" />}
            </button>
          )}
          <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors flex-1">
            {task.title}
          </h3>
        </div>
        <StatusBadge task={task} />
      </div>

      {/* Middle: meta info */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <MdPerson size={14} />
          {assigneeNames || 'Chưa giao'}
        </span>
        <span className="flex items-center gap-1">
          <MdAccessTime size={14} />
          {formatDateTime(task.deadline)}
        </span>
        {task.attachments?.length > 0 && (
          <span className="flex items-center gap-1">
            <MdAttachFile size={14} />
            {task.attachments.length} file
          </span>
        )}
      </div>

      {/* Bottom: priority + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {cat && cat.id !== 'other' && (
            <span className="badge text-xs" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
              {cat.name}
            </span>
          )}
          <span className="text-xs text-gray-400">• Giao bởi {creatorName}</span>
        </div>

        {/* Nút duyệt hoàn thành — chỉ admin */}
        {canApprove && !task.isCompleted && (
          <button
            onClick={(e) => { e.stopPropagation(); onApprove(task.id); }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <MdCheckCircle size={16} />
            Duyệt xong
          </button>
        )}
      </div>

      {/* Notes indicator */}
      {task.notes?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-50">
          <p className="text-xs text-gray-400 italic truncate">
            <MdStickyNote2 size={12} className="inline text-amber-500 mr-1" />
            {task.notes[task.notes.length - 1].content}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
