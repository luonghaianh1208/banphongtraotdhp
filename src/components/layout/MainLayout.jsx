// MainLayout — bố cục chính: Sidebar + Header + Content
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import WhatsNewModal from '../common/WhatsNewModal';
import { useAutoOverduePenalties } from '../../hooks/useAutoOverduePenalties';

// Map route → tên trang hiển thị
const PAGE_TITLES = {
  '/': 'Việc hôm nay',
  '/tasks': 'Tất cả công việc',
  '/dashboard': 'Dashboard tổng quan',
  '/members': 'Quản lý thành viên',
  '/settings': 'Cài đặt',
  '/system-info': 'Thông tin hệ thống',
  '/criteria-sets': 'Quản lý Bộ tiêu chí',
  '/plans-manage': 'Quản lý Kế hoạch',
  '/units': 'Danh sách Đơn vị',
  '/penalties': 'Quản lý Phiếu phạt',
  '/trash': 'Thùng rác',
};

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tự động kiểm tra task quá hạn và tạo phiếu phạt (chỉ chạy khi admin đăng nhập)
  useAutoOverduePenalties();

  const location = useLocation();

  // Logic tìm page title khớp nhất (xử lý dynamic routes)
  const getPageTitle = () => {
    if (location.pathname.startsWith('/criteria-overview/')) return 'Tổng quan Đợt đánh giá';
    if (location.pathname.startsWith('/criteria-detail/')) return 'Chi tiết Đánh giá';
    if (location.pathname.startsWith('/plans/')) return 'Chi tiết Kế hoạch';
    return PAGE_TITLES[location.pathname] || 'Quản lý công việc';
  };

  const pageTitle = getPageTitle();

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar — desktop */}
      <div className="hidden lg:flex shrink-0 relative z-20">
        <Sidebar />
      </div>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 transition-opacity duration-300">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-72 animate-slide-in-left shadow-2xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          title={pageTitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin scrollbar-thumb-emerald-500/20 hover:scrollbar-thumb-emerald-500/40">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Tính năng thông báo version mới */}
      <WhatsNewModal />
    </div>
  );
};

export default MainLayout;
