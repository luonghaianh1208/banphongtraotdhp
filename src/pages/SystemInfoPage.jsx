// SystemInfoPage — Thông tin hệ thống: Tính năng, Quyền hạn, Thông tin ứng dụng
import { useState } from 'react';
import { MdInfo, MdFeaturedPlayList, MdSecurity, MdCheckCircle, MdClose, MdNewReleases, MdCode } from 'react-icons/md';
import { ORG_NAME } from '../utils/constants';

// === TAB 1: Tính năng hệ thống ===
const FEATURES = [
  {
    category: 'Quản lý công việc',
    items: [
      { name: 'Tạo & giao công việc', desc: 'Tổ trưởng tạo công việc và giao cho một hoặc nhiều nhân viên', isNew: false },
      { name: 'Phân loại ưu tiên', desc: 'Đặt mức ưu tiên Cao / Trung bình / Thấp cho mỗi công việc', isNew: false },
      { name: 'Theo dõi deadline', desc: 'Tự động phát hiện trạng thái: Chưa đến hạn, Gần hạn, Cần gấp, Quá hạn', isNew: false },
      { name: 'Gia hạn deadline', desc: 'Tổ trưởng có thể gia hạn deadline cho công việc khi cần thiết', isNew: false },
      { name: 'Duyệt hoàn thành', desc: 'Tổ trưởng duyệt công việc khi nhân viên đã hoàn thành', isNew: false },
      { name: 'Khôi phục công việc', desc: 'Hủy duyệt hoàn thành, đưa công việc về trạng thái hoạt động', isNew: false },
      { name: 'Lịch sử chỉnh sửa', desc: 'Ghi lại toàn bộ thay đổi: ai sửa, sửa gì, lúc nào', isNew: false },
      { name: 'Nhắc nhở tiến độ', desc: 'Tổ trưởng nhắc nhở nhân viên đẩy nhanh tiến độ công việc', isNew: false },
    ],
  },
  {
    category: 'Gửi duyệt & Phê duyệt',
    items: [
      { name: 'Gửi duyệt công việc', desc: 'Nhân viên chủ động gửi duyệt khi hoàn thành, tổ trưởng nhận thông báo', isNew: true },
      { name: 'Trạng thái chờ duyệt', desc: 'Công việc chuyển sang trạng thái "Chờ duyệt" với badge tím nổi bật', isNew: true },
      { name: 'Thu hồi gửi duyệt', desc: 'Nhân viên có thể thu hồi nếu gửi duyệt nhầm (chỉ người gửi mới thu hồi được)', isNew: true },
      { name: 'Nộp sản phẩm để duyệt', desc: 'Nhân viên tải file sản phẩm lên rồi gửi duyệt để tổ trưởng xem xét', isNew: true },
    ],
  },
  {
    category: 'Tài liệu & File',
    items: [
      { name: 'Tải nhiều file cùng lúc', desc: 'Chọn và tải lên nhiều file cùng một lúc, hỗ trợ đa định dạng', isNew: true },
      { name: 'Đa loại file', desc: 'Hỗ trợ PDF, Word, Excel, PowerPoint, ảnh JPG/PNG và nhiều định dạng khác', isNew: true },
      { name: 'Xem trước file', desc: 'Preview file trực tiếp, hiển thị tên người tải và thời gian', isNew: false },
      { name: 'File theo task', desc: 'Mỗi công việc có khu vực tài liệu riêng, ghi rõ ai tải lên', isNew: false },
    ],
  },
  {
    category: 'Ghi chú & Trao đổi',
    items: [
      { name: 'Ghi chú luân phiên', desc: 'Cả tổ trưởng và nhân viên đều ghi chú, ghi rõ ai gửi và lúc nào', isNew: true },
      { name: 'Ghi chú theo thời gian', desc: 'Sắp xếp ghi chú theo thời gian, hiển thị tên người viết', isNew: true },
    ],
  },
  {
    category: 'Thông báo',
    items: [
      { name: 'Thông báo giao việc', desc: 'Nhân viên nhận thông báo khi được giao công việc mới', isNew: false },
      { name: 'Thông báo duyệt', desc: 'Nhân viên nhận thông báo khi công việc được duyệt hoàn thành', isNew: false },
      { name: 'Thông báo nhắc nhở', desc: 'Nhân viên nhận thông báo nhắc nhở từ tổ trưởng', isNew: false },
      { name: 'Thông báo gửi duyệt', desc: 'Tổ trưởng nhận thông báo khi nhân viên gửi duyệt công việc', isNew: true },
      { name: 'Thông báo tải file', desc: 'Thông báo hai chiều khi tổ trưởng hoặc nhân viên tải file lên', isNew: true },
    ],
  },
  {
    category: 'Quản lý thành viên',
    items: [
      { name: 'Đăng nhập Google', desc: 'Xác thực an toàn qua tài khoản Google', isNew: false },
      { name: 'Phê duyệt tài khoản', desc: 'Tổ trưởng duyệt thành viên mới trước khi vào hệ thống', isNew: false },
      { name: 'Phân quyền vai trò', desc: 'Gán vai trò Tổ trưởng / Phụ trách / Nhân viên cho từng thành viên', isNew: false },
      { name: 'Quản lý phạt', desc: 'Theo dõi và quản lý chế độ phạt khi công việc quá hạn', isNew: false },
    ],
  },
  {
    category: 'Hệ thống',
    items: [
      { name: 'Dashboard tổng quan', desc: 'Biểu đồ thống kê tình hình công việc dành cho tổ trưởng', isNew: false },
      { name: 'Cấu hình công việc', desc: 'Tùy chỉnh mức ưu tiên, danh mục, và cài đặt hệ thống', isNew: false },
      { name: 'Thùng rác', desc: 'Khôi phục hoặc xóa vĩnh viễn công việc đã xóa', isNew: false },
      { name: 'Hồ sơ cá nhân', desc: 'Đổi tên, ảnh đại diện — tự đồng bộ toàn hệ thống', isNew: false },
      { name: 'Bảo mật Firestore', desc: 'Giới hạn quyền sửa field theo từng vai trò — bảo vệ dữ liệu', isNew: true },
    ],
  },
];

