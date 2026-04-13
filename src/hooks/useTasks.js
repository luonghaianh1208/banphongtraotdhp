// Custom hook — realtime tasks listener
import { useState, useEffect } from 'react';
import { subscribeToTasks } from '../firebase/firestore';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTasks((data) => {
      setTasks(data);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { tasks, loading };
};
