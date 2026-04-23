import { useState, useEffect } from 'react';
import { subscribeToAssignments, subscribeToSetAssignments, subscribeToUnitAssignments } from '../firebase/criteriaFirestore';

// All assignments (admin)
export const useAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = subscribeToAssignments(
            (data) => { setAssignments(data); setLoading(false); },
            (err) => { console.error(err); setLoading(false); }
        );
        return unsub;
    }, []);

    return { assignments, loading };
};

// Assignments for a specific criteria set (admin detail page)
export const useSetAssignments = (criteriaSetId) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!criteriaSetId) { setLoading(false); return; }
        setLoading(true);
        const unsub = subscribeToSetAssignments(criteriaSetId,
            (data) => { setAssignments(data); setLoading(false); },
            (err) => { console.error(err); setLoading(false); }
        );
        return unsub;
    }, [criteriaSetId]);

    return { assignments, loading };
};

// Assignments for a specific unit (unit pages)
export const useUnitAssignments = (unitId) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!unitId) { setLoading(false); return; }
        setLoading(true);
        const unsub = subscribeToUnitAssignments(unitId,
            (data) => { setAssignments(data); setLoading(false); },
            (err) => { console.error(err); setLoading(false); }
        );
        return unsub;
    }, [unitId]);

    return { assignments, loading };
};
