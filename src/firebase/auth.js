// Auth helper functions
import { signInWithEmailAndPassword, signOut, updatePassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

// Đăng nhập bằng Google
export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Kiểm tra xem user đã có trong Firestore chưa
  const docRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    // Nếu chưa có (user mới), tạo document mặc định với role: 'member'
    // Lưu ý: User đầu tiên có thể cần sửa thủ công thành 'admin' trong Firestore Console
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
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};
