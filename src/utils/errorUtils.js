// Firebase error → Vietnamese message mapping
const FIREBASE_ERROR_MAP = {
    // Auth errors
    'auth/user-not-found': 'Không tìm thấy tài khoản này',
    'auth/wrong-password': 'Sai mật khẩu',
    'auth/email-already-in-use': 'Email này đã được sử dụng',
    'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự)',
    'auth/invalid-email': 'Email không hợp lệ',
    'auth/too-many-requests': 'Quá nhiều lần thử, vui lòng đợi rồi thử lại',
    'auth/network-request-failed': 'Lỗi kết nối mạng, kiểm tra lại Internet',
    'auth/popup-closed-by-user': 'Đã huỷ đăng nhập',
    'auth/requires-recent-login': 'Vui lòng đăng nhập lại để thực hiện thao tác này',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng',

    // Firestore errors
    'permission-denied': 'Bạn không có quyền thực hiện thao tác này',
    'not-found': 'Không tìm thấy dữ liệu',
    'already-exists': 'Dữ liệu đã tồn tại',
    'resource-exhausted': 'Hệ thống quá tải, vui lòng thử lại sau',
    'unavailable': 'Dịch vụ tạm thời không khả dụng',
    'deadline-exceeded': 'Yêu cầu quá lâu, vui lòng thử lại',
    'cancelled': 'Yêu cầu đã bị huỷ',
    'unauthenticated': 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại',

    // Storage errors
    'storage/unauthorized': 'Bạn không có quyền tải file này',
    'storage/canceled': 'Đã huỷ tải file',
    'storage/unknown': 'Lỗi không xác định khi tải file',
    'storage/object-not-found': 'File không tồn tại',
    'storage/quota-exceeded': 'Đã hết dung lượng lưu trữ',
};

/**
 * Chuyển Firebase error thành message tiếng Việt
 * @param {Error} error - Firebase error object
 * @param {string} fallback - Message mặc định nếu không map được
 * @returns {string} Vietnamese error message
 */
export const getVietnameseError = (error, fallback = 'Có lỗi xảy ra, vui lòng thử lại') => {
    if (!error) return fallback;

    // Firebase Auth errors: error.code = 'auth/xxx'
    // Firestore errors: error.code = 'permission-denied' hoặc error.message chứa code
    const code = error.code || '';

    if (FIREBASE_ERROR_MAP[code]) {
        return FIREBASE_ERROR_MAP[code];
    }

    // Fallback: nếu message ngắn và có vẻ technical → dùng fallback
    if (error.message && error.message.length < 100) {
        // Kiểm tra xem message có chứa code nào match không
        for (const [key, value] of Object.entries(FIREBASE_ERROR_MAP)) {
            if (error.message.includes(key)) return value;
        }
    }

    return fallback;
};
