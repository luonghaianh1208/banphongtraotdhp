// AuthContext — quản lý trạng thái đăng nhập & user profile
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from '../firebase/config';
import { getUserProfile, logout } from '../firebase/auth';
import { initFirstAdmin } from '../firebase/functions';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải dùng trong AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    // Nếu Firebase chưa cấu hình, hiện login ngay
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsubProfile = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setProfileError(false);

      // Hủy listener profile cũ nếu có
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }

      if (user) {
        try {
          let profile = await getUserProfile(user.uid);

          if (!profile) {
            // User mới đăng nhập Google → tạo profile member
            const newProfile = {
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              role: 'member',
              isActive: false,
              status: 'pending',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              avatar: user.photoURL || null,
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);

            // Thử gán admin qua Cloud Function (atomic transaction)
            try {
              const result = await initFirstAdmin();
              if (result.data?.success) {
                newProfile.role = 'admin';
                newProfile.isActive = true;
                newProfile.status = 'approved';
              }
            } catch (cfErr) {
              console.warn('initFirstAdmin CF call failed (có thể admin đã tồn tại):', cfErr.message);
            }

            profile = { id: user.uid, ...newProfile };
          }

          // Nếu user cũ chưa có field status → coi như approved
          if (!profile.status) {
            profile.status = profile.isActive !== false ? 'approved' : 'pending';
          }

          // Check mustChangePassword (chỉ unit mới có)
          if (profile.role === 'unit' && profile.mustChangePassword) {
            setMustChangePassword(true);
          } else {
            setMustChangePassword(false);
          }

          setUserProfile(profile);

          // Subscribe realtime vào profile để khi admin duyệt → tự động cập nhật
          const targetCollection = profile.role === 'unit' ? 'units' : 'users';
          unsubProfile = onSnapshot(doc(db, targetCollection, user.uid), (snap) => {
            if (snap.exists()) {
              const data = { id: snap.id, ...snap.data() };
              if (!data.status) {
                data.status = data.isActive !== false ? 'approved' : 'pending';
              }
              // Check mustChangePassword realtime
              if (data.role === 'unit') {
                setMustChangePassword(data.mustChangePassword === true);
              }
              setUserProfile(prev => {
                if (!prev) return data;
                const importantFields = ['role', 'isActive', 'status', 'displayName', 'email', 'avatar', 'department', 'username', 'password', 'mustChangePassword'];
                const changed = importantFields.some(f => prev[f] !== data[f]);
                return changed ? data : prev;
              });
            }
          });

        } catch (err) {
          console.error('Lỗi lấy/tạo profile:', err);
          setUserProfile({
            id: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            role: 'member',
            isActive: false,
            status: 'pending',
          });
          setProfileError(true);
        }
      } else {
        setUserProfile(null);
        setMustChangePassword(false);
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Kiểm tra quyền
  const isApproved = userProfile?.status === 'approved';
  const isPending = userProfile?.status === 'pending';
  const isAdmin = isApproved && userProfile?.role === 'admin';
  const isManager = isApproved && userProfile?.role === 'manager';
  const isMember = isApproved && userProfile?.role === 'member';
  const isUnit = isApproved && userProfile?.role === 'unit';

  const canManageTasks = isAdmin || isManager;
  const canApprove = isAdmin;
  const canManageUsers = isAdmin;

  const value = {
    currentUser,
    userProfile,
    loading,
    profileError,
    isApproved,
    isPending,
    isAdmin,
    isManager,
    isMember,
    isUnit,
    mustChangePassword,
    canManageTasks,
    canApprove,
    canManageUsers,
    setUserProfile,
    firebaseConfigured,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
