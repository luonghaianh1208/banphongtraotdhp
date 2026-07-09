import {
    collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
    query, where, orderBy, onSnapshot, serverTimestamp, writeBatch, setDoc, limit
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
    const BATCH_LIMIT = 500;
    for (let i = 0; i < unitIds.length; i += BATCH_LIMIT) {
        const chunk = unitIds.slice(i, i + BATCH_LIMIT);
        const batch = writeBatch(db);
        chunk.forEach(id => batch.delete(doc(db, 'units', id)));
        await batch.commit();
    }
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
// (Old submission tracking functions removed)
// (Old createOrUpdateDraftSubmission removed)

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

export const addPlanActivityLog = async (planId, logData) => {
    const colRef = collection(db, 'plans', planId, 'activityLogs');
    return addDoc(colRef, {
        action: logData.action || 'update',
        message: logData.message || '',
        actorId: logData.actorId || null,
        actorName: logData.actorName || '',
        actorRole: logData.actorRole || '',
        changes: logData.changes || {},
        createdAt: serverTimestamp(),
    });
};

const normalizePlanLogData = (logData) => ({
    action: logData.action || 'update',
    message: logData.message || '',
    actorId: logData.actorId || null,
    actorName: logData.actorName || '',
    actorRole: logData.actorRole || '',
    changes: logData.changes || {},
    createdAt: serverTimestamp(),
});

export const createPlanWithActivityLog = async (data, logData) => {
    const planRef = doc(collection(db, 'plans'));
    const logRef = doc(collection(db, 'plans', planRef.id, 'activityLogs'));
    const batch = writeBatch(db);
    batch.set(planRef, {
        ...data,
        status: 'draft',
        createdAt: serverTimestamp()
    });
    batch.set(logRef, normalizePlanLogData(logData));
    await batch.commit();
    return planRef;
};

export const updatePlanWithActivityLog = async (planId, updates, logData) => {
    const planRef = doc(db, 'plans', planId);
    const logRef = doc(collection(db, 'plans', planId, 'activityLogs'));
    const batch = writeBatch(db);
    batch.update(planRef, { ...updates, updatedAt: serverTimestamp() });
    batch.set(logRef, normalizePlanLogData(logData));
    return batch.commit();
};

export const subscribeToPlanActivityLogs = (planId, callback, onError) => {
    const q = query(
        collection(db, 'plans', planId, 'activityLogs'),
        orderBy('createdAt', 'desc'),
        limit(30)
    );
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, onError);
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
    const BATCH_LIMIT = 500;
    for (let i = 0; i < planIds.length; i += BATCH_LIMIT) {
        const chunk = planIds.slice(i, i + BATCH_LIMIT);
        const batch = writeBatch(db);
        chunk.forEach(id => batch.delete(doc(db, 'plans', id)));
        await batch.commit();
    }
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
        await updateDoc(docRef, {
            docs: docsData,
            lastEditedAt: serverTimestamp()
        });
        return docRef.id;
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
        const docRef = await addDoc(collection(db, 'contestEntries'), data);
        return docRef.id;
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

// ======================================
// 7. CRITERIA ASSIGNMENTS (GIAO TIÊU CHÍ)
// ======================================

// Giao 1 bộ TC cho nhiều đơn vị
export const assignCriteriaToUnits = async (criteriaSet, unitList, assignedBy) => {
    const batch = writeBatch(db);
    const colRef = collection(db, 'criteriaAssignments');
    const now = new Date();
    unitList.forEach(unit => {
        const newRef = doc(colRef);
        batch.set(newRef, {
            criteriaSetId: criteriaSet.id,
            criteriaSetTitle: criteriaSet.title || '',
            unitId: unit.id,
            unitName: unit.unitName || unit.name || '',
            assignedBy,
            assignedAt: now,
            status: 'active',
            revokedAt: null,
            revokedBy: null,
        });
    });
    await batch.commit();
};

// Thu hồi
export const revokeCriteriaAssignment = async (assignmentId, revokedBy) => {
    const ref = doc(db, 'criteriaAssignments', assignmentId);
    return updateDoc(ref, {
        status: 'revoked',
        revokedAt: serverTimestamp(),
        revokedBy,
    });
};

// Mở lại (un-revoke)
export const reactivateCriteriaAssignment = async (assignmentId) => {
    const ref = doc(db, 'criteriaAssignments', assignmentId);
    return updateDoc(ref, {
        status: 'active',
        revokedAt: null,
        revokedBy: null,
    });
};

// Admin xem tất cả assignments
export const subscribeToAssignments = (callback, onError) => {
    const q = query(collection(db, 'criteriaAssignments'), orderBy('assignedAt', 'desc'));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, onError);
};

