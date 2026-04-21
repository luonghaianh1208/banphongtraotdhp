import {
    collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, onSnapshot, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from './config';

// ======================================
// 1. UNITS
// ======================================
export const subscribeToUnits = (callback, onError) => {
    const q = query(collection(db, 'units'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const units = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(units);
    }, onError);
};

export const getUnit = async (unitId) => {
    const snap = await getDoc(doc(db, 'units', unitId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUnit = async (unitId, updates) => {
    const ref = doc(db, 'units', unitId);
    return updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
};

export const deleteUnit = async (unitId) => {
    return deleteDoc(doc(db, 'units', unitId));
};

export const batchDeleteUnits = async (unitIds) => {
    const batch = writeBatch(db);
    unitIds.forEach(id => batch.delete(doc(db, 'units', id)));
    return batch.commit();
};

// ======================================
// 2. CRITERIA SETS
// ======================================
export const subscribeToCriteriaSets = (callback, onError) => {
    const q = query(collection(db, 'criteriaSets'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const sets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(sets);
    }, onError);
};

export const getCriteriaSet = async (setId) => {
    const snap = await getDoc(doc(db, 'criteriaSets', setId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createCriteriaSet = async (data) => {
    const colRef = collection(db, 'criteriaSets');
    return addDoc(colRef, { ...data, createdAt: serverTimestamp() });
};

export const updateCriteriaSet = async (setId, data) => {
    const ref = doc(db, 'criteriaSets', setId);
    return updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteCriteriaSet = async (setId) => {
    // Thực tế có thể nên soft-delete thay vì xóa cứng
    const ref = doc(db, 'criteriaSets', setId);
    return deleteDoc(ref);
};


// ======================================
// 3. SUBMISSION PERIODS
// ======================================
export const subscribeToSubmissionPeriods = (callback, onError) => {
    const q = query(collection(db, 'submissionPeriods'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const periods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(periods);
    }, onError);
};

export const getSubmissionPeriod = async (periodId) => {
    const snap = await getDoc(doc(db, 'submissionPeriods', periodId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createSubmissionPeriod = async (data) => {
    const colRef = collection(db, 'submissionPeriods');
    return addDoc(colRef, {
        ...data,
        status: 'draft',
        unitAssignments: {},
        createdAt: serverTimestamp()
    });
};

export const updateSubmissionPeriod = async (periodId, updates) => {
    const ref = doc(db, 'submissionPeriods', periodId);
    return updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
};

export const updateUnitAssignment = async (periodId, unitId, graderIds) => {
    const ref = doc(db, 'submissionPeriods', periodId);
    return updateDoc(ref, {
        [`unitAssignments.${unitId}`]: graderIds,
        updatedAt: serverTimestamp()
    });
};

// ======================================
// 4. SUBMISSIONS (BÀI NỘP CHỈ TIÊU)
// ======================================
export const subscribeToAllSubmissions = (periodId, callback, onError) => {
    const q = query(collection(db, 'submissions'), where('periodId', '==', periodId));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(items);
    }, onError);
};

export const subscribeToUnitSubmission = (periodId, unitId, callback, onError) => {
    const q = query(
        collection(db, 'submissions'),
        where('periodId', '==', periodId),
        where('unitId', '==', unitId)
    );
    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    }, onError);
};

export const createOrUpdateDraftSubmission = async (periodId, unitId, unitData, responses) => {
    // Tính tổng điểm tự chấm
    let totalSelfScore = 0;
    Object.values(responses).forEach(res => {
        totalSelfScore += (Number(res.selfScore) || 0);
    });

    const q = query(
        collection(db, 'submissions'),
        where('periodId', '==', periodId),
        where('unitId', '==', unitId)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        return updateDoc(docRef, {
            responses,
            totalSelfScore,
            lastEditedAt: serverTimestamp()
        });
    } else {
        // Tạo mới
        const data = {
            periodId,
            unitId,
            unitName: unitData.unitName,
            unitCode: unitData.unitCode,
            status: 'draft',
            responses,
            scores: {},
            totalSelfScore,
            totalOfficialScore: 0,
            maxTotalScore: 0, // Cần update từ CriteriaSet nếu cần
            classification: null,
            overallComment: '',
            assignedGraders: [],
            submittedAt: null,
            lastEditedAt: serverTimestamp(),
            createdAt: serverTimestamp()
        };
        return addDoc(collection(db, 'submissions'), data);
    }
};

export const submitSubmission = async (submissionId) => {
    const ref = doc(db, 'submissions', submissionId);
    return updateDoc(ref, {
        status: 'submitted',
        submittedAt: serverTimestamp(),
        lastEditedAt: serverTimestamp()
    });
};

export const updateSubmission = async (submissionId, updates) => {
    const ref = doc(db, 'submissions', submissionId);
    return updateDoc(ref, {
        ...updates,
        lastEditedAt: serverTimestamp()
    });
};

export const updateConditionScore = async (submissionId, conditionId, scoreData) => {
    const ref = doc(db, 'submissions', submissionId);
    // Cập nhật một condition cụ thể trong object scores
    return updateDoc(ref, {
        [`scores.${conditionId}`]: {
            ...scoreData,
            gradedAt: new Date()
        },
        // Chú ý: Cần xử lý trigger (ví dụ cloud function) để cộng dồn lại totalOfficialScore sau khi chấm
    });
};

export const saveOverallComment = async (submissionId, comment) => {
    const ref = doc(db, 'submissions', submissionId);
    return updateDoc(ref, {
        overallComment: comment
    });
};

// ======================================
// 5. PLANS (KẾ HOẠCH & THÔNG BÁO)
// ======================================
export const subscribeToPlans = (callback, onError) => {
    const q = query(collection(db, 'plans'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(plans);
    }, onError);
};

export const subscribeToPlansByType = (type, callback, onError) => {
    const q = query(
        collection(db, 'plans'),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(plans);
    }, onError);
};

export const getPlan = async (planId) => {
    const snap = await getDoc(doc(db, 'plans', planId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createPlan = async (data) => {
    const colRef = collection(db, 'plans');
    return addDoc(colRef, {
        ...data,
        status: 'draft',
        createdAt: serverTimestamp()
    });
};

export const updatePlan = async (planId, updates) => {
    const ref = doc(db, 'plans', planId);
    return updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
};

export const publishPlan = async (planId) => {
    const ref = doc(db, 'plans', planId);
    return updateDoc(ref, {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const deletePlan = async (planId) => {
    return deleteDoc(doc(db, 'plans', planId));
};

export const batchDeletePlans = async (planIds) => {
    const batch = writeBatch(db);
    planIds.forEach(id => batch.delete(doc(db, 'plans', id)));
    return batch.commit();
};

// ======================================
// 6. CONTEST ENTRIES (HỒ SƠ DỰ THI)
// ======================================
export const subscribeToContestEntries = (planId, callback, onError) => {
    const q = query(collection(db, 'contestEntries'), where('planId', '==', planId));
    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(entries);
    }, onError);
};

export const getUnitContestEntry = (planId, unitId, callback, onError) => {
    const q = query(
        collection(db, 'contestEntries'),
        where('planId', '==', planId),
        where('unitId', '==', unitId)
    );
    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    }, onError);
};

export const createOrUpdateContestEntry = async (planId, unitId, unitData, docsData) => {
    const q = query(
        collection(db, 'contestEntries'),
        where('planId', '==', planId),
        where('unitId', '==', unitId)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        return updateDoc(docRef, {
            docs: docsData,
            lastEditedAt: serverTimestamp()
        });
    } else {
        // Tạo mới
        const data = {
            planId,
            unitId,
            unitName: unitData.unitName,
            unitCode: unitData.unitCode,
            status: 'draft',
            docs: docsData,
            note: '',
            submittedAt: null,
            lastEditedAt: serverTimestamp(),
            createdAt: serverTimestamp()
        };
        return addDoc(collection(db, 'contestEntries'), data);
    }
};

export const submitContestEntry = async (entryId) => {
    const ref = doc(db, 'contestEntries', entryId);
    return updateDoc(ref, {
        status: 'submitted',
        submittedAt: serverTimestamp(),
        lastEditedAt: serverTimestamp()
    });
};
