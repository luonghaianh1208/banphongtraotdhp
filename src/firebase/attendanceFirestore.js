// Firestore & Storage helpers cho module Điểm danh
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, where, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';

const programsRef = collection(db, 'attendancePrograms');
const recordsRef = collection(db, 'attendanceRecords');

// === CHƯƠNG TRÌNH ===

export const createAttendanceProgram = async (data) => {
  return addDoc(programsRef, {
    title: data.title,
    description: data.description || '',
    startTime: Timestamp.fromDate(new Date(data.startTime)),
    endTime: Timestamp.fromDate(new Date(data.endTime)),
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: 'open',
  });
};

export const updateAttendanceProgram = async (id, data) => {
  const updates = { updatedAt: serverTimestamp() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.startTime) updates.startTime = Timestamp.fromDate(new Date(data.startTime));
  if (data.endTime) updates.endTime = Timestamp.fromDate(new Date(data.endTime));
  if (data.status) updates.status = data.status;
  return updateDoc(doc(db, 'attendancePrograms', id), updates);
};

export const deleteAttendanceProgram = async (id) => {
  // Xoá tất cả records liên quan
  const q = query(recordsRef, where('programId', '==', id));
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.allSettled(deletePromises);
  // Xoá chương trình
  return deleteDoc(doc(db, 'attendancePrograms', id));
};

// === BẢN GHI ĐIỂM DANH ===

export const submitAttendanceRecord = async (data) => {
  return addDoc(recordsRef, {
    programId: data.programId,
    unitId: data.unitId,
    unitName: data.unitName,
    representativeName: data.representativeName,
    representativePhone: data.representativePhone,
    arrivalTime: data.arrivalTime,
    arrivalTimestamp: Timestamp.fromDate(new Date(data.arrivalTimestamp)),
    participantCount: Number(data.participantCount),
    photos: data.photos || [],
    submittedAt: serverTimestamp(),
  });
};

export const updateAttendanceRecord = async (id, data) => {
  const updates = { updittedAt: serverTimestamp() };
  if (data.representativeName) updates.representativeName = data.representativeName;
  if (data.representativePhone) updates.representativePhone = data.representativePhone;
  if (data.arrivalTime) updates.arrivalTime = data.arrivalTime;
  if (data.arrivalTimestamp) updates.arrivalTimestamp = Timestamp.fromDate(new Date(data.arrivalTimestamp));
  if (data.participantCount) updates.participantCount = Number(data.participantCount);
  if (data.photos) updates.photos = data.photos;
  return updateDoc(doc(db, 'attendanceRecords', id), updates);
};

// === UPLOAD ẢNH ===

export const uploadAttendancePhotos = async (programId, unitId, files) => {
  const urls = [];
  for (const file of files) {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `attendance/${programId}/${unitId}/${fileName}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    urls.push(url);
  }
  return urls;
};

export const deleteAttendancePhotos = async (urls) => {
  const promises = urls.map(url => {
    try {
      const storageRef = ref(storage, url);
      return deleteObject(storageRef);
    } catch {
      return Promise.resolve();
    }
  });
  await Promise.allSettled(promises);
};
