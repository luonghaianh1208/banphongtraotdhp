// usePresence — track online presence bằng cách cập nhật lastActiveAt vào Firestore
import { useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const HEARTBEAT_INTERVAL = 60_000; // 1 phút

const usePresence = () => {
  const { currentUser, userProfile } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !userProfile || userProfile.role === 'unit') return;

    const updatePresence = async () => {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          lastActiveAt: serverTimestamp(),
        });
      } catch (err) {
        // Silent fail — không block UX
      }
    };

    // Update ngay khi mount
    updatePresence();

    // Heartbeat mỗi 1 phút
    intervalRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    // Update khi user tương tác (click, keypress, scroll)
    const onActivity = () => updatePresence();
    const throttledActivity = throttle(onActivity, HEARTBEAT_INTERVAL);

    window.addEventListener('focus', onActivity);
    window.addEventListener('click', throttledActivity);
    window.addEventListener('keydown', throttledActivity);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('focus', onActivity);
      window.removeEventListener('click', throttledActivity);
      window.removeEventListener('keydown', throttledActivity);
    };
  }, [currentUser, userProfile]);
};

// Simple throttle helper
function throttle(fn, delay) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

export default usePresence;
