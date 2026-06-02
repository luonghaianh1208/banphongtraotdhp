import { useState } from 'react';
import toast from 'react-hot-toast';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { MdArticle, MdAttachFile, MdDelete, MdInsertDriveFile, MdPictureAsPdf, MdTableChart, MdVisibility } from 'react-icons/md';
import FilePreviewModal from '../common/FilePreviewModal';

const ALLOWED_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const getExtension = (name = '') => name.split('.').pop()?.toLowerCase() || '';

const isAllowedFile = (file) => (
    ALLOWED_TYPES.has(file.type) || ALLOWED_EXTENSIONS.includes(getExtension(file.name))
);

const getIcon = (file) => {
    const ext = getExtension(file?.name);
    if (ext === 'pdf') return MdPictureAsPdf;
    if (['xls', 'xlsx'].includes(ext)) return MdTableChart;
    if (['doc', 'docx'].includes(ext)) return MdArticle;
    return MdInsertDriveFile;
};

const getBadge = (file) => {
    const ext = getExtension(file?.name).toUpperCase() || 'FILE';
    const color = {
        PDF: 'bg-red-50 text-red-600 border-red-100',
        DOC: 'bg-blue-50 text-blue-600 border-blue-100',
        DOCX: 'bg-blue-50 text-blue-600 border-blue-100',
        XLS: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        XLSX: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    }[ext] || 'bg-gray-50 text-gray-600 border-gray-100';

    return { label: ext, color };
};

const CriteriaGuideFiles = ({
    files = [],
    onChange,
    readOnly = false,
    criteriaSetId = 'criteria-set',
    mucId = 'muc',
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewFile, setPreviewFile] = useState(null);

    const handleUpload = async (event) => {
        if (readOnly) return;
        const fileList = Array.from(event.target.files || []);
        if (!fileList.length) return;

        const invalid = fileList.find((file) => !isAllowedFile(file));
        if (invalid) {
            toast.error(`File "${invalid.name}" không đúng định dạng PDF, Word hoặc Excel.`);
            event.target.value = '';
            return;
        }

        const oversized = fileList.find((file) => file.size > MAX_FILE_SIZE);
        if (oversized) {
            toast.error(`File "${oversized.name}" vượt quá 25MB.`);
            event.target.value = '';
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const storage = getStorage();
            const uploadedFiles = await Promise.all(fileList.map(async (file) => {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const unique = crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(16).slice(2)}`;
                const fileRef = ref(storage, `evidence/criteria-guides/${criteriaSetId}/${mucId}/${unique}_${safeName}`);
                const uploadTask = uploadBytesResumable(fileRef, file);

                return new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
                        },
                        reject,
                        async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve({
                                name: file.name,
                                url,
                                path: fileRef.fullPath,
                                type: file.type,
                                size: file.size,
                                uploadedAt: new Date().toISOString(),
                            });
                        }
                    );
                });
            }));

            onChange([...(files || []), ...uploadedFiles]);
            toast.success(`Đã tải lên ${uploadedFiles.length} tài liệu.`);
        } catch (error) {
            console.error('Lỗi upload tài liệu tiêu chí:', error);
            toast.error('Không thể tải tài liệu lên. Vui lòng thử lại.');
        } finally {
            setUploading(false);
            setProgress(0);
            event.target.value = '';
        }
    };

    const removeFile = (index) => {
        if (readOnly) return;
        onChange((files || []).filter((_, idx) => idx !== index));
    };

    return (
        <div className="space-y-2">
            {!readOnly && (
                <div className="relative">
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-3 py-2 text-xs font-bold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-300">
                        <MdAttachFile size={16} />
                        <span>{uploading ? `Đang tải ${progress}%` : 'Đính kèm PDF / Word / Excel'}</span>
                    </div>
                </div>
            )}

            {(files || []).length > 0 && (
                <div className="space-y-1">
                    {files.map((file, index) => {
                        const Icon = getIcon(file);
                        const badge = getBadge(file);
                        return (
                            <div key={`${file.url}-${index}`} className="flex items-center gap-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs shadow-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800">
                                <Icon size={14} className="flex-shrink-0 text-gray-500" />
                                <button
                                    type="button"
                                    onClick={() => setPreviewFile(file)}
                                    className="min-w-0 flex-1 truncate text-left font-semibold text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-300"
                                    title={file.name}
                                >
                                    {file.name}
                                </button>
                                <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black ${badge.color}`}>
                                    {badge.label}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPreviewFile(file)}
                                    className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                                    title="Xem trước"
                                >
                                    <MdVisibility size={14} />
                                </button>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                                        title="Xóa tài liệu"
                                    >
                                        <MdDelete size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {previewFile && (
                <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
            )}
        </div>
    );
};

export default CriteriaGuideFiles;
