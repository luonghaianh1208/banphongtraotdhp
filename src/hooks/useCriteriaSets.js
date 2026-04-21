import { useState, useEffect } from 'react';
import { subscribeToCriteriaSets } from '../firebase/criteriaFirestore';

export const useCriteriaSets = () => {
    const [criteriaSets, setCriteriaSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToCriteriaSets(
            (data) => {
                setCriteriaSets(data);
                setLoading(false);
            },
            (err) => {
                console.error('Lỗi lấy criteriaSets:', err);
                setError(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    return { criteriaSets, loading, error };
};
