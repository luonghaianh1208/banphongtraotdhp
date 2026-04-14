// SettingsPage — hồ sơ cá nhân: đổi tên, tải ảnh đại diện
import { useState, useRef } from 'react';
import { MdPerson, MdEdit, MdCameraAlt, MdSave, MdClose } from 'react-icons/md';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadFile, validateFile } from '../firebase/storage';
import { useAuth } from '../context/AuthContext';
import { ROLES, ORG_NAME } from '../utils/constants';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const fileInputRef = useRef(null);

  // Trạng thái chỉnh sửa tên
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Trạng thái upload ảnh
  const [uploading, setUploading] = useState(false);

  // === Đổi tên hiển thị ===
  const startEditName = () => {
    setNewName(userProfile?.displayName || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return toast.error('Tên không được để trống');
    if (newName.trim() === userProfile?.displayName) {
      setEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: newName.trim(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Đã cập nhật tên hiển thị');
      setEditingName(false);
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSavingName(false);
    }
  };

  // === Upload ảnh đại diện ===
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Chỉ cho phép ảnh
    if (!file.type.startsWith('image/')) {
      return toast.error('Vui lòng chọn file ảnh');
    }
    // Giới hạn 5MB
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Ảnh tối đa 5MB');
    }

    setUploading(true);
    try {
      const url = await uploadFile(file, `avatars/${currentUser.uid}`);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        avatar: url,
        updatedAt: serverTimestamp(),
      });
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (err) {
      toast.error('Lỗi tải ảnh: ' + err.message);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const avatarUrl = userProfile?.avatar;
  const initials = userProfile?.displayName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="max-w-2xl mx-auto fade-in space-y-6">
      {/* Thông tin cá nhân */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-5">
          <MdPerson size={20} /> Hồ sơ cá nhân
        </h3>

        {/* Avatar + Tên */}
        <div className="flex items-center gap-5 mb-5">
          {/* Avatar with upload overlay */}
          <div className="relative group shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-20 h-20 rounded-full shadow-md object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-3xl shadow-md">
                {initials}
              </div>
            )}
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute inset-0 w-20 h-20 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <MdCameraAlt size={24} className="text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Tên hiển thị */}
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  className="input text-base font-medium flex-1"
                  autoFocus
                  placeholder="Nhập tên hiển thị..."
                />
                <button onClick={handleSaveName} disabled={savingName} className="p-2 rounded-lg text-green-600 hover:bg-green-50">
                  <MdSave size={20} />
                </button>
                <button onClick={() => setEditingName(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100">
                  <MdClose size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">{userProfile?.displayName}</p>
                <button onClick={startEditName} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Đổi tên hiển thị">
                  <MdEdit size={16} />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-0.5">{currentUser?.email}</p>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-center">
            <span className="w-32 text-sm text-gray-500">Vai trò:</span>
            <span className={`badge ${
              userProfile?.role === 'admin' ? 'bg-red-100 text-red-700' :
              userProfile?.role === 'manager' ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {ROLES[userProfile?.role]?.label}
            </span>
          </div>
          <div className="flex items-center">
            <span className="w-32 text-sm text-gray-500">Tổ chức:</span>
            <span className="text-sm text-gray-900">{ORG_NAME}</span>
          </div>
          <div className="flex items-center">
            <span className="w-32 text-sm text-gray-500">Đăng nhập:</span>
            <span className="text-sm text-gray-900">Google</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 italic">
          Thay đổi tên hoặc ảnh đại diện sẽ tự động đồng bộ trên toàn bộ hệ thống.
        </p>
      </div>

      {/* App info */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Thông tin ứng dụng</h3>
        <p className="text-sm text-gray-500">Phiên bản 2.0.0</p>
        <p className="text-sm text-gray-500">© 2026 {ORG_NAME}</p>
      </div>
    </div>
  );
};

export default SettingsPage;
