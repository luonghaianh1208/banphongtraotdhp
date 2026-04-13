// Firestore helper functions — CRUD operations cho tasks và users
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { db } from './config';

// === TASKS ===

// Lắng nghe realtime tất cả tasks
export const subscribeToTasks = (callback) => {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tasks);
  });
};

// Tạo task mới
export const createTask = async (taskData) => {
  return addDoc(collection(db, 'tasks'), {
    ...taskData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isCompleted: false,
    completedAt: null,
    completedBy: null,
    notes: [],
    editHistory: [],
    attachments: taskData.attachments || [],
    status: 'active',
  });
};

// Cập nhật task
export const updateTask = async (taskId, updates, editedBy, editInfo) => {
  const taskRef = doc(db, 'tasks', taskId);
  const updateData = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  // Ghi lại lịch sử chỉnh sửa
  if (editInfo) {
    updateData.editHistory = arrayUnion({
      ...editInfo,
      editedBy,
      editedAt: new Date().toISOString(),
    });
  }

  return updateDoc(taskRef, updateData);
};

// Thêm ghi chú vào task
export const addNote = async (taskId, note) => {
  const taskRef = doc(db, 'tasks', taskId);
  return updateDoc(taskRef, {
    notes: arrayUnion({
      ...note,
      createdAt: new Date().toISOString(),
    }),
    updatedAt: serverTimestamp(),
  });
};

// Xóa task
export const deleteTask = async (taskId) => {
  return deleteDoc(doc(db, 'tasks', taskId));
};

// === USERS ===

// Lắng nghe realtime danh sách users
export const subscribeToUsers = (callback) => {
  const q = query(collection(db, 'users'), orderBy('displayName'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(users);
  });
};

// Lấy 1 user
export const getUser = async (userId) => {
  const docSnap = await getDoc(doc(db, 'users', userId));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

// === NOTIFICATIONS ===

// Lắng nghe thông báo của user hiện tại
export const subscribeToNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifs);
  });
};

// Đánh dấu đã đọc
export const markNotificationRead = async (notifId) => {
  return updateDoc(doc(db, 'notifications', notifId), { isRead: true });
};

// Đánh dấu tất cả đã đọc
export const markAllNotificationsRead = async (notifications) => {
  const promises = notifications
    .filter(n => !n.isRead)
    .map(n => updateDoc(doc(db, 'notifications', n.id), { isRead: true }));
  return Promise.all(promises);
};
