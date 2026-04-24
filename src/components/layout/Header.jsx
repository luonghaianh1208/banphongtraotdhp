// Header — thanh trên cùng với search, notification, user info
import { useState, useRef, useEffect } from 'react';
import { MdSearch, MdNotifications, MdMenu, MdClose, MdCircle, MdRadioButtonUnchecked, MdDoneAll } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelative } from '../../utils/dateUtils';
import { ROLES } from '../../utils/constants';

const Header = ({ title, onToggleSidebar }) => {
  const { userProfile } = useAuth();
  const { notifications, unreadCount, markRead, markUnread, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showCount, setShowCount] = useState(20);
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
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-emerald-500/10 transition-all duration-300">
      <div className="flex items-center justify-between px-6 lg:px-8 h-20">
        {/* Left: menu toggle + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-3 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all active:scale-95"
          >
            <MdMenu size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest opacity-70">Hệ thống đang hoạt động</span>
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className={`relative p-3 rounded-2xl border transition-all duration-300 active:scale-95 ${showNotifs
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-500/30'
                }`}
            >
              <MdNotifications size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 ring-4 ring-white dark:ring-gray-950 animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifs && (
              <div className="absolute right-0 top-16 w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 dark:border-gray-800 bg-emerald-500/5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">Thông báo</h3>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{unreadCount} mới</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 uppercase tracking-widest transition-colors"
                    >
                      <MdDoneAll size={14} /> Đánh dấu tất cả
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto max-h-[32rem] scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                      <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <MdNotifications size={32} className="opacity-20" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest opacity-50">Không có thông báo nào</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {notifications.slice(0, showCount).map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.isRead && markRead(notif.id)}
                          className={`group flex items-start px-6 py-5 cursor-pointer hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-all ${!notif.isRead ? 'bg-emerald-50/50 dark:bg-emerald-500/10' : ''
                            }`}
                        >
                          <div className="flex-1 pr-4">
                            <p className={`text-sm leading-relaxed ${!notif.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-400'}`}>
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-emerald-600/50 dark:text-emerald-400/50 mt-2 flex items-center gap-1 uppercase font-black tracking-widest">
                              {formatRelative(notif.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              notif.isRead ? markUnread(notif.id) : markRead(notif.id);
                            }}
                            className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center transition-all ${notif.isRead
                              ? 'border border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 hover:bg-gray-50 group-hover:opacity-100'
                              : 'bg-emerald-500 text-white shadow-sm'
                              }`}
                          >
                            {!notif.isRead && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            {notif.isRead && <MdRadioButtonUnchecked size={12} />}
                          </button>
                        </div>
                      ))}
                      {notifications.length > showCount && (
                        <button
                          onClick={() => setShowCount(prev => prev + 20)}
                          className="w-full py-4 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-colors border-t border-gray-50 dark:border-gray-800"
                        >
                          Xem thêm ({notifications.length - showCount} còn lại)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                  <button className="w-full py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-emerald-600 transition-colors">
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-10 w-[1px] bg-gray-100 dark:bg-gray-800 mx-1" />

          {/* User info card in Header */}
          <div className="flex items-center gap-4 pl-2 group cursor-pointer">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-black text-gray-900 dark:text-white truncate max-w-[150px] tracking-tight">
                {userProfile?.displayName}
              </span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">
                {ROLES[userProfile?.role]?.label}
              </span>
            </div>
            <div className="relative">
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt=""
                  className="w-11 h-11 rounded-2xl border-2 border-emerald-500/20 object-cover shadow-premium group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-premium group-hover:scale-105 transition-transform duration-300">
                  {userProfile?.displayName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-950 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
