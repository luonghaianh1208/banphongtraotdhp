import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { isFacebookEvidenceUrl } from '../../utils/evidenceLinks';
import {
    MdCloudUpload,
    MdInsertDriveFile,
    MdDelete,
    MdErrorOutline,
    MdInfoOutline,
    MdPictureAsPdf,
    MdImage,
    MdTableChart,
    MdArticle,
    MdAddLink,
    MdLink
} from 'react-icons/md';

const FILE_ICONS = {
    pdf: MdPictureAsPdf,
    jpg: MdImage,
    jpeg: MdImage,
    png: MdImage,
    gif: MdImage,
    webp: MdImage,
    svg: MdImage,
    bmp: MdImage,
    xls: MdTableChart,
    xlsx: MdTableChart,
    csv: MdTableChart,
    doc: MdArticle,
    docx: MdArticle,
};

const getFileIcon = (file) => {
    if (file && file.isLink) return MdLink;
    const ext = (file?.name || '').split('.').pop().toLowerCase();
    return FILE_ICONS[ext] || MdInsertDriveFile;
};

const getDisplayName = (fileName) => {
    if (!fileName) return 'Tep khong ten';
    const cleaned = fileName.replace(/^\d{13,}_/, '');
    const readable = cleaned.replace(/_/g, ' ');

    if (readable.length > 40) {
        const ext = readable.split('.').pop();
        if (!fileName.includes('.')) {
            return `${readable.substring(0, 37)}...`;
        }
        return `${readable.substring(0, 35)}...${ext}`;
    }

    return readable;
};

