/*
 * Cloud Functions — Quản lý công việc Ban PT TĐHP
 * Các hàm admin: tạo user, set role, duyệt task, gia hạn, gửi email nhắc
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

initializeApp();
const db = getFirestore();

// Helper: kiểm tra quyền admin
async function requireAdmin(uid) {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists || userDoc.data().role !== "admin") {
    throw new HttpsError("permission-denied", "Chỉ Tổ trưởng mới có quyền thực hiện");
  }
  return userDoc.data();
}

// Helper: kiểm tra quyền admin hoặc manager
async function requireAdminOrManager(uid) {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists || !["admin", "manager"].includes(userDoc.data().role)) {
    throw new HttpsError("permission-denied", "Bạn không có quyền thực hiện");
  }
  return userDoc.data();
}

// === 1. TẠO TÀI KHOẢN THÀNH VIÊN ===
exports.createUser = onCall(async (request) => {
  const { email, password, displayName, role } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdmin(callerUid);

  // Tạo Firebase Auth user
  const userRecord = await getAuth().createUser({
    email,
    password,
    displayName,
  });

  // Tạo document trong Firestore
  await db.collection("users").doc(userRecord.uid).set({
    email,
    displayName,
    role: role || "member",
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { uid: userRecord.uid, message: `Đã tạo tài khoản cho ${displayName}` };
});

// === 2. SET QUYỀN CHO USER ===
exports.setUserRole = onCall(async (request) => {
  const { userId, role } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdmin(callerUid);

  if (!["admin", "manager", "member"].includes(role)) {
    throw new HttpsError("invalid-argument", "Vai trò không hợp lệ");
  }

  await db.collection("users").doc(userId).update({
    role,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { message: `Đã cập nhật quyền thành ${role}` };
});

// === 3. DUYỆT HOÀN THÀNH TASK ===
exports.approveTask = onCall(async (request) => {
  const { taskId } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdmin(callerUid);

  await db.collection("tasks").doc(taskId).update({
    isCompleted: true,
    status: "completed",
    completedAt: FieldValue.serverTimestamp(),
    completedBy: callerUid,
    updatedAt: FieldValue.serverTimestamp(),
    editHistory: FieldValue.arrayUnion({
      action: "approve",
      field: "isCompleted",
      oldValue: "false",
      newValue: "true",
      editedBy: callerUid,
      editedAt: new Date().toISOString(),
    }),
  });

  // Tạo notification cho người thực hiện
  const taskDoc = await db.collection("tasks").doc(taskId).get();
  const task = taskDoc.data();
  if (task?.assignees) {
    const adminDoc = await db.collection("users").doc(callerUid).get();
    const adminName = adminDoc.data()?.displayName || "Tổ trưởng";

    for (const uid of task.assignees) {
      await db.collection("notifications").add({
        userId: uid,
        taskId,
        type: "task_completed",
        message: `✅ "${task.title}" đã được ${adminName} duyệt hoàn thành`,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  return { message: "Đã duyệt hoàn thành" };
});

// === 4. GIA HẠN DEADLINE ===
exports.extendDeadline = onCall(async (request) => {
  const { taskId, newDeadline } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdminOrManager(callerUid);

  const taskRef = db.collection("tasks").doc(taskId);
  const taskDoc = await taskRef.get();
  const task = taskDoc.data();

  await taskRef.update({
    originalDeadline: task.originalDeadline || task.deadline,
    deadline: new Date(newDeadline),
    status: "extended",
    updatedAt: FieldValue.serverTimestamp(),
    editHistory: FieldValue.arrayUnion({
      action: "extend",
      field: "deadline",
      oldValue: task.deadline?.toDate?.()?.toISOString() || "",
      newValue: newDeadline,
      editedBy: callerUid,
      editedAt: new Date().toISOString(),
    }),
  });

  // Notification cho assignees
  if (task?.assignees) {
    for (const uid of task.assignees) {
      await db.collection("notifications").add({
        userId: uid,
        taskId,
        type: "task_updated",
        message: `🔵 "${task.title}" đã được gia hạn deadline`,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  return { message: "Đã gia hạn deadline" };
});

// === 5. VÔ HIỆU HÓA TÀI KHOẢN ===
exports.disableUser = onCall(async (request) => {
  const { userId } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdmin(callerUid);

  // Disable trong Auth
  await getAuth().updateUser(userId, { disabled: true });

  // Update Firestore
  await db.collection("users").doc(userId).update({
    isActive: false,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { message: "Đã vô hiệu hóa tài khoản" };
});

// === 6. GỬI EMAIL NHẮC DEADLINE (Scheduled — chạy hàng ngày lúc 8h sáng VN) ===
exports.sendDeadlineReminders = onSchedule({
  schedule: "every day 08:00",
  timeZone: "Asia/Ho_Chi_Minh",
}, async () => {
  // Cấu hình SMTP (thay bằng thông tin thật khi deploy)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL || "",
      pass: process.env.SMTP_PASSWORD || "",
    },
  });

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Tìm tasks có deadline trong vòng 24h tới
  const tasksSnap = await db.collection("tasks")
    .where("isCompleted", "==", false)
    .where("deadline", "<=", tomorrow)
    .where("deadline", ">", now)
    .get();

  for (const taskDoc of tasksSnap.docs) {
    const task = taskDoc.data();
    if (!task.assignees) continue;

    for (const uid of task.assignees) {
      const userDoc = await db.collection("users").doc(uid).get();
      const user = userDoc.data();
      if (!user?.email) continue;

      try {
        await transporter.sendMail({
          from: `"Quản lý công việc - Ban PT TĐHP" <${process.env.SMTP_EMAIL}>`,
          to: user.email,
          subject: `⏰ Nhắc nhở: "${task.title}" sắp đến hạn`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto;">
              <div style="background: #0B6E4F; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0;">⏰ Nhắc nhở công việc</h2>
              </div>
              <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p>Xin chào <strong>${user.displayName}</strong>,</p>
                <p>Công việc <strong>"${task.title}"</strong> sắp đến hạn. Vui lòng hoàn thành trước thời hạn.</p>
                <p style="color: #EF4444; font-weight: bold;">Thời hạn: ${task.deadline.toDate().toLocaleString("vi-VN")}</p>
                <p style="color: #6b7280; font-size: 12px;">— Hệ thống Quản lý công việc Ban PT TĐHP</p>
              </div>
            </div>
          `,
        });

        // Tạo notification
        await db.collection("notifications").add({
          userId: uid,
          taskId: taskDoc.id,
          type: "deadline_warning",
          message: `⏰ "${task.title}" còn dưới 24 giờ trước deadline`,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (err) {
        console.error(`Lỗi gửi email cho ${user.email}:`, err);
      }
    }
  }
});

// === 7. NHẮC VIỆC TỰ ĐỘNG PER-TASK (Scheduled — chạy mỗi giờ) ===
// Quét tất cả task có autoReminder=true, chưa hoàn thành
// So sánh giờ hiện tại với autoReminderTime của task
// Nếu đúng giờ + chưa nhắc hôm nay → gửi notification cho assignees
// Dùng field lastAutoRemindedDate trên Firestore chống trùng (multi-user safe)
exports.autoTaskReminder = onSchedule({
  schedule: "every 1 hours",
  timeZone: "Asia/Ho_Chi_Minh",
}, async () => {
  // Lấy ngày giờ hiện tại theo timezone VN
  const now = new Date();
  const vnNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const currentHour = vnNow.getHours();
  const todayStr = `${vnNow.getFullYear()}-${String(vnNow.getMonth() + 1).padStart(2, "0")}-${String(vnNow.getDate()).padStart(2, "0")}`;

  console.log(`[AutoTaskReminder] Bắt đầu quét — ${todayStr} ${currentHour}:00 VN`);

  // Query: tasks có autoReminder=true, chưa hoàn thành, chưa xoá
  const tasksSnap = await db.collection("tasks")
    .where("autoReminder", "==", true)
    .where("isCompleted", "==", false)
    .get();

  let remindedCount = 0;
  let skippedCount = 0;

  for (const taskDoc of tasksSnap.docs) {
    const task = taskDoc.data();

    // Skip nếu task đã bị xoá mềm
    if (task.isDeleted) {
      skippedCount++;
      continue;
    }

    // Đã nhắc hôm nay → skip
    if (task.lastAutoRemindedDate === todayStr) {
      skippedCount++;
      continue;
    }

    // Parse autoReminderTime — validate format
    const timeStr = task.autoReminderTime || "08:00";
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
      console.warn(`[AutoTaskReminder] Task ${taskDoc.id} có autoReminderTime không hợp lệ: "${timeStr}"`);
      skippedCount++;
      continue;
    }

    const reminderHour = parseInt(match[1], 10);

    // Chỉ nhắc khi giờ hiện tại >= giờ cấu hình
    if (currentHour < reminderHour) {
      skippedCount++;
      continue;
    }

    // OK, nhắc task này!
    const assignees = task.assignees || [];
    if (assignees.length === 0) {
      skippedCount++;
      continue;
    }

    try {
      // Gửi notification cho TẤT CẢ assignee
      for (const userId of assignees) {
        await db.collection("notifications").add({
          userId,
          taskId: taskDoc.id,
          title: "⏰ Nhắc việc tự động",
          type: "warning",
          message: `Nhắc nhở hàng ngày: Công việc "${task.title}" cần được hoàn thành. Vui lòng kiểm tra và cập nhật tiến độ!`,
          isRead: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // Đánh dấu đã nhắc hôm nay trên Firestore (chống trùng)
      await db.collection("tasks").doc(taskDoc.id).update({
        lastAutoRemindedDate: todayStr,
        isReminded: true,
      });

      remindedCount++;
    } catch (err) {
      console.error(`[AutoTaskReminder] Lỗi nhắc task ${taskDoc.id}:`, err);
    }
  }

  console.log(`[AutoTaskReminder] Hoàn thành — nhắc ${remindedCount}, bỏ qua ${skippedCount}`);
});

// === 8. QUÉT VÀ PHẠT QUÁ HẠN TỰ ĐỘNG (Scheduled — chạy mỗi giờ) ===
exports.autoOverduePenalty = onSchedule({
  schedule: "every 1 hours",
  timeZone: "Asia/Ho_Chi_Minh",
}, async () => {
  const now = new Date();
  console.log(`[AutoPenalty] Bắt đầu quét phạt lúc ${now.toLocaleString("vi-VN")}`);

  // Tìm task chưa hoàn thành và đã qua deadline
  const tasksSnap = await db.collection("tasks")
    .where("isCompleted", "==", false)
    .where("deadline", "<", now)
    .get();

  let penalizedCount = 0;

  for (const taskDoc of tasksSnap.docs) {
    const task = taskDoc.data();

    // Bỏ qua nếu task bị xóa mềm hoặc đã phát phạt rồi
    if (task.isDeleted || task.isPenalized) continue;
    if (!task.assignees || task.assignees.length === 0) continue;

    // Lấy số tiền phạt từ task, nếu không có mặc định 10,000 VND
    const amount = task.money || 10000;
    const batch = db.batch();

    // 1. Phạt từng người thực hiện
    for (const uid of task.assignees) {
      // Double check xem user này đối với task này đã bị phạt hay chưa
      const penaltyCheck = await db.collection("penalties")
        .where("taskId", "==", taskDoc.id)
        .where("userId", "==", uid)
        .get();

      if (!penaltyCheck.empty) continue;

      // Tạo record phạt ở collection penalties
      const newPenaltyRef = db.collection("penalties").doc();
      batch.set(newPenaltyRef, {
        taskId: taskDoc.id,
        taskTitle: task.title,
        userId: uid,
        amount,
        status: "unpaid",
        reason: "Quá hạn công việc",
        createdAt: FieldValue.serverTimestamp(),
      });

      // Tạo thông báo cho user
      const newNotifRef = db.collection("notifications").doc();
      batch.set(newNotifRef, {
        userId: uid,
        taskId: taskDoc.id,
        title: "⚠️ Bị phạt tự động",
        type: "error",
        message: `Bạn bị phạt ${amount.toLocaleString("vi-VN")}đ do quá hạn công việc "${task.title}".`,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // 2. Cập nhật trạng thái task đã phạt (để chu trình sau không phát phạt lại)
    batch.update(taskDoc.ref, {
      isPenalized: true,
      updatedAt: FieldValue.serverTimestamp()
    });

    await batch.commit();
    penalizedCount++;
  }

  console.log(`[AutoPenalty] Hoàn thành — đã phát phạt đối với ${penalizedCount} tasks quá hạn.`);
});

// === 9. DỌN RÁC TỰ ĐỘNG (DATA RETENTION) (Scheduled — chạy mỗi ngày 02:00 sáng) ===
// Quét các task có isDeleted = true và deletedAt quá 30 ngày.
// Xóa vĩnh viễn task document và xóa các file đính kèm trên Firebase Storage.
exports.autoDataRetention = onSchedule({
  schedule: "every day 02:00",
  timeZone: "Asia/Ho_Chi_Minh",
}, async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  console.log(`[DataRetention] Bắt đầu dọn dẹp các task bị xóa trước ngày ${thirtyDaysAgo.toISOString()}`);

  const tasksSnap = await db.collection("tasks")
    .where("isDeleted", "==", true)
    .where("deletedAt", "<=", thirtyDaysAgo)
    .get();

  const bucket = require("firebase-admin/storage").getStorage().bucket();

  let deletedTasksCount = 0;
  let deletedFilesCount = 0;

  for (const taskDoc of tasksSnap.docs) {
    const task = taskDoc.data();

    // 1. Xóa tất cả file đính kèm của task trên Storage (nếu có)
    if (task.attachments && task.attachments.length > 0) {
      for (const fileObj of task.attachments) {
        if (fileObj.path) {
          try {
            await bucket.file(fileObj.path).delete();
            deletedFilesCount++;
          } catch (err) {
            console.warn(`[DataRetention] Lỗi khi xóa file ${fileObj.path}:`, err);
          }
        }
      }
    }

    // 2. Xóa tất cả thông báo (notifications) liên quan đến task này
    const notifsSnap = await db.collection("notifications").where("taskId", "==", taskDoc.id).get();
    const batch = db.batch();
    for (const notifDoc of notifsSnap.docs) {
      batch.delete(notifDoc.ref);
    }

    // 3. Xóa tất cả lỗi phạt (penalties) liên quan đến task này
    const penaltiesSnap = await db.collection("penalties").where("taskId", "==", taskDoc.id).get();
    for (const penDoc of penaltiesSnap.docs) {
      batch.delete(penDoc.ref);
    }

    // 4. Xóa chính document task
    batch.delete(taskDoc.ref);
    await batch.commit();

    deletedTasksCount++;
  }

  console.log(`[DataRetention] Hoàn thành dọn dẹp — Xóa sạch ${deletedTasksCount} tasks và ${deletedFilesCount} files đính kèm.`);
});

// === 10. (ĐÃ GỘP VÀO MỤC 13 BÊN DƯỚI) ===

// === 11. KHÓA ĐỢT BÁO CÁO (SUBMISSION PERIOD) ===
exports.lockSubmissionPeriod = onCall(async (request) => {
  const { periodId } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdminOrManager(callerUid); // Admin hoặc Manager

  await db.collection("submissionPeriods").doc(periodId).update({
    status: "locked",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { message: "Đã khóa đợt báo cáo" };
});

// === 12. CÔNG BỐ KẾT QUẢ ĐỢT BÁO CÁO ===
exports.publishPeriodResults = onCall(async (request) => {
  const { periodId } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdminOrManager(callerUid); // Admin hoặc Manager

  const periodRef = db.collection("submissionPeriods").doc(periodId);
  const periodDoc = await periodRef.get();
  if (!periodDoc.exists) throw new HttpsError("not-found", "Không tìm thấy đợt báo cáo");

  const periodData = periodDoc.data();
  const criteriaSetIds = periodData.criteriaSetIds || [];

  if (criteriaSetIds.length === 0 && periodData.criteriaSetId) {
    criteriaSetIds.push(periodData.criteriaSetId);
  }

  let periodResults = {}; // { unitId: { totalScore, blockId } }

  for (const csId of criteriaSetIds) {
    const submissionsSnap = await db.collection("criteriaSubmissions")
      .where("criteriaSetId", "==", csId)
      .where("status", "==", "graded")
      .get();

    submissionsSnap.forEach(doc => {
      const sub = doc.data();
      const uId = sub.unitId;
      const score = Number(sub.totalGradedScore) || 0;

      if (!periodResults[uId]) {
        periodResults[uId] = {
          unitId: uId,
          unitName: sub.unitName || "",
          blockId: sub.blockId || "",
          blockName: sub.blockName || "",
          typeId: sub.typeId || "",
          typeName: sub.typeName || "",
          totalScore: 0,
          details: {} // { criteriaSetId: score }
        };
      }
      periodResults[uId].totalScore += score;
      periodResults[uId].details[csId] = score;
    });
  }

  await periodRef.update({
    status: "published",
    results: periodResults,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { message: "Đã công bố và tính điểm đợt báo cáo" };
});

// === HELPER: Bỏ dấu tiếng Việt ===
function removeVietnameseTones(str) {
  if (!str) return "";
  let s = str;
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  s = s.replace(/đ/g, "d");
  s = s.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "a");
  s = s.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "e");
  s = s.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "i");
  s = s.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "o");
  s = s.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "u");
  s = s.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "y");
  s = s.replace(/Đ/g, "d");
  s = s.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  s = s.replace(/\u02C6|\u0306|\u031B/g, "");
  return s.toLowerCase().trim();
}

// === HELPER: Sinh username từ tên đơn vị ===
const UNIT_PREFIXES = [
  "doan tncs ho chi minh", "doan thanh nien cong san ho chi minh",
  "doan thanh nien", "doan tn", "doan",
  "hoi lien hiep thanh nien", "hoi lhtn", "hoi sinh vien", "hoi",
  "chi doan", "lien chi doan", "ban chap hanh doan",
];
const LOCATION_PREFIXES = [
  "thi tran", "thanh pho", "tp", "phuong", "xa", "quan", "huyen",
  "cac co quan", "co quan", "truong", "dai hoc", "cao dang",
  "bo chi huy", "luc luong",
];

function generateUsername(unitName) {
  if (!unitName) return "";
  let cleaned = removeVietnameseTones(unitName);
  const sortedPrefixes = [...UNIT_PREFIXES].sort((a, b) => b.length - a.length);
  for (const prefix of sortedPrefixes) {
    if (cleaned.startsWith(prefix + " ")) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }
  const sortedLoc = [...LOCATION_PREFIXES].sort((a, b) => b.length - a.length);
  for (const loc of sortedLoc) {
    if (cleaned.startsWith(loc + " ")) {
      cleaned = cleaned.slice(loc.length).trim();
      break;
    }
  }
  const username = cleaned.replace(/[^a-z0-9]/g, "");
  return username ? `${username}.tdhp` : "";
}

const DEFAULT_UNIT_PASSWORD = "abc@123";

// === 13. TẠO TÀI KHOẢN ĐƠN VỊ CƠ SỞ (UNIT) ===
exports.createUnit = onCall(async (request) => {
  const { unitName, username: inputUsername, password: inputPassword, blockId, blockName, typeId, typeName } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdmin(callerUid);

  if (!unitName) {
    throw new HttpsError("invalid-argument", "Thiếu thông tin bắt buộc (unitName)");
  }

  // Sinh username nếu không truyền
  const username = (inputUsername || "").trim() || generateUsername(unitName);
  const password = (inputPassword || "").trim() || DEFAULT_UNIT_PASSWORD;

  if (!username) {
    throw new HttpsError("invalid-argument", "Không thể sinh username từ tên đơn vị. Vui lòng nhập thủ công.");
  }

  // Kiểm tra username trùng
  const existingSnap = await db.collection("units").where("username", "==", username).get();
  if (!existingSnap.empty) {
    throw new HttpsError("already-exists", `Username "${username}" đã được sử dụng.`);
  }

  // Tạo Firestore document trước (dùng auto-generated ID)
  const unitRef = db.collection("units").doc();
  const unitId = unitRef.id;

  await unitRef.set({
    username,
    password,
    unitName,
    displayName: unitName,
    role: "unit",
    blockId: blockId || "",
    blockName: blockName || "",
    typeId: typeId || "",
    typeName: typeName || "",
    isActive: true,
    status: "approved",
    mustChangePassword: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, uid: unitId, username, message: `Đã tạo đơn vị: ${unitName} (username: ${username})` };
});

// === 13b. ĐĂNG NHẬP ĐƠN VỊ (USERNAME/PASSWORD → CUSTOM TOKEN) ===
exports.loginUnit = onCall({
  serviceAccount: "ban-pt-tdhp@appspot.gserviceaccount.com"
}, async (request) => {
  const { username, password } = request.data;

  if (!username || !password) {
    throw new HttpsError("invalid-argument", "Vui lòng nhập username và mật khẩu.");
  }

  // Tìm đơn vị theo username
  const unitsSnap = await db.collection("units").where("username", "==", username.trim()).get();

  if (unitsSnap.empty) {
    throw new HttpsError("not-found", "Username không tồn tại.");
  }

  const unitDoc = unitsSnap.docs[0];
  const unitData = unitDoc.data();

  // Kiểm tra mật khẩu (plaintext compare)
  if (unitData.password !== password) {
    throw new HttpsError("permission-denied", "Mật khẩu không đúng.");
  }

  // Kiểm tra trạng thái tài khoản
  if (unitData.isActive === false) {
    throw new HttpsError("permission-denied", "Tài khoản đã bị khóa. Liên hệ quản trị viên.");
  }

  // Tạo Custom Token từ Firebase Auth
  const customToken = await getAuth().createCustomToken(unitDoc.id, {
    role: "unit",
    unitId: unitDoc.id,
  });

  return {
    success: true,
    token: customToken,
    mustChangePassword: unitData.mustChangePassword === true,
    unitId: unitDoc.id,
  };
});

// === 13c. ĐỔI MẬT KHẨU ĐƠN VỊ (UNIT TỰ ĐỔI) ===
exports.changeUnitPassword = onCall(async (request) => {
  const { newPassword } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  if (!newPassword || newPassword.length < 6) {
    throw new HttpsError("invalid-argument", "Mật khẩu mới phải có ít nhất 6 ký tự.");
  }

  // Kiểm tra caller là unit
  const unitDoc = await db.collection("units").doc(callerUid).get();
  if (!unitDoc.exists) {
    throw new HttpsError("permission-denied", "Chỉ tài khoản đơn vị mới có thể đổi mật khẩu.");
  }

  await db.collection("units").doc(callerUid).update({
    password: newPassword,
    mustChangePassword: false,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, message: "Đổi mật khẩu thành công." };
});

// === 13d. RESET MẬT KHẨU ĐƠN VỊ (ADMIN) ===
exports.resetUnitPassword = onCall(async (request) => {
  const { unitId } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdmin(callerUid);

  if (!unitId) throw new HttpsError("invalid-argument", "Thiếu unitId");

  const unitDoc = await db.collection("units").doc(unitId).get();
  if (!unitDoc.exists) {
    throw new HttpsError("not-found", "Không tìm thấy đơn vị.");
  }

  await db.collection("units").doc(unitId).update({
    password: DEFAULT_UNIT_PASSWORD,
    mustChangePassword: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, message: `Đã reset mật khẩu về mặc định (${DEFAULT_UNIT_PASSWORD}).` };
});

// === 14. XÓA TÀI KHOẢN THÀNH VIÊN (ADMIN) ===
exports.deleteUser = onCall(async (request) => {
  const { userId } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdmin(callerUid);

  if (!userId) throw new HttpsError("invalid-argument", "Thiếu userId");
  if (userId === callerUid) throw new HttpsError("failed-precondition", "Không thể xóa chính mình");

  try {
    // Xóa Firebase Auth user
    await getAuth().deleteUser(userId);
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw new HttpsError("internal", `Lỗi xóa Auth: ${error.message}`);
    }
  }

  // Xóa Firestore document
  await db.collection("users").doc(userId).delete();

  return { success: true, message: "Đã xóa tài khoản thành viên" };
});

// === 15. XÓA TÀI KHOẢN ĐƠN VỊ (ADMIN) — CASCADE DELETE ===
exports.deleteUnit = onCall(async (request) => {
  const { unitId } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdmin(callerUid);

  if (!unitId) throw new HttpsError("invalid-argument", "Thiếu unitId");

  console.log(`[deleteUnit] Bắt đầu cascade delete cho unitId: ${unitId}`);

  // Helper: xóa tất cả docs trong 1 query, chia batch 500
  async function deleteQueryResults(query, label) {
    let totalDeleted = 0;
    let snap = await query.get();
    while (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      totalDeleted += snap.docs.length;
      snap = await query.get(); // re-query for remaining
    }
    if (totalDeleted > 0) {
      console.log(`[deleteUnit] Đã xóa ${totalDeleted} docs từ ${label}`);
    }
    return totalDeleted;
  }

  // 1. Xóa tất cả criteriaSubmissions có unitId
  await deleteQueryResults(
    db.collection("criteriaSubmissions").where("unitId", "==", unitId).limit(500),
    "criteriaSubmissions"
  );

  // 2. Xóa tất cả criteriaAssignments có unitId
  await deleteQueryResults(
    db.collection("criteriaAssignments").where("unitId", "==", unitId).limit(500),
    "criteriaAssignments"
  );

  // 3. Xóa tất cả plans có unitId (nếu có)
  await deleteQueryResults(
    db.collection("plans").where("unitId", "==", unitId).limit(500),
    "plans"
  );

  // 4. Xóa Firestore document đơn vị
  await db.collection("units").doc(unitId).delete();

  console.log(`[deleteUnit] Cascade delete hoàn tất cho unitId: ${unitId}`);
  return { success: true, message: "Đã xóa tài khoản đơn vị và toàn bộ dữ liệu liên quan" };
});

// === 16. KHỞI TẠO ADMIN ĐẦU TIÊN ===
exports.initFirstAdmin = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  const adminDocRef = db.collection('system').doc('firstAdminAssigned');

  return await db.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(adminDocRef);
    if (docSnap.exists && docSnap.data().assigned) {
      return { success: false, message: "Admin đã được tạo, bạn chỉ có quyền thành viên." };
    }

    // Gán role admin
    const userRef = db.collection("users").doc(callerUid);
    transaction.set(userRef, {
      role: "admin",
      isActive: true,
      status: "approved",
    }, { merge: true });

    // Mark as assigned
    transaction.set(adminDocRef, { assigned: true, uid: callerUid });

    return { success: true, message: "Khởi tạo Admin đầu tiên thành công!" };
  });
});

// === 17. TẠO PHIẾU PHẠT IDEMPOTENT (tránh trùng lặp) ===
exports.createPenaltyIdempotent = onCall(async (request) => {
  const { userId, taskId, penaltyTypeId, amount, reason, taskTitle } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError('unauthenticated', 'Chưa đăng nhập');

  await requireAdminOrManager(callerUid);

  if (!userId || !taskId || !penaltyTypeId) {
    throw new HttpsError('invalid-argument', 'Thiếu thông tin bắt buộc');
  }

  // Composite document ID — đảm bảo idempotent tuyệt đối
  const penaltyDocId = `${userId}_${taskId}_${penaltyTypeId}`;
  const penaltyRef = db.collection('penalties').doc(penaltyDocId);

  // Dùng transaction để kiểm tra + tạo atomic
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(penaltyRef);
    if (existing.exists) {
      // Đã tồn tại → không làm gì, không báo lỗi
      return;
    }
    transaction.set(penaltyRef, {
      userId,
      taskId,
      taskTitle: taskTitle || '',
      penaltyTypeId,
      amount: amount || 0,
      reason: reason || '',
      isAuto: true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: callerUid,
    });
  });

  return { message: 'OK' };
});
