// Header — thanh trên cùng với search, notification, user info
import { useState, useRef, useEffect } from 'react';
import { MdSearch, MdNotifications, MdMenu, MdClose, MdCircle, MdRadioButtonUnchecked } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelative } from '../../utils/dateUtils';

const Header = ({ title, onToggleSidebar }) => {
  const { userProfile } = useAuth();
  const { notifications, unreadCount, markRead, markUnread, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  // Click outside hoặc Escape để đóng dropdown
  useEffect(() => {
    if (!showNotifs) return;
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    const handleEsc = (e) => { if (e.key === 'Escape') setShowNotifs(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showNotifs]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: menu toggle + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <MdMenu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>

        {/* Right: notifications */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <MdNotifications size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-doan-red text-white text-[10px] font-bold rounded-full flex items-center justify-center pulse-dot">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifs && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50 slide-in-right">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-sm text-gray-900">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Không có thông báo nào
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.slice(0, 20).map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.isRead && markRead(notif.id)}
                        className={`group flex items-start px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          !notif.isRead ? 'bg-primary-50/50' : ''
                        }`}
                      >
                        <div className="flex-1 pr-2">
                          <p className="text-sm text-gray-800">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatRelative(notif.createdAt)}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            notif.isRead ? markUnread(notif.id) : markRead(notif.id);
                          }}
                          title={notif.isRead ? "Đánh dấu là chưa đọc" : "Đánh dấu là đã đọc"}
                          className={`mt-1 flex-shrink-0 p-1 rounded-full transition-opacity ${notif.isRead ? 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 text-gray-400' : 'text-primary-600 hover:bg-primary-100'}`}
                        >
                          {notif.isRead ? <MdRadioButtonUnchecked size={14} /> : <MdCircle size={12} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
            {userProfile?.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
