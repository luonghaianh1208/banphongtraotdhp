import { useState, useEffect } from 'react';
import Modal from './Modal';
import { MdNewReleases, MdCheckCircle } from 'react-icons/md';

const APP_VERSION = '3.1.2';

const WhatsNewModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Đợi 1 chút để UI load mượt, sau đó check version
    const timer = setTimeout(() => {
      const lastSeenVersion = localStorage.getItem('lastSeenVersion');
      if (lastSeenVersion !== APP_VERSION) {
        setIsOpen(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    localStorage.setItem('lastSeenVersion', APP_VERSION);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Modal title={`Có gì mới trong bản ${APP_VERSION}?`} onClose={handleDismiss}>
      <div className="space-y-4 text-gray-700">
        <div className="flex items-center gap-3 text-primary-600 bg-primary-50 p-3 rounded-lg border border-primary-100">
          <MdNewReleases size={28} className="shrink-0" />
          <div>
            <h3 className="font-bold text-lg leading-tight">Cập nhật lớn phiên bản {APP_VERSION}</h3>
            <p className="text-sm mt-1">Hệ thống vừa cập nhật những tính năng cực kỳ xịn xò để quản lý công việc hiệu quả và tiện lợi hơn!</p>
          </div>
        </div>

        <ul className="space-y-3 mt-4 text-sm font-medium">
          {[
            'Nhắc việc tự động',
            'Cập nhật tab hôm nay siêu tiện lợi dành cho tổ trưởng',
            'Tab tất cả công việc thay đổi logic sắp xếp thông minh ưu tiên đẩy nhanh tiến độ',
            'Cập nhật phạt tự động lỗi quá hạn',
            'Gửi duyệt và chờ phê duyệt từ tổ trưởng',
            'Tải được nhiều file 2 chiều giữa nhân viên và tổ trưởng'
          ].map((item, idx) => (
            <li key={idx} className="flex gap-2 items-start bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <MdCheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        <div className="pt-4 flex justify-end gap-3 flex-wrap">
          <button onClick={handleDismiss} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200">
            Xem sau
          </button>
          <button onClick={handleConfirm} className="btn btn-primary">
            Đã hiểu & Trải nghiệm ngay
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsNewModal;