// === TAB 2: Bảng quyền hạn ===
const PERMISSIONS = [
  { feature: 'Xem danh sách công việc', admin: true, manager: true, member: true },
  { feature: 'Tạo công việc mới', admin: true, manager: true, member: false },
  { feature: 'Chỉnh sửa công việc', admin: true, manager: true, member: false },
  { feature: 'Xóa công việc', admin: true, manager: false, member: false },
  { feature: 'Giao công việc cho nhân viên', admin: true, manager: true, member: false },
  { feature: 'Duyệt hoàn thành công việc', admin: true, manager: true, member: false },
  { feature: 'Khôi phục công việc đã duyệt', admin: true, manager: true, member: false },
  { feature: 'Gia hạn deadline', admin: true, manager: true, member: false },
  { feature: 'Nhắc nhở tiến độ', admin: true, manager: true, member: false },
  { feature: 'Gửi duyệt công việc', admin: false, manager: false, member: true },
  { feature: 'Thu hồi gửi duyệt', admin: false, manager: false, member: true },
  { feature: 'Tải file lên công việc', admin: true, manager: true, member: true },
  { feature: 'Ghi chú công việc', admin: true, manager: true, member: true },
  { feature: 'Xem Dashboard thống kê', admin: true, manager: true, member: false },
  { feature: 'Quản lý thành viên', admin: true, manager: false, member: false },
  { feature: 'Phê duyệt tài khoản mới', admin: true, manager: false, member: false },
  { feature: 'Phân quyền vai trò', admin: true, manager: false, member: false },
  { feature: 'Quản lý phạt', admin: true, manager: true, member: false },
  { feature: 'Cấu hình hệ thống', admin: true, manager: false, member: false },
  { feature: 'Xem thùng rác & khôi phục', admin: true, manager: false, member: false },
  { feature: 'Đổi tên & ảnh đại diện', admin: true, manager: true, member: true },
  { feature: 'Xem thông tin hệ thống', admin: true, manager: true, member: true },
];

const TABS = [
  { id: 'features', label: 'Tính năng', icon: MdFeaturedPlayList },
  { id: 'permissions', label: 'Quyền hạn', icon: MdSecurity },
  { id: 'about', label: 'Giới thiệu', icon: MdInfo },
];

const SystemInfoPage = () => {
  const [activeTab, setActiveTab] = useState('features');

  return (
    <div className="max-w-4xl mx-auto fade-in space-y-5">
      {/* Tab header */}
      <div className="card p-1.5 flex gap-1 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                isActive
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'features' && <FeaturesTab />}
      {activeTab === 'permissions' && <PermissionsTab />}
      {activeTab === 'about' && <AboutTab />}
    </div>
  );
};

