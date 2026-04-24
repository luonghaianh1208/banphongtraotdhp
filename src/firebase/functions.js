// Cloud Functions callable references
import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

// Tạo tài khoản user mới (chỉ admin)
export const createUserAccount = httpsCallable(functions, 'createUser');

// Set quyền cho user (chỉ admin)
export const setUserRole = httpsCallable(functions, 'setUserRole');

// Duyệt hoàn thành task (chỉ admin)
export const approveTask = httpsCallable(functions, 'approveTask');

// Gia hạn deadline (admin hoặc manager)
export const extendDeadline = httpsCallable(functions, 'extendDeadline');

// Xóa tài khoản thành viên (chỉ admin) — xóa Auth + Firestore
export const deleteUserAccount = httpsCallable(functions, 'deleteUser');

// Xóa tài khoản đơn vị (chỉ admin) — xóa Auth + Firestore
export const deleteUnitAccount = httpsCallable(functions, 'deleteUnit');

// Công bố đợt báo cáo (tính điểm và khóa đợt)
export const publishPeriodResults = httpsCallable(functions, 'publishPeriodResults');

// Khởi tạo Admin đầu tiên (đảm bảo atomic, chống race condition)
export const initFirstAdmin = httpsCallable(functions, 'initFirstAdmin');
