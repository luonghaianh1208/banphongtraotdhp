// Auth helper functions
import { signInWithEmailAndPassword, signOut, updatePassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

// Đăng nhập bằng Google
export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Tạo user document trong Firestore nếu chưa có
  try {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: 'member',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        avatar: user.photoURL || null,
      });
    }
  } catch (firestoreError) {
    // Nếu Firestore rules chặn ghi, vẫn cho phép login thành công
    // Admin sẽ cần cập nhật rules hoặc tạo user document thủ công
    console.warn('Không thể tạo user profile trong Firestore:', firestoreError.message);
  }

  return result;
};

// Đăng nhập bằng email/password
export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Đăng xuất
export const logout = () => signOut(auth);

// Đổi mật khẩu
export const changePassword = (newPassword) => {
  return updatePassword(auth.currentUser, newPassword);
};

// Lấy thông tin user profile từ Firestore
export const getUserProfile = async (uid) => {
  // Ưu tiên check bảng users trước
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return { id: userDocSnap.id, ...userDocSnap.data() };
  }

  // Bảng users không có thì check bảng units
  const unitDocRef = doc(db, 'units', uid);
  const unitDocSnap = await getDoc(unitDocRef);
  if (unitDocSnap.exists()) {
    return { id: unitDocSnap.id, ...unitDocSnap.data() };
  }

  return null;
};