// ========== FEATURES TAB ==========
const FeaturesTab = () => {
  const totalFeatures = FEATURES.reduce((sum, cat) => sum + cat.items.length, 0);
  const newFeatures = FEATURES.reduce((sum, cat) => sum + cat.items.filter(i => i.isNew).length, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{totalFeatures}</p>
          <p className="text-xs text-gray-500 mt-1">Tổng tính năng</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{newFeatures}</p>
          <p className="text-xs text-gray-500 mt-1">Tính năng mới</p>
        </div>
      </div>

      {/* Feature categories */}
      {FEATURES.map((cat, idx) => (
        <div key={idx} className="card overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">{cat.category}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {cat.items.map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                <MdCheckCircle size={18} className="text-primary-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    {item.isNew && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                        <MdNewReleases size={11} /> Mới
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ========== PERMISSIONS TAB ==========
const PermissionsTab = () => (
  <div className="card overflow-hidden">
    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
      <h3 className="text-sm font-semibold text-gray-800">Bảng phân quyền theo vai trò</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/60">
            <th className="text-left px-5 py-3 font-semibold text-gray-700">Tính năng</th>
            <th className="text-center px-3 py-3 font-semibold text-red-700 whitespace-nowrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-xs">Tổ trưởng</span>
            </th>
            <th className="text-center px-3 py-3 font-semibold text-amber-700 whitespace-nowrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-xs">Phụ trách</span>
            </th>
            <th className="text-center px-3 py-3 font-semibold text-blue-700 whitespace-nowrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-xs">Nhân viên</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map((perm, idx) => (
            <tr key={idx} className={`border-b border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/30 transition-colors`}>
              <td className="px-5 py-2.5 text-gray-800">{perm.feature}</td>
              <td className="text-center px-3 py-2.5">
                {perm.admin ? <MdCheckCircle size={18} className="inline text-green-500" /> : <MdClose size={18} className="inline text-gray-300" />}
              </td>
              <td className="text-center px-3 py-2.5">
                {perm.manager ? <MdCheckCircle size={18} className="inline text-green-500" /> : <MdClose size={18} className="inline text-gray-300" />}
              </td>
              <td className="text-center px-3 py-2.5">
                {perm.member ? <MdCheckCircle size={18} className="inline text-green-500" /> : <MdClose size={18} className="inline text-gray-300" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
      <p className="text-xs text-gray-500 italic">
        <MdCheckCircle size={14} className="inline text-green-500 mr-1" /> = Được phép
        <span className="mx-3">|</span>
        <MdClose size={14} className="inline text-gray-300 mr-1" /> = Không có quyền
      </p>
    </div>
  </div>
);

// ========== ABOUT TAB ==========
const AboutTab = () => (
  <div className="space-y-4">
    {/* App Info */}
    <div className="card p-6">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl shadow-lg">
          PT
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Quản lý Công việc</h3>
          <p className="text-sm text-gray-500">{ORG_NAME}</p>
        </div>
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-4">
        <div className="flex items-center">
          <span className="w-36 text-sm text-gray-500">Phiên bản:</span>
          <span className="text-sm font-medium text-gray-900">2.1.0</span>
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">Stable</span>
        </div>
        <div className="flex items-center">
          <span className="w-36 text-sm text-gray-500">Nền tảng:</span>
          <span className="text-sm text-gray-900">Web Application (PWA Ready)</span>
        </div>

      </div>
    </div>

    {/* Author Info */}
    <div className="card p-6">
      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <MdCode size={20} className="text-primary-500" /> Tác giả & Phát triển
      </h3>

      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
          LA
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">Lương Hải Anh</p>
          <p className="text-sm text-gray-600">THPT Chuyên Nguyễn Trãi</p>
          <p className="text-xs text-gray-400 mt-1">Thiết kế & Phát triển hệ thống</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-500">
        <p>© 2026 Lương Hải Anh. Bản quyền thuộc về tác giả.</p>
        <p className="text-xs italic">Sản phẩm được xây dựng phục vụ công tác quản lý nội bộ {ORG_NAME}.</p>
      </div>
    </div>
  </div>
);

export default SystemInfoPage;
