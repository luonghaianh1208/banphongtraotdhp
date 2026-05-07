// Hook realtime subscribe danh sách chương trình điểm danh
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const useAttendancePrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'attendancePrograms'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          startTime: data.startTime?.toDate?.() || null,
          endTime: data.endTime?.toDate?.() || null,
          createdAt: data.createdAt?.toDate?.() || null,
        };
      });
      setPrograms(list);
      setLoading(false);
    }, (error) => {
      console.error('Error loading attendance programs:', error);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { programs, loading };
};

export default useAttendancePrograms;
