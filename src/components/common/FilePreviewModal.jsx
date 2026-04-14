// FilePreviewModal — xem trước file đính kèm (PDF/ảnh) bên trong app
import { useEffect } from 'react';
import { MdClose, MdDownload, MdOpenInNew } from 'react-icons/md';

const FilePreviewModal = ({ file, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!file) return null;

  const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
  const isWord = file.type?.includes('wordprocessingml') || file.type?.includes('msword') || /\.(doc|docx)$/i.test(file.name);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] m-4 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${
              isPdf ? 'bg-red-100 text-red-700' : isWord ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {isPdf ? 'PDF' : isWord ? 'Word' : 'Ảnh'}
            </span>
            <h3 className="text-sm font-medium text-gray-900 truncate">{file.name}</h3>
            {file.size && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {(file.size / 1024).toFixed(0)} KB
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <a
              href={file.url}
              download={file.name}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
              title="Tải xuống"
            >
              <MdDownload size={20} />
            </a>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
              title="Mở trong tab mới"
            >
              <MdOpenInNew size={20} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
              title="Đóng (Esc)"
            >
              <MdClose size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {isPdf && (
            <iframe
              src={`${file.url}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
              title={`Preview: ${file.name}`}
            />
          )}
          {isWord && (
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`}
              className="w-full h-full border-0"
              title={`Preview: ${file.name}`}
            />
          )}
          {isImage && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
          {!isPdf && !isImage && !isWord && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-500">
              <p className="text-lg font-medium">Không thể xem trước loại file này</p>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <MdDownload size={18} /> Tải xuống
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
