import { useState, useEffect } from 'react';
import { subscribeToUnits } from '../firebase/criteriaFirestore';

export const useUnits = () => {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeToUnits(
            (data) => {
                setUnits(data);
                setLoading(false);
            },
            (err) => {
                console.error('Lỗi lấy danh sách đơn vị:', err);
                setError(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    return { units, loading, error };
};