// Admin xem assignments cho 1 bộ TC
export const subscribeToSetAssignments = (criteriaSetId, callback, onError) => {
    const q = query(
        collection(db, 'criteriaAssignments'),
        where('criteriaSetId', '==', criteriaSetId),
        orderBy('assignedAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, onError);
};

// Đơn vị xem assignments của mình (active only)
export const subscribeToUnitAssignments = (unitId, callback, onError) => {
    const q = query(
        collection(db, 'criteriaAssignments'),
        where('unitId', '==', unitId),
        where('status', '==', 'active')
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, onError);
};

// ======================================
// 8. CRITERIA SUBMISSIONS (BÀI NỘP THEO TC)
// ======================================

export const getCriteriaSubmission = async (submissionId) => {
    const snap = await getDoc(doc(db, 'criteriaSubmissions', submissionId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Lưu / cập nhật bài nộp (upsert — tìm doc bằng criteriaSetId + unitId)
export const saveUnitCriteriaResponse = async (criteriaSetId, unitId, unitName, responses, totalSelfScore, periodId = null) => {
    const compId = `${criteriaSetId}_${unitId}`;
    const ref = doc(db, 'criteriaSubmissions', compId);

    return setDoc(ref, {
        criteriaSetId,
        unitId,
        unitName,
        responses: responses || {},
        totalSelfScore: totalSelfScore || 0,
        periodId: periodId || null,
        status: 'draft',
        lastSavedAt: serverTimestamp(),
    }, { merge: true });
};

// Đơn vị nộp chính thức
export const submitCriteriaSubmission = async (criteriaSetId, unitId) => {
    const compId = `${criteriaSetId}_${unitId}`;
    const ref = doc(db, 'criteriaSubmissions', compId);
    return setDoc(ref, {
        status: 'submitted',
        submittedAt: serverTimestamp(),
    }, { merge: true });
};

// Theo dõi bài nộp 1 đơn vị cho 1 TC
export const subscribeToUnitCriteriaSubmission = (criteriaSetId, unitId, callback, onError) => {
    const compId = `${criteriaSetId}_${unitId}`;
    return onSnapshot(doc(db, 'criteriaSubmissions', compId), (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() });
        } else {
            callback(null);
        }
    }, onError);
};

// Admin xem tất cả bài nộp cho 1 bộ TC
export const subscribeToAllCriteriaSubmissions = (criteriaSetId, callback, onError) => {
    const q = query(
        collection(db, 'criteriaSubmissions'),
        where('criteriaSetId', '==', criteriaSetId)
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, onError);
};

// Cấp trên chấm điểm
export const gradeCriteriaSubmission = async (submissionId, gradedScores, comment, gradedBy) => {
    const ref = doc(db, 'criteriaSubmissions', submissionId);
    const totalGradedScore = Object.values(gradedScores || {}).reduce((s, v) => {
        if (typeof v === 'object') {
            const score = v.afterJustificationScore !== undefined && v.afterJustificationScore !== null && v.afterJustificationScore !== ''
                ? Number(v.afterJustificationScore)
                : Number(v.officialScore || 0);
            return s + score;
        }
        return s + (Number(v) || 0);
    }, 0);

    return updateDoc(ref, {
        gradedScores: gradedScores || {},
        totalGradedScore,
        gradedComment: comment || '',
        gradedBy,
        gradedAt: serverTimestamp(),
        status: 'graded',
    });
};

// Đơn vị nộp giải trình
export const submitUnitJustification = async (criteriaSetId, unitId, justificationResponses) => {
    const compId = `${criteriaSetId}_${unitId}`;
    const ref = doc(db, 'criteriaSubmissions', compId);
    const updates = {
        justifiedAt: serverTimestamp(),
        justificationStatus: 'submitted'
    };
    Object.entries(justificationResponses || {}).forEach(([mucId, response]) => {
        updates[`justificationResponses.${mucId}`] = response;
    });
    return updateDoc(ref, updates);
};

// ======================================
// 9. JUSTIFICATION REQUESTS (YÊU CẦU GIẢI TRÌNH)
// ======================================

/**
 * Gửi yêu cầu giải trình cho nhiều đơn vị cùng lúc.
 * @param {string} criteriaSetId
 * @param {Object} selectionsByUnit - { unitId: [mucId1, mucId2, ...], ... }
 * @param {string} deadline - ISO date string "YYYY-MM-DD"
 * @param {string} sentBy - admin UID
 */
export const sendJustificationRequest = async (criteriaSetId, selectionsByUnit, deadline, sentBy) => {
    const requestId = `jr_${Date.now()}`;
    const batch = writeBatch(db);
    const criteriaSetSnap = await getDoc(doc(db, 'criteriaSets', criteriaSetId));
    const criteriaSetData = criteriaSetSnap.exists() ? criteriaSetSnap.data() : {};
    const periodId = criteriaSetData.periodId || null;

    for (const [unitId, mucIds] of Object.entries(selectionsByUnit)) {
        const compId = `${criteriaSetId}_${unitId}`;
        const ref = doc(db, 'criteriaSubmissions', compId);
        const snap = await getDoc(ref);

        const existing = snap.exists() ? snap.data() : {};
        const existingRequests = existing.justificationRequests || [];
        const existingGradedScores = existing.gradedScores || {};

        // Update gradedScores: set requireJustification + justificationDeadline per mucId
        const updatedGradedScores = { ...existingGradedScores };
        mucIds.forEach(mucId => {
            const current = updatedGradedScores[mucId] || { officialScore: '', feedback: '' };
            updatedGradedScores[mucId] = {
                ...current,
                requireJustification: true,
                justificationDeadline: deadline,
            };
        });

        // Append new justification request
        const newRequest = {
            id: requestId,
            items: mucIds,
            deadline,
            sentAt: new Date(),
            sentBy,
            status: 'active',
        };

        if (snap.exists()) {
            const updates = {
                gradedScores: updatedGradedScores,
                justificationRequests: [...existingRequests, newRequest],
            };
            if (periodId && !existing.periodId) updates.periodId = periodId;
            batch.update(ref, updates);
        } else {
            // Doc chưa tồn tại → tạo mới với setDoc thay vì skip
            batch.set(ref, {
                criteriaSetId,
                unitId,
                periodId,
                gradedScores: updatedGradedScores,
                justificationRequests: [newRequest],
                status: 'pending',
            });
        }
    }

    await batch.commit();
    return requestId;
};
