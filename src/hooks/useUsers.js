// Custom hook — realtime users listener
import { useState, useEffect } from 'react';
import { subscribeToUsers } from '../firebase/firestore';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { users, loading };
};