const getFileExtBadge = (file) => {
    if (file && file.isLink) {
        return { label: 'LINK', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' };
    }

    const ext = (file?.name || '').split('.').pop().toUpperCase();
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

const EvidenceUpload = ({
    files = [],
    onChange,
    readOnly = false,
    allowFileUpload = true,
    enforceFacebookLinks = false,
    helperText = '',
    linkButtonLabel = '',
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkName, setLinkName] = useState('');

    const handleFileUpload = async (e) => {
        if (!allowFileUpload || readOnly) return;

        const fileList = Array.from(e.target.files);
        if (!fileList.length) return;

        const oversized = fileList.find((file) => file.size > 25 * 1024 * 1024);
        if (oversized) {
            toast.error(`File "${oversized.name}" qua 25MB. Vui long chon file nho hon.`);
            return;
        }

        setUploading(true);
        setProgress(0);
        const storage = getStorage();

        try {
            const uploadPromises = fileList.map(async (file) => {
                const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const fileRef = ref(storage, `evidence/${Date.now()}_${safeFileName}`);
                const uploadTask = uploadBytesResumable(fileRef, file);

                return new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const nextProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setProgress(Math.round(nextProgress));
                        },
                        (error) => reject(error),
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve({
                                name: file.name,
                                url: downloadURL,
                                path: fileRef.fullPath,
                                uploadedAt: new Date().toISOString(),
                            });
                        }
                    );
                });
            });

            const newUploadedFiles = await Promise.all(uploadPromises);
            onChange([...files, ...newUploadedFiles]);
        } catch (error) {
            console.error('Loi upload file:', error);
            toast.error('Khong the tai file len. Vui long thu lai.');
        } finally {
            setUploading(false);
            setProgress(0);
            e.target.value = '';
        }
    };

    const handleAddLink = () => {
        let url = linkUrl.trim();
        if (!url) return;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `https://${url}`;
        }

        try {
            new URL(url);
        } catch {
            toast.error('Lien ket khong hop le.');
            return;
        }
        if (enforceFacebookLinks && !isFacebookEvidenceUrl(url)) {
            toast.error('Chỉ nhận link Facebook hoặc thanhdoanhaiphong.gov.vn đưa tin bài.');
            return;
        }

        const name = linkName.trim() || url;
        onChange([
            ...files,
            {
                name,
                url,
                isLink: true,
                uploadedAt: new Date().toISOString(),
            },
        ]);

        setLinkUrl('');
        setLinkName('');
        setShowLinkInput(false);
    };

    const handleRemove = (indexToRemove) => {
        if (readOnly) return;
        onChange(files.filter((_, index) => index !== indexToRemove));
    };

    const showLinkEditor = !readOnly && (showLinkInput || !allowFileUpload);
    const emptyText = readOnly
        ? 'Chua co minh chung'
        : allowFileUpload
            ? 'Chua co tep/link nao'
            : 'Chua co lien ket nao';

    return (
        <div className="space-y-2 w-full">
            {!readOnly && (
                <div className="space-y-2">
                    {(helperText || enforceFacebookLinks) && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
                            <div className="flex items-start gap-2">
                                <MdInfoOutline size={14} className="mt-0.5 flex-shrink-0" />
                                <span>{helperText || 'Chỉ nhập link Facebook hoặc thanhdoanhaiphong.gov.vn đưa tin bài. Link khác sẽ không được chấp nhận.'}</span>
                            </div>
                        </div>
                    )}
                    <div className={`flex gap-2 ${allowFileUpload ? '' : 'flex-col'}`}>
                        {allowFileUpload && (
                            <div className="relative group/dropzone flex-1 min-w-0">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                                />
                                <div
                                    className={`px-4 py-3 border border-dashed rounded-xl transition-all flex items-center gap-3 ${
                                        uploading
                                            ? 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800'
                                            : 'bg-emerald-50/20 border-emerald-500/20 group-hover/dropzone:bg-emerald-50/40 group-hover/dropzone:border-emerald-500/40 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:group-hover/dropzone:bg-emerald-500/10 dark:group-hover/dropzone:border-emerald-500/30'
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover/dropzone:scale-110 transition-transform">
                                        <MdCloudUpload size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                            {uploading ? 'Dang tai len...' : 'Nhan hoac keo tha file'}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                                            {'PDF, Anh, Word, Excel (<= 25MB)'}
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

                        {allowFileUpload && (
                            <button
                                type="button"
                                onClick={() => setShowLinkInput((prev) => !prev)}
                                className={`p-3 border border-dashed rounded-xl transition-all flex items-center justify-center gap-2 flex-shrink-0 ${
                                    linkButtonLabel ? 'w-auto px-4' : 'w-12'
                                } ${
                                    showLinkInput
                                        ? 'bg-indigo-50/50 border-indigo-300 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-500/50 dark:text-indigo-400'
                                        : 'bg-slate-50/20 border-slate-200 text-slate-400 hover:bg-slate-50/50 hover:text-slate-600 dark:bg-slate-800/20 dark:border-slate-700/50 dark:hover:bg-slate-800/50 dark:hover:text-slate-300'
                                }`}
                                title="Thêm liên kết URL"
                            >
                                <MdAddLink size={20} />
                                {linkButtonLabel && <span className="text-xs font-bold whitespace-nowrap">{linkButtonLabel}</span>}
                            </button>
                        )}
                    </div>

                    {showLinkEditor && (
                        <div className="p-3 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex gap-2 items-start">
                            <div className="flex-1 min-w-0 space-y-2">
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="input w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800"
                                />
                                <input
                                    type="text"
                                    value={linkName}
                                    onChange={(e) => setLinkName(e.target.value)}
                                    placeholder="Ten minh chung (tuy chon)"
                                    className="input w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddLink}
                                disabled={!linkUrl.trim()}
                                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold whitespace-nowrap h-[32px]"
                            >
                                Them
                            </button>
                        </div>
                    )}
                </div>
            )}

            {files.length > 0 ? (
                <div className="space-y-1">
                    {files.map((file, index) => {
                        const IconComponent = getFileIcon(file);
                        const displayName = getDisplayName(file.name);
                        const extBadge = getFileExtBadge(file);

                        return (
                            <div
                                key={index}
                                className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10 transition-colors w-full"
                            >
                                <IconComponent
                                    size={14}
                                    className={`${file.isLink ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'} flex-shrink-0`}
                                />
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 min-w-0 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 truncate transition-colors block"
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
                                        onClick={() => handleRemove(index)}
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
                    <MdErrorOutline size={14} className="flex-shrink-0" />
                    <span className="font-medium truncate">{emptyText}</span>
                </div>
            )}
        </div>
    );
};

export default EvidenceUpload;
