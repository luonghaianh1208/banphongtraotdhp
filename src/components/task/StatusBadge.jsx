// StatusBadge — hiển thị badge trạng thái task với màu tương ứng
import { getTaskDisplayStatus } from '../../utils/statusUtils';

const StatusBadge = ({ task }) => {
  const status = getTaskDisplayStatus(task);

  return (
    <span className={`badge ${status.badgeClass}`}>
      {status.emoji} {status.label}
    </span>
  );
};

export default StatusBadge;
