// Hook realtime subscribe bản ghi điểm danh theo programId
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

const useAttendanceRecords = (programId) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'attendanceRecords'),
      where('programId', '==', programId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || null,
          arrivalTimestamp: data.arrivalTimestamp?.toDate?.() || null,
        };
      });
      setRecords(list);
      setLoading(false);
    }, (error) => {
      console.error('Error loading attendance records:', error);
      setLoading(false);
    });

    return unsub;
  }, [programId]);

  return { records, loading };
};

export default useAttendanceRecords;
