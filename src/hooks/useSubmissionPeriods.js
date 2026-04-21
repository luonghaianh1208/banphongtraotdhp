import { useState, useEffect } from 'react';
import { subscribeToSubmissionPeriods } from '../firebase/criteriaFirestore';

export const useSubmissionPeriods = () => {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToSubmissionPeriods(
            (data) => {
                setPeriods(data);
                setLoading(false);
            },
            (err) => {
                console.error('Lỗi lấy submission periods:', err);
                setError(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    return { periods, loading, error };
};
