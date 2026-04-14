import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, setDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, arrayUnion, writeBatch, limit
} from 'firebase/firestore';
import { db } from './config';
import { deleteFile } from './storage';

// === TASK CONFIG (categories & priorities) ===

const DEFAULT_CATEGORIES = [
  { id: 'other', name: 'Khác', color: '#9CA3AF' },
];

const DEFAULT_PRIORITIES = [
  { id: 'high', name: 'Cao', color: '#EF4444', order: 1 },
  { id: 'medium', name: 'Trung bình', color: '#F59E0B', order: 2 },
  { id: 'low', name: 'Thấp', color: '#3B82F6', order: 3 },
];

const DEFAULT_PENALTY_TYPES = [
  { id: 'overdue', name: 'Lỗi quá hạn', defaultAmount: 50000, isAutoOverdue: true, color: '#DC2626' },
  { id: 'spelling', name: 'Sai chính tả', defaultAmount: 10000, isAutoOverdue: false, color: '#D97706' },
];

// Lắng nghe realtime phân loại công việc
export const subscribeToCategories = (callback, onError) => {
  return onSnapshot(doc(db, 'config', 'categories'), (snap) => {
    if (snap.exists()) {
      callback(snap.data().items || DEFAULT_CATEGORIES);
    } else {
      callback(DEFAULT_CATEGORIES);
    }
  }, (error) => {
    console.error('Lỗi lắng nghe categories:', error);
    if (onError) onError(error);
    callback(DEFAULT_CATEGORIES);
  });
};

// Lắng nghe realtime mức độ ưu tiên
export const subscribeToPriorities = (callback, onError) => {
  return onSnapshot(doc(db, 'config', 'priorities'), (snap) => {
    if (snap.exists()) {
      callback(snap.data().items || DEFAULT_PRIORITIES);
    } else {
      callback(DEFAULT_PRIORITIES);
    }
  }, (error) => {
    console.error('Lỗi lắng nghe priorities:', error);
    if (onError) onError(error);
    callback(DEFAULT_PRIORITIES);
  });
};

// Lưu danh sách categories (admin)
export const saveCategories = async (items) => {
  return setDoc(doc(db, 'config', 'categories'), { items, updatedAt: serverTimestamp() });
};

// Lưu danh sách priorities (admin)
export const savePriorities = async (items) => {
  return setDoc(doc(db, 'config', 'priorities'), { items, updatedAt: serverTimestamp() });
};

// Lắng nghe realtime cấu hình vi phạm (penaltyTypes)
export const subscribeToPenaltyTypes = (callback, onError) => {
  return onSnapshot(doc(db, 'config', 'penaltyTypes'), (snap) => {
    if (snap.exists()) {
      callback(snap.data().items || DEFAULT_PENALTY_TYPES);
    } else {
      callback(DEFAULT_PENALTY_TYPES);
    }
  }, (error) => {
    console.error('Lỗi lắng nghe penaltyTypes:', error);
    if (onError) onError(error);
    callback(DEFAULT_PENALTY_TYPES);
  });
};

// Lưu cấu hình vi phạm (penaltyTypes)
export const savePenaltyTypes = async (items) => {
  return setDoc(doc(db, 'config', 'penaltyTypes'), { items, updatedAt: serverTimestamp() });
};

// === TASKS ===

// Lắng nghe realtime tất cả tasks ACTIVE (không gồm đã xóa)
export const subscribeToTasks = (callback, onError, maxItems = 500) => {
  const q = query(
    collection(db, 'tasks'),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(t => !t.isDeleted);
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
    // Client-side filter isDeleted vì Firestore không cho 2 field filter + array-contains
    const tasks = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(t => !t.isDeleted);
    callback(tasks);
  }, (error) => {
    console.error('Lỗi lắng nghe my tasks:', error);
    if (onError) onError(error);
    callback([]);
  });
};

// Lắng nghe realtime tasks TRONG THÙNG RÁC (admin only)
export const subscribeToTrash = (callback, onError) => {
  const q = query(
    collection(db, 'tasks'),
    where('isDeleted', '==', true)
  );
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
         const t1 = a.deletedAt?.toMillis ? a.deletedAt.toMillis() : 0;
         const t2 = b.deletedAt?.toMillis ? b.deletedAt.toMillis() : 0;
         return t2 - t1;
      });
    callback(tasks);
  }, (error) => {
    console.error('Lỗi lắng nghe trash:', error);
    if (onError) onError(error);
    callback([]);
  });
};

