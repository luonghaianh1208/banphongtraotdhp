// Auth helper functions
import { signInWithCustomToken, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

// Đăng nhập bằng Google (chỉ dành cho nội bộ: admin/manager/member)
export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  try {
    // Tạo profile member nếu chưa có
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: 'member',
        isActive: false,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        avatar: user.photoURL || null,
      });
    }
  } catch (firestoreError) {
    console.warn('Không thể tạo user profile trong Firestore:', firestoreError.message);
  }

  return result;
};

// Đăng nhập đơn vị bằng Email/Password (đồng bộ từ Backend)
import { signInWithEmailAndPassword } from 'firebase/auth';

export const loginUnitWithEmail = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Đăng xuất
export const logout = () => signOut(auth);

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
