import { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCategories, subscribeToPriorities, subscribeToPenaltyTypes } from '../firebase/firestore';

const TaskConfigContext = createContext(null);

export const useTaskConfig = () => {
  const ctx = useContext(TaskConfigContext);
  if (!ctx) throw new Error('useTaskConfig must be used within TaskConfigProvider');
  return ctx;
};

export const TaskConfigProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [penaltyTypes, setPenaltyTypes] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let catLoaded = false;
    let priLoaded = false;
    let penLoaded = false;
    const checkDone = () => { if (catLoaded && priLoaded && penLoaded) setLoading(false); };

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

    const unsubPen = subscribeToPenaltyTypes((items) => {
      setPenaltyTypes(items);
      penLoaded = true;
      checkDone();
    });

    return () => { unsubCat(); unsubPri(); unsubPen(); };
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

  // Helper: tìm penalty type theo id
  const getPenaltyTypeById = (id) => {
    return penaltyTypes.find(p => p.id === id) || null;
  };

  return (
    <TaskConfigContext.Provider value={{ categories, priorities, penaltyTypes, loading, getCategoryById, getPriorityById, getPenaltyTypeById }}>
      {children}
    </TaskConfigContext.Provider>
  );
};