// Tạo task mới
export const createTask = async (taskData) => {
  const docRef = await addDoc(collection(db, 'tasks'), {
    ...taskData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isCompleted: false,
    isDeleted: false,
    completedAt: null,
    completedBy: null,
    notes: [],
    editHistory: [],
    attachments: taskData.attachments || [],
    status: 'active',
  });

  if (taskData.assignees && taskData.assignees.length > 0) {
    taskData.assignees.forEach(userId => {
      const isHigh = taskData.priority === 'high';
      addNotification(
        userId,
        isHigh ? 'Công việc GẤP mới' : 'Công việc mới',
        `Bạn được phân công công việc: ${taskData.title}`,
        isHigh ? 'warning' : 'info',
        docRef.id
      );
    });
  }

  return docRef;
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

// === TRASH OPERATIONS ===

// Soft-delete: chuyển task vào thùng rác
export const deleteTask = async (taskId) => {
  return updateDoc(doc(db, 'tasks', taskId), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
  });
};

// Soft-delete nhiều tasks cùng lúc
export const softDeleteTasks = async (taskIds) => {
  const batch = writeBatch(db);
  taskIds.forEach(id => {
    batch.update(doc(db, 'tasks', id), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });
  });
  return batch.commit();
};

// Khôi phục 1 task từ thùng rác
export const restoreTask = async (taskId) => {
  return updateDoc(doc(db, 'tasks', taskId), {
    isDeleted: false,
    deletedAt: null,
  });
};

// Khôi phục nhiều tasks
export const restoreTasks = async (taskIds) => {
  const batch = writeBatch(db);
  taskIds.forEach(id => {
    batch.update(doc(db, 'tasks', id), {
      isDeleted: false,
      deletedAt: null,
    });
  });
  return batch.commit();
};

// Xóa hẳn 1 task + file đính kèm trên Storage
export const permanentDeleteTask = async (taskId) => {
  const taskRef = doc(db, 'tasks', taskId);
  const snap = await getDoc(taskRef);

  if (snap.exists()) {
    const task = snap.data();
    // Xóa tất cả file đính kèm trên Storage
    if (task.attachments?.length > 0) {
      await Promise.allSettled(
        task.attachments.map(file => deleteFile(file.path).catch(() => {}))
      );
    }
  }

  return deleteDoc(taskRef);
};

// Xóa hẳn nhiều tasks + file đính kèm
export const permanentDeleteTasks = async (taskIds) => {
  // Phải xóa file trước, rồi mới xóa docs (vì cần đọc attachments)
  for (const id of taskIds) {
    await permanentDeleteTask(id);
  }
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

// == PENALTIES (Hình phạt thực tế) ==

// Lắng nghe tất cả các khoản phạt
export const subscribeToAllPenalties = (callback, onError) => {
  const q = query(collection(db, 'penalties'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => {
    console.error('Lỗi lắng nghe tất cả penalties:', error);
    if (onError) onError(error);
    callback([]);
  });
};

// Lắng nghe các khoản phạt của 1 công việc cụ thể
export const subscribeToTaskPenalties = (taskId, callback, onError) => {
  const q = query(collection(db, 'penalties'), where('taskId', '==', taskId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => {
    console.error('Lỗi lắng nghe penalties của task:', error);
    if (onError) onError(error);
    callback([]);
  });
};

// Tạo phiếu phạt
export const createPenalty = async (penaltyData) => {
  const docRef = await addDoc(collection(db, 'penalties'), {
    ...penaltyData,
    createdAt: new Date().toISOString(),
    status: penaltyData.status || 'unpaid',
    paidAmount: penaltyData.paidAmount || 0
  });

  // Gửi thông báo cho user bị phạt
  const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  addNotification(
    penaltyData.userId,
    'Giấy phạt vi phạm',
    `Bạn bị báo phạt ${formatVND(penaltyData.amount)} do vi phạm ở công việc "${penaltyData.taskTitle}". Vui lòng kiểm tra tab Quản lý Phạt.`,
    'error',
    penaltyData.taskId
  );

  return docRef;
};

// Xóa phiếu phạt
export const deletePenalty = async (penaltyId) => {
  return deleteDoc(doc(db, 'penalties', penaltyId));
};

// Xóa các phiếu phạt quá hạn của một task (khi task được gia hạn)
export const removeOverduePenaltiesForTask = async (taskId, autoPenaltyTypeId) => {
  if (!autoPenaltyTypeId) return;
  const q = query(
    collection(db, 'penalties'),
    where('taskId', '==', taskId),
    where('penaltyTypeId', '==', autoPenaltyTypeId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    return batch.commit();
  }
};

// Cập nhật trạng thái phiếu phạt (trả tiền)
export const updatePenalty = async (penaltyId, updates) => {
  return updateDoc(doc(db, 'penalties', penaltyId), updates);
};

// === NOTIFICATIONS ===

export const addNotification = async (userId, title, message, type = 'info', relatedTaskId = null) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type, // 'info', 'warning', 'success', 'error', 'urgent'
      relatedTaskId,
      isRead: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Lỗi tạo thông báo:', error);
  }
};

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

// Đánh dấu chưa đọc
export const markNotificationUnread = async (notifId) => {
  return updateDoc(doc(db, 'notifications', notifId), { isRead: false });
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
