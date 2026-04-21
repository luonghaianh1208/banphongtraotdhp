import { useState, useEffect } from 'react';
import { subscribeToContestEntries, getUnitContestEntry } from '../firebase/criteriaFirestore';

export const useContestEntries = (planId) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!planId) {
            setEntries([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToContestEntries(
            planId,
            (data) => {
                setEntries(data);
                setLoading(false);
            },
            (err) => {
                console.error('Lỗi lấy contest entries:', err);
                setError(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [planId]);

    return { entries, loading, error };
};

export const useUnitContestEntry = (planId, unitId) => {
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!planId || !unitId) {
            setEntry(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = getUnitContestEntry(
            planId,
            unitId,
            (data) => {
                setEntry(data);
                setLoading(false);
            },
            (err) => {
                console.error('Lỗi lấy unit contest entry:', err);
                setError(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [planId, unitId]);

    return { entry, loading, error };
};
