// Firebase Storage helpers — upload/download file đính kèm
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

// Upload file vào Firebase Storage
export const uploadFile = async (file, taskId, userId) => {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `tasks/${taskId}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);

  return {
    name: file.name,
    url,
    path,
    type: file.type,
    size: file.size,
    uploadedBy: userId,
    uploadedAt: new Date().toISOString(),
  };
};

// Xóa file từ Storage
export const deleteFile = async (filePath) => {
  const storageRef = ref(storage, filePath);
  return deleteObject(storageRef);
};

// Kiểm tra file hợp lệ (chỉ cho phép PDF, Word, ảnh)
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const validateFile = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Chỉ chấp nhận file PDF, Word (.docx), hoặc ảnh (jpg/png)' };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File không được vượt quá 10MB' };
  }
  return { valid: true };
};
