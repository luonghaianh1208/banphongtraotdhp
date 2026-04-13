// PriorityBadge — hiển thị độ ưu tiên
import { PRIORITIES } from '../../utils/constants';

const PriorityBadge = ({ priority }) => {
  const config = PRIORITIES[priority];
  if (!config) return null;

  return (
    <span className={`badge ${config.class}`}>
      {config.label}
    </span>
  );
};

export default PriorityBadge;
