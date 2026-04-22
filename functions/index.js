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

  await db.collection("submissionPeriods").doc(periodId).update({
    status: "published",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { message: "Đã công bố kết quả của đợt báo cáo" };
});

// === 13. TẠO TÀI KHOẢN ĐƠN VỊ CƠ SỞ (UNIT) ===
exports.createUnit = onCall(async (request) => {
  const { email, unitName, blockId, blockName, typeId, typeName } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdmin(callerUid);

  if (!email || !unitName) {
    throw new HttpsError("invalid-argument", "Thiếu thông tin bắt buộc (email, unitName)");
  }

  // Tự sinh mật khẩu ngẫu nhiên (đơn vị chỉ đăng nhập bằng Google)
  const randomPassword = require("crypto").randomBytes(16).toString("hex");

  let userRecord;
  try {
    // Tạo Firebase Auth user cho đơn vị
    userRecord = await getAuth().createUser({
      email,
      password: randomPassword,
      displayName: unitName,
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", `Email "${email}" đã được sử dụng cho tài khoản khác.`);
    }
    if (error.code === "auth/invalid-email") {
      throw new HttpsError("invalid-argument", `Email "${email}" không hợp lệ.`);
    }
    throw new HttpsError("internal", `Lỗi tạo tài khoản: ${error.message}`);
  }

  // Tạo document trong collection `units` với uid làm doc ID
  await db.collection("units").doc(userRecord.uid).set({
    email,
    unitName,
    displayName: unitName,
    role: "unit",
    blockId: blockId || "",
    blockName: blockName || "",
    typeId: typeId || "",
    typeName: typeName || "",
    isActive: true,
    status: "approved",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, uid: userRecord.uid, message: `Đã tạo đơn vị: ${unitName}` };
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

// === 15. XÓA TÀI KHOẢN ĐƠN VỊ (ADMIN) ===
exports.deleteUnit = onCall(async (request) => {
  const { unitId } = request.data;
  const callerUid = request.auth?.uid;
  if (!callerUid) throw new HttpsError("unauthenticated", "Chưa đăng nhập");

  await requireAdmin(callerUid);

  if (!unitId) throw new HttpsError("invalid-argument", "Thiếu unitId");

  try {
    // Xóa Firebase Auth user
    await getAuth().deleteUser(unitId);
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw new HttpsError("internal", `Lỗi xóa Auth: ${error.message}`);
    }
  }

  // Xóa Firestore document
  await db.collection("units").doc(unitId).delete();

  return { success: true, message: "Đã xóa tài khoản đơn vị" };
});
