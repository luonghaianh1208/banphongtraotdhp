import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { MdCloudUpload, MdInsertDriveFile, MdDelete, MdCheckCircle, MdErrorOutline } from 'react-icons/md';

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
        <div className="space-y-4">
            {!readOnly && (
                <div className="relative group/dropzone">
                    <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`p-8 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-4
                        ${uploading
                            ? 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800'
                            : 'bg-emerald-50/20 border-emerald-500/20 group-hover/dropzone:bg-emerald-50/40 group-hover/dropzone:border-emerald-500/40 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:group-hover/dropzone:bg-emerald-500/10 dark:group-hover/dropzone:border-emerald-500/30'
                        }
                    `}>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm group-hover/dropzone:scale-110 group-hover/dropzone:rotate-3 transition-transform duration-300">
                            <MdCloudUpload size={32} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {uploading ? 'Đang tải lên...' : 'Kéo thả hoặc nhấn để chọn minh chứng'}
                            </p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                PDF, Hình ảnh, Word, Excel (Tối đa 25MB)
                            </p>
                        </div>
                    </div>
                    {uploading && (
                        <div className="absolute inset-x-8 -bottom-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            )}

            {files.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    {files.map((file, i) => (
                        <div key={i} className="group relative flex items-center p-3.5 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 hover:border-emerald-500/30">
                            <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                <MdInsertDriveFile size={22} />
                            </div>
                            <div className="ml-3.5 flex-1 min-w-0 pr-8">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={file.name}>
                                    {file.name}
                                </p>
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline gap-1"
                                >
                                    Xem chi tiết
                                    <MdCheckCircle className="text-emerald-500/50" size={12} />
                                </a>
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(i)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <MdDelete size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-3 p-5 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <MdErrorOutline size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                            {readOnly ? 'Chưa có minh chứng' : 'Danh sách trống'}
                        </p>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                            {readOnly ? 'Đơn vị chưa đính kèm tài liệu nào.' : 'Vui lòng tải lên tài liệu để làm minh chứng.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvidenceUpload;
