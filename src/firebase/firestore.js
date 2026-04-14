import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, arrayUnion, writeBatch, limit
} from 'firebase/firestore';
import { db } from './config';

// === TASKS ===

// Lắng nghe realtime tất cả tasks (có giới hạn)
export const subscribeToTasks = (callback, onError, maxItems = 500) => {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'), limit(maxItems));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tasks);
  }, (error) => {
    console.error('Lỗi lắng nghe tasks:', error);
    if (onError) onError(error);
    callback([]);
  });
};

// Lắng nghe realtime tasks của 1 user (member chỉ cần load task của mình)
export const subscribeToMyTasks = (userId, callback, onError) => {
  const q = query(
    collection(db, 'tasks'),
    where('assignees', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tasks);
  }, (error) => {
    console.error('Lỗi lắng nghe my tasks:', error);
    if (onError) onError(error);
    callback([]);
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
export const subscribeToUsers = (callback, onError) => {
  const q = query(collection(db, 'users'), orderBy('displayName'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(users);
  }, (error) => {
    console.error('Lỗi lắng nghe users:', error);
    if (onError) onError(error);
    callback([]);
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
export const subscribeToNotifications = (userId, callback, onError) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifs);
  }, (error) => {
    console.error('Lỗi lắng nghe notifications:', error);
    if (onError) onError(error);
    callback([]);
  });
};

// Đánh dấu đã đọc
export const markNotificationRead = async (notifId) => {
  return updateDoc(doc(db, 'notifications', notifId), { isRead: true });
};

// Đánh dấu tất cả đã đọc
export const markAllNotificationsRead = async (notifications) => {
  const unread = notifications.filter(n => !n.isRead);
  if (unread.length === 0) return;

  const batch = writeBatch(db);
  unread.forEach(n => {
    batch.update(doc(db, 'notifications', n.id), { isRead: true });
  });
  return batch.commit();
};
