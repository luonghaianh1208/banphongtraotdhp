// Modal component — popup dialog tái sử dụng (React Portal)
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Overlay backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm fade-in"
        onClick={onClose}
      />

      {/* Modal box */}
      <div
        className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col overflow-hidden z-10 slide-in-right`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Đóng cửa sổ"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
