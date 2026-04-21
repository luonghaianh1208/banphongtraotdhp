import { useState, useEffect } from 'react';
import { subscribeToPlans, subscribeToPlansByType } from '../firebase/criteriaFirestore';

export const usePlans = (type = null) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        const callback = (data) => {
            setPlans(data);
            setLoading(false);
        };
        const errCallback = (err) => {
            console.error('Lỗi lấy plans:', err);
            setError(err);
            setLoading(false);
        };

        let unsubscribe;
        if (type) {
            unsubscribe = subscribeToPlansByType(type, callback, errCallback);
        } else {
            unsubscribe = subscribeToPlans(callback, errCallback);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [type]);

    return { plans, loading, error };
};
