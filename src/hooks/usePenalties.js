import { useState, useEffect } from 'react';
import { subscribeToTaskPenalties, createPenalty, deletePenalty, updatePenalty, subscribeToAllPenalties } from '../firebase/firestore';

export const useTaskPenalties = (taskId) => {
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setPenalties([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeToTaskPenalties(taskId, (data) => {
      setPenalties(data);
      setLoading(false);
    });

    return () => unsub();
  }, [taskId]);

  return { penalties, loading };
};

export const useAllPenalties = () => {
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAllPenalties((data) => {
      setPenalties(data);
      setLoading(false);
    }, (err) => {
      console.error('[useAllPenalties] Lỗi realtime:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { penalties, loading };
};

export const usePenaltyActions = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const addPenalty = async (penaltyData) => {
    setIsProcessing(true);
    try {
      await createPenalty(penaltyData);
      return true;
    } catch (error) {
      console.error('Error adding penalty:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const removePenalty = async (penaltyId) => {
    setIsProcessing(true);
    try {
      await deletePenalty(penaltyId);
      return true;
    } catch (error) {
      console.error('Error removing penalty:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const markPenaltyPaid = async (penaltyId, paidAmount, isFullyPaid = true) => {
    setIsProcessing(true);
    try {
      await updatePenalty(penaltyId, {
        paidAmount,
        status: isFullyPaid ? 'paid' : 'unpaid',
        paidAt: isFullyPaid ? new Date().toISOString() : null
      });
      return true;
    } catch (error) {
      console.error('Error updating penalty:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const undoPenaltyPaid = async (penaltyId) => {
    setIsProcessing(true);
    try {
      await updatePenalty(penaltyId, {
        paidAmount: 0,
        status: 'unpaid',
        paidAt: null
      });
      return true;
    } catch (error) {
      console.error('Error undoing penalty payment:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    addPenalty,
    removePenalty,
    markPenaltyPaid,
    undoPenaltyPaid,
    isProcessing
  };
};
