// ConfirmDialog — dialog xác nhận hành động nguy hiểm (React Portal)
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MdWarning } from 'react-icons/md';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Xác nhận', danger = false }) => {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

      {/* Dialog box */}
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
            <MdWarning size={24} className={danger ? 'text-red-600' : 'text-amber-600'} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn btn-secondary">Hủy</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
