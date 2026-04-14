// AuthContext — quản lý trạng thái đăng nhập & user profile
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from '../firebase/config';
import { getUserProfile } from '../firebase/auth';

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

  useEffect(() => {
    // Nếu Firebase chưa cấu hình, hiện login ngay
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setProfileError(false);

      if (user) {
        try {
          let profile = await getUserProfile(user.uid);

          // Nếu chưa có profile trong Firestore, tự tạo từ thông tin Auth
          if (!profile) {
            // Kiểm tra xem đã có admin nào chưa — nếu chưa, user đầu tiên thành admin
            const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
            const isFirstUser = usersSnap.empty;

            const newProfile = {
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              role: isFirstUser ? 'admin' : 'member',
              isActive: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              avatar: user.photoURL || null,
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            profile = { id: user.uid, ...newProfile };
          }

          setUserProfile(profile);
        } catch (err) {
          console.error('Lỗi lấy/tạo profile:', err);
          // Tạo profile tạm từ Firebase Auth để app không bị kẹt
          setUserProfile({
            id: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            role: 'member',
            isActive: true,
          });
          setProfileError(true);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Kiểm tra quyền
  const isAdmin = userProfile?.role === 'admin';
  const isManager = userProfile?.role === 'manager';
  const isMember = userProfile?.role === 'member';
  const canManageTasks = isAdmin || isManager;
  const canApprove = isAdmin;
  const canManageUsers = isAdmin;

  const value = {
    currentUser,
    userProfile,
    loading,
    profileError,
    isAdmin,
    isManager,
    isMember,
    canManageTasks,
    canApprove,
    canManageUsers,
    setUserProfile,
    firebaseConfigured,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
