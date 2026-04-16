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
