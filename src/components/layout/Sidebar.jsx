import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  MdToday, MdAssignment, MdDashboard, MdGroup, MdSettings,
  MdLogout, MdDeleteSweep, MdTune, MdPerson, MdGavel, MdInfo,
  MdAccountBalance, MdFactCheck, MdAssignmentTurnedIn, MdEventNote,
  MdCorporateFare, MdArticle, MdDarkMode, MdLightMode, MdDateRange
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { logout } from '../../firebase/auth';
import { NAV_ITEMS, ORG_NAME, ROLES } from '../../utils/constants';

const iconMap = {
  MdToday: MdToday,
  MdAssignment: MdAssignment,
  MdDashboard: MdDashboard,
  MdGroup: MdGroup,
  MdSettings: MdSettings,
  MdDeleteSweep: MdDeleteSweep,
  MdTune: MdTune,
  MdPerson: MdPerson,
  MdGavel: MdGavel,
  MdInfo: MdInfo,
  MdAccountBalance: MdAccountBalance,
  MdFactCheck: MdFactCheck,
  MdAssignmentTurnedIn: MdAssignmentTurnedIn,
  MdEventNote: MdEventNote,
  MdCorporateFare: MdCorporateFare,
  MdArticle: MdArticle,
  MdDateRange: MdDateRange
};

const Sidebar = ({ onClose }) => {
  const { userProfile } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    await logout();
  };

  const toggleDarkMode = (e) => {
    e.stopPropagation();
    setIsDarkMode(!isDarkMode);
  };

  // Lọc menu theo quyền user — guard tránh crash khi userProfile null
  const visibleItems = userProfile?.role
    ? NAV_ITEMS.filter(item => item.roles.includes(userProfile.role))
    : [];

  return (
    <aside className="flex flex-col h-full bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-r border-emerald-500/10 w-64 transition-all duration-500 z-50">
      {/* Logo & tên tổ chức */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20 rotate-3 hover:rotate-0 transition-transform duration-300">
            PT
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">HubConnect</h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600 dark:text-emerald-400 truncate opacity-80">{ORG_NAME}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide">
        <div className="mb-4">
          <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Menu Chính</p>
          {visibleItems.map(item => {
            const Icon = iconMap[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                aria-label={item.label}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-black transition-all duration-300 group ${isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 translate-x-1'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`
                }
              >
                <Icon size={20} className="transition-transform duration-300 group-hover:scale-110" />
                <span className="tracking-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Settings section */}
      <div className="px-4 py-4 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-black text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <MdLightMode size={20} className="text-amber-500" /> : <MdDarkMode size={20} className="text-emerald-600" />}
            <span className="tracking-tight">{isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}</span>
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>

      {/* User info + logout card */}
      <div className="p-4">
        <div className="glass-morphism p-4 rounded-3xl border border-emerald-500/10 bg-emerald-50/30 dark:bg-emerald-500/5">
          <div className="flex items-center gap-3 mb-4">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt="" className="w-10 h-10 rounded-xl border-2 border-emerald-500/20 object-cover shadow-sm" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-emerald-500/10">
                {userProfile?.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tight">{userProfile?.displayName}</p>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{ROLES[userProfile?.role]?.label}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all duration-300 border border-red-100/50 dark:border-red-900/20 active:scale-[0.98]"
          >
            <MdLogout size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
