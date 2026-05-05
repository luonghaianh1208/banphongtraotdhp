import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { MdCloudUpload, MdInsertDriveFile, MdDelete, MdCheckCircle, MdErrorOutline, MdPictureAsPdf, MdImage, MdTableChart, MdArticle } from 'react-icons/md';

const FILE_ICONS = {
    pdf: MdPictureAsPdf,
    jpg: MdImage, jpeg: MdImage, png: MdImage, gif: MdImage, webp: MdImage, svg: MdImage, bmp: MdImage,
    xls: MdTableChart, xlsx: MdTableChart, csv: MdTableChart,
    doc: MdArticle, docx: MdArticle,
};

const getFileIcon = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    return FILE_ICONS[ext] || MdInsertDriveFile;
};

const getDisplayName = (fileName) => {
    if (!fileName) return 'Tệp không tên';
    // Strip timestamp prefix pattern: "1234567890123_" 
    const cleaned = fileName.replace(/^\d{13,}_/, '');
    // Restore spaces from underscores (original upload sanitization)
    const readable = cleaned.replace(/_/g, ' ');
    // Truncate if too long, keep extension
    if (readable.length > 40) {
        const ext = readable.split('.').pop();
        return readable.substring(0, 35) + '….' + ext;
    }
    return readable;
};

const getFileExtBadge = (fileName) => {
    const ext = (fileName || '').split('.').pop().toUpperCase();
    const colorMap = {
        PDF: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        DOC: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        DOCX: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        XLS: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        XLSX: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        PNG: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        JPG: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        JPEG: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return {
        label: ext,
        color: colorMap[ext] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    };
};

const EvidenceUpload = ({ files = [], onChange, readOnly = false }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = async (e) => {
        if (readOnly) return;
        const fileList = Array.from(e.target.files);
        if (!fileList.length) return;

        const oversized = fileList.find(f => f.size > 25 * 1024 * 1024);
        if (oversized) {
            toast.error(`File "${oversized.name}" quá 25MB. Vui lòng chọn file nhỏ hơn.`);
            return;
        }

        setUploading(true);
        setProgress(0);
        const storage = getStorage();

        try {
            const uploadPromises = fileList.map(async (file) => {
                const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const fileRef = ref(storage, `evidence/${Date.now()}_${safeFileName}`);
                const uploadTask = uploadBytesResumable(fileRef, file);

                return new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setProgress(Math.round(p));
                        },
                        (error) => reject(error),
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve({
                                name: file.name,
                                url: downloadURL,
                                path: fileRef.fullPath,
                                uploadedAt: new Date().toISOString()
                            });
                        }
                    );
                });
            });

            const newUploadedFiles = await Promise.all(uploadPromises);
            onChange([...files, ...newUploadedFiles]);
        } catch (error) {
            console.error('Lỗi upload file:', error);
            toast.error('Không thể tải file lên. Vui lòng thử lại.');
        } finally {
            setUploading(false);
            setProgress(0);
            e.target.value = '';
        }
    };

    const handleRemove = (indexToRemove) => {
        if (readOnly) return;
        onChange(files.filter((_, i) => i !== indexToRemove));
    };

    return (
        <div className="space-y-2">
            {!readOnly && (
                <div className="relative group/dropzone">
                    <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`px-4 py-3 border border-dashed rounded-xl transition-all flex items-center gap-3
                        ${uploading
                            ? 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800'
                            : 'bg-emerald-50/20 border-emerald-500/20 group-hover/dropzone:bg-emerald-50/40 group-hover/dropzone:border-emerald-500/40 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:group-hover/dropzone:bg-emerald-500/10 dark:group-hover/dropzone:border-emerald-500/30'
                        }
                    `}>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover/dropzone:scale-110 transition-transform">
                            <MdCloudUpload size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {uploading ? 'Đang tải lên...' : 'Nhấn hoặc kéo thả để tải minh chứng'}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                PDF, Ảnh, Word, Excel (≤ 25MB)
                            </p>
                        </div>
                    </div>
                    {uploading && (
                        <div className="absolute inset-x-4 -bottom-0.5 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            )}

            {files.length > 0 ? (
                <div className="space-y-1">
                    {files.map((file, i) => {
                        const IconComponent = getFileIcon(file.name);
                        const displayName = getDisplayName(file.name);
                        const extBadge = getFileExtBadge(file.name);

                        return (
                            <div
                                key={i}
                                className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10 transition-colors"
                            >
                                <IconComponent size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 min-w-0 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 truncate transition-colors"
                                    title={file.name}
                                >
                                    {displayName}
                                </a>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${extBadge.color} flex-shrink-0`}>
                                    {extBadge.label}
                                </span>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(i)}
                                        className="p-1 text-slate-300 hover:text-rose-500 rounded transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                    >
                                        <MdDelete size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 dark:text-slate-500">
                    <MdErrorOutline size={14} />
                    <span className="font-medium">{readOnly ? 'Chưa có minh chứng' : 'Chưa có tệp nào'}</span>
                </div>
            )}
        </div>
    );
};

export default EvidenceUpload;
