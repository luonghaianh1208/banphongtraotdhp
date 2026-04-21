// StatusBadge — hiển thị badge trạng thái task với icon SVG + màu tương ứng
import { MdSchedule, MdTimelapse, MdWarning, MdError, MdUpdate, MdCheckCircle, MdHourglassTop } from 'react-icons/md';
import { getTaskDisplayStatus } from '../../utils/statusUtils';

const iconMap = {
  schedule: MdSchedule,
  timelapse: MdTimelapse,
  warning: MdWarning,
  error: MdError,
  update: MdUpdate,
  checkCircle: MdCheckCircle,
  hourglass: MdHourglassTop,
};

const StatusBadge = ({ task }) => {
  const status = getTaskDisplayStatus(task);
  const Icon = iconMap[status.iconName];

  return (
    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 shadow-sm ${status.badgeClass}`}>
      {Icon && <Icon size={12} className="shrink-0" />}
      {status.label}
    </span>
  );
};

export default StatusBadge;
