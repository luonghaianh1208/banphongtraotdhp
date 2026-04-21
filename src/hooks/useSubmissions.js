import { useState, useEffect } from 'react';
import { subscribeToAllSubmissions, subscribeToUnitSubmission } from '../firebase/criteriaFirestore';

export const useSubmissions = (periodId) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!periodId) {
            setSubmissions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToAllSubmissions(
            periodId,
            (data) => {
                setSubmissions(data);
                setLoading(false);
            },
            (err) => {
                console.error('Lỗi lấy submissions:', err);
                setError(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [periodId]);

    return { submissions, loading, error };
};

export const useUnitSubmission = (periodId, unitId) => {
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!periodId || !unitId) {
            setSubmission(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToUnitSubmission(
            periodId,
            unitId,
            (data) => {
                setSubmission(data);
                setLoading(false);
            },
            (err) => {
                console.error('Lỗi lấy unit submission:', err);
                setError(err);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [periodId, unitId]);

    return { submission, loading, error };
};
