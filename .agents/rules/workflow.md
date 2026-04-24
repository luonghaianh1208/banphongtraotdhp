---
trigger: always_on
---

### 📚 PROJECT DOCS PROTOCOL (MANDATORY)

**Bắt buộc thực thi Trước và Sau MỌI phiên làm việc (Session) hoặc Task Coding:**

1. **PRE-FLIGHT (Trước khi code)**:
   - 👁️ BẮT BUỘC đọc [_docs/PROJECT.md](cci:7://file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/_docs/PROJECT.md:0:0-0:0), [_docs/ARCHITECTURE.md](cci:7://file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/_docs/ARCHITECTURE.md:0:0-0:0) và [_docs/CONTEXT.md](cci:7://file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/_docs/CONTEXT.md:0:0-0:0) ngay từ prompt đầu tiên để hiểu kiến trúc.
   - 📋 BẮT BUỘC check [_docs/TASKS.md](cci:7://file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/_docs/TASKS.md:0:0-0:0) để nắm các công việc đang ưu tiên và [_docs/BUGS.md](cci:7://file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/_docs/BUGS.md:0:0-0:0) để tránh dẫm chân lên code đang lỗi.

2. **POST-FLIGHT (Sau khi Code/Fix bug thành công)**:
   - ✅ Update [_docs/TASKS.md](cci:7://file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/_docs/TASKS.md:0:0-0:0): Gạch tên `[x]` hoặc gỡ bỏ item vừa hoàn thiện.
   - 🐛 Update [_docs/BUGS.md](cci:7://file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/_docs/BUGS.md:0:0-0:0): Gỡ bỏ bug nếu vừa được fix, hoặc thêm bug mới nếu vừa phát hiện.
   - 📝 Update [_docs/CHANGELOG.md](cci:7://file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/_docs/CHANGELOG.md:0:0-0:0): Đăng ký thay đổi tóm tắt vào lịch sử version.
   - 🔥 Update [_docs/CONTEXT.md](cci:7://file:///c:/Users/ADMIN/Downloads/VIBE%20CODING/app%20task%20list/_docs/CONTEXT.md:0:0-0:0): Ghi lại bất kỳ quyết định kỹ thuật mới (Key Decisions) nào vừa thống nhất để dành cho Agent ở session ngày hôm sau.

> 🛑 **CHỐT CHẶN (GATE):** KhÔNG ĐƯỢC PHÉP trả lời "Tôi đã hoàn thành công việc" nếu chưa chạy đủ 4 bước POST-FLIGHT trên.
