// StatusBadge — hiển thị badge trạng thái task với icon SVG + màu tương ứng
import { MdSchedule, MdTimelapse, MdWarning, MdError, MdUpdate, MdCheckCircle } from 'react-icons/md';
import { getTaskDisplayStatus } from '../../utils/statusUtils';

const iconMap = {
  schedule: MdSchedule,
  timelapse: MdTimelapse,
  warning: MdWarning,
  error: MdError,
  update: MdUpdate,
  checkCircle: MdCheckCircle,
};

const StatusBadge = ({ task }) => {
  const status = getTaskDisplayStatus(task);
  const Icon = iconMap[status.iconName];

  return (
    <span className={`badge ${status.badgeClass}`}>
      {Icon && <Icon size={13} className="mr-0.5 -ml-0.5" />}
      {status.label}
    </span>
  );
};

export default StatusBadge;
