// Custom hook — realtime users listener với error state
import { useState, useEffect } from 'react';
import { subscribeToUsers } from '../firebase/firestore';
import toast from 'react-hot-toast';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToUsers(
      (data) => {
        setUsers(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Không thể tải danh sách thành viên');
        setLoading(false);
        toast.error('Lỗi tải danh sách thành viên.');
      }
    );

    return unsubscribe;
  }, []);

  return { users, loading, error };
};
