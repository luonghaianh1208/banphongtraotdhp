import React, { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const EvidenceUpload = ({ files = [], onChange, readOnly = false }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = async (e) => {
        if (readOnly) return;
        const fileList = Array.from(e.target.files);
        if (!fileList.length) return;

        setUploading(true);
        setProgress(0);
        const storage = getStorage();

        try {
            const uploadPromises = fileList.map(async (file) => {
                // Sanitize file name
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
            alert('Không thể tải file lên. Vui lòng thử lại.');
        } finally {
            setUploading(false);
            setProgress(0);
            e.target.value = ''; // Reset file input
        }
    };

    const handleRemove = (indexToRemove) => {
        if (readOnly) return;
        onChange(files.filter((_, i) => i !== indexToRemove));
    };

    return (
        <div>
            {!readOnly && (
                <div className="mb-3">
                    <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-600 file:text-white
              hover:file:bg-indigo-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors cursor-pointer"
                    />
                    {uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                </div>
            )}

            {files.length > 0 ? (
                <ul className="space-y-2 mt-2">
                    {files.map((file, i) => (
                        <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                            <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:text-indigo-700 hover:underline truncate max-w-[80%] font-medium flex items-center"
                                title={file.name}
                            >
                                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                {file.name}
                            </a>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(i)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md focus:outline-none transition-colors ml-2"
                                    title="Xóa minh chứng"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 italic py-2">
                    {readOnly ? 'Chưa có minh chứng đính kèm' : 'Chưa có file nào được chọn'}
                </p>
            )}
        </div>
    );
};

export default EvidenceUpload;
