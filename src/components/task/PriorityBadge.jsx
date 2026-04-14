// PriorityBadge — hiển thị độ ưu tiên (đọc từ Firestore config)
import { useTaskConfig } from '../../context/TaskConfigContext';
import { PRIORITIES } from '../../utils/constants';

const PriorityBadge = ({ priority }) => {
  const { getPriorityById } = useTaskConfig();
  const config = getPriorityById(priority);

  // Fallback về constants nếu không tìm thấy
  const fallback = PRIORITIES[priority];
  const label = config?.name || fallback?.label || priority;
  const color = config?.color || fallback?.color || '#9CA3AF';

  return (
    <span
      className="badge text-xs font-semibold"
      style={{ backgroundColor: color + '20', color: color }}
    >
      {label}
    </span>
  );
};

export default PriorityBadge;
