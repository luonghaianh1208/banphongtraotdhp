// usePresence — track online presence bằng cách cập nhật lastActiveAt vào Firestore
// CHỈ dùng heartbeat + visibility change, KHÔNG bắt click/keydown để tránh
// race condition với AuthContext onSnapshot → gây mất route navigation
import { useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const HEARTBEAT_INTERVAL = 3_600_000; // 1 tiếng

const usePresence = () => {
  const { currentUser, userProfile } = useAuth();
  const intervalRef = useRef(null);
  const userIdRef = useRef(null);

  // Lưu userId vào ref để tránh re-create callback khi currentUser thay đổi ref
  useEffect(() => {
    userIdRef.current = currentUser?.uid || null;
  }, [currentUser?.uid]);

  const updatePresence = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastActiveAt: serverTimestamp(),
      });
    } catch (err) {
      // Silent fail — không block UX
    }
  }, []);

  useEffect(() => {
    if (!currentUser || !userProfile || userProfile.role === 'unit') return;

    // Update ngay khi mount
    updatePresence();

    // Heartbeat mỗi 1 phút — đủ để xác định online status
    intervalRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    // Chỉ update khi tab được focus lại (đã rời đi và quay lại)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, userProfile?.role]);
};

export default usePresence;
