// Sidebar — menu chính bên trái
import { NavLink } from 'react-router-dom';
import { MdToday, MdAssignment, MdDashboard, MdGroup, MdSettings, MdLogout, MdDeleteSweep } from 'react-icons/md';
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
};

const Sidebar = ({ onClose }) => {
  const { userProfile, isAdmin, isManager } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  // Lọc menu theo quyền user
  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(userProfile?.role)
  );

  return (
    <aside className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      {/* Logo & tên tổ chức */}
      <div className="px-5 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
            PT
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">Quản lý công việc</h1>
            <p className="text-xs text-gray-500 truncate">{ORG_NAME}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
            {userProfile?.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userProfile?.displayName}</p>
            <p className="text-xs text-gray-500">{ROLES[userProfile?.role]?.label}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-item nav-item-inactive w-full mt-1 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <MdLogout size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
