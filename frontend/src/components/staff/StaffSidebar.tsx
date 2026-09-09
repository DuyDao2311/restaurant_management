import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Table,
  ShoppingCart,
  X,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface StaffSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Tables', path: '/staff/tables', icon: Table },
      { label: 'Orders', path: '/staff/orders', icon: ShoppingCart },
    ],
  },
];

const StaffSidebar = ({ isOpen, onClose }: StaffSidebarProps) => {
  const location = useLocation();
  const { logout } = useAuth();

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">👨‍🍳</span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-gray-900">Staff Portal</p>
              <p className="text-xs text-gray-500">Restaurant</p>
            </div>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={handleNavClick}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                          transition-colors duration-150
                          ${isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon
                          size={18}
                          className={isActive ? 'text-blue-600' : 'text-gray-400'}
                        />
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors focus:outline-none"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
};

export default StaffSidebar;
