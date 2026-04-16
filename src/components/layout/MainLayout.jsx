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
};

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tự động kiểm tra task quá hạn và tạo phiếu phạt (chỉ chạy khi admin đăng nhập)
  useAutoOverduePenalties();

  // Nhắc việc tự động per-task: đã chuyển sang Cloud Function (autoTaskReminder)
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'Quản lý công việc';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar — desktop */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full w-64 slide-in-left">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={pageTitle}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Tính năng thông báo version mới */}
      <WhatsNewModal />
    </div>
  );
};

export default MainLayout;
