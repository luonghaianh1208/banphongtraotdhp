// TaskConfigContext — cung cấp categories & priorities realtime cho toàn app
import { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCategories, subscribeToPriorities } from '../firebase/firestore';

const TaskConfigContext = createContext(null);

export const useTaskConfig = () => {
  const ctx = useContext(TaskConfigContext);
  if (!ctx) throw new Error('useTaskConfig must be used within TaskConfigProvider');
  return ctx;
};

export const TaskConfigProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let catLoaded = false;
    let priLoaded = false;
    const checkDone = () => { if (catLoaded && priLoaded) setLoading(false); };

    const unsubCat = subscribeToCategories((items) => {
      setCategories(items);
      catLoaded = true;
      checkDone();
    });

    const unsubPri = subscribeToPriorities((items) => {
      setPriorities(items);
      priLoaded = true;
      checkDone();
    });

    return () => { unsubCat(); unsubPri(); };
  }, []);

  // Helper: tìm category theo id
  const getCategoryById = (id) => {
    if (!id || id === 'other') return categories.find(c => c.id === 'other') || { id: 'other', name: 'Khác', color: '#9CA3AF' };
    return categories.find(c => c.id === id) || { id: 'other', name: 'Khác', color: '#9CA3AF' };
  };

  // Helper: tìm priority theo id
  const getPriorityById = (id) => {
    return priorities.find(p => p.id === id) || priorities[0] || { id: 'medium', name: 'Trung bình', color: '#F59E0B' };
  };

  return (
    <TaskConfigContext.Provider value={{ categories, priorities, loading, getCategoryById, getPriorityById }}>
      {children}
    </TaskConfigContext.Provider>
  );
};
