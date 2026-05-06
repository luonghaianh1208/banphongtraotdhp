import { useState, useEffect } from 'react';
import {
  subscribeToPersonalTasks,
  createPersonalTask,
  updatePersonalTask,
  deletePersonalTask,
  cleanupOldPersonalTasks
} from '../firebase/firestore';

export const usePersonalTasks = (userId) => {
  const [personalTasks, setPersonalTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    // Cleanup tasks quá 30 ngày (chạy 1 lần mỗi session)
    cleanupOldPersonalTasks(userId).catch(() => {});

    const unsub = subscribeToPersonalTasks(
      userId,
      (data) => { setPersonalTasks(data); setLoading(false); },
      () => setLoading(false)
    );
    return () => unsub();
  }, [userId]);

  const addTask = async (data) => createPersonalTask(userId, data);
  const editTask = async (taskId, updates) => updatePersonalTask(userId, taskId, updates);
  const removeTask = async (taskId) => deletePersonalTask(userId, taskId);
  const toggleDone = async (taskId, currentDone) => updatePersonalTask(userId, taskId, { done: !currentDone });

  return { personalTasks, loading, addTask, editTask, removeTask, toggleDone };
};
