// Custom hook — realtime tasks listener với error state
// Admin/manager load tất cả tasks, member chỉ load task được giao
import { useState, useEffect } from 'react';
import { subscribeToTasks, subscribeToMyTasks } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { sortTasksProactively } from '../utils/statusUtils';
import toast from 'react-hot-toast';

export const useTasks = () => {
  const { currentUser, isMember } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handleData = (data) => {
      setTasks(sortTasksProactively(data));
      setLoading(false);
    };

    const handleError = (err) => {
      setError(err.message || 'Không thể tải danh sách công việc');
      setLoading(false);
      toast.error('Lỗi tải công việc. Thử tải lại trang.');
    };

    // Member chỉ load task được giao, admin/manager load tất cả
    const unsubscribe = isMember
      ? subscribeToMyTasks(currentUser.uid, handleData, handleError)
      : subscribeToTasks(handleData, handleError);

    return unsubscribe;
  }, [currentUser, isMember]);

  return { tasks, loading, error };
};
