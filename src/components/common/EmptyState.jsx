// EmptyState — hiển thị khi không có dữ liệu
import { MdInbox } from 'react-icons/md';

const EmptyState = ({ icon: Icon = MdInbox, title = 'Không có dữ liệu', message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center fade-in">
      <div className="p-4 rounded-full bg-gray-100 mb-4">
        <Icon size={40} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 max-w-md">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
