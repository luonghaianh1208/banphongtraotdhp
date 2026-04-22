// FilePreviewModal — xem trước file đính kèm (PDF/ảnh/Word/Excel/PPT) bên trong app
import { useEffect, useCallback } from 'react';
import { MdClose, MdDownload, MdOpenInNew } from 'react-icons/md';

const FilePreviewModal = ({ file, onClose }) => {
  // Lưu trạng thái overflow gốc khi mở, phục hồi đúng khi đóng
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      // Phục hồi trạng thái overflow trước đó (không phải '' mà là giá trị gốc)
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // Download file thực sự qua fetch + Blob (vượt qua CORS của Firebase Storage)
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: mở trực tiếp trong tab mới
      window.open(file.url, '_blank');
    }
  }, [file]);

  if (!file) return null;

  const name = file.name?.toLowerCase() || '';
  const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf');
  const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
  const isWord = file.type?.includes('wordprocessingml') || file.type?.includes('msword') || /\.(doc|docx)$/i.test(name);
  const isExcel = file.type?.includes('spreadsheetml') || file.type?.includes('ms-excel') || /\.(xls|xlsx)$/i.test(name);
  const isPpt = file.type?.includes('presentationml') || file.type?.includes('ms-powerpoint') || /\.(ppt|pptx)$/i.test(name);
  // Word, Excel, PPT đều xem qua Google Docs Viewer
  const useGoogleViewer = isWord || isExcel || isPpt;

  const getTypeBadge = () => {
    if (isPdf) return { label: 'PDF', cls: 'bg-red-100 text-red-700' };
    if (isWord) return { label: 'Word', cls: 'bg-blue-100 text-blue-700' };
    if (isExcel) return { label: 'Excel', cls: 'bg-green-100 text-green-700' };
    if (isPpt) return { label: 'PPT', cls: 'bg-orange-100 text-orange-700' };
    if (isImage) return { label: 'Ảnh', cls: 'bg-emerald-100 text-emerald-700' };
    return { label: 'File', cls: 'bg-gray-100 text-gray-700' };
  };

  const typeBadge = getTypeBadge();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] m-4 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${typeBadge.cls}`}>
              {typeBadge.label}
            </span>
            <h3 className="text-sm font-medium text-gray-900 truncate">{file.name}</h3>
            {file.size && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {(file.size / 1024).toFixed(0)} KB
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors"
              title="Tải xuống"
            >
              <MdDownload size={20} />
            </button>
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
          {useGoogleViewer && (
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
          {!isPdf && !isImage && !useGoogleViewer && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-500">
              <p className="text-lg font-medium">Không thể xem trước loại file này</p>
              <button
                onClick={handleDownload}
                className="btn btn-primary"
              >
                <MdDownload size={18} /> Tải xuống
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
