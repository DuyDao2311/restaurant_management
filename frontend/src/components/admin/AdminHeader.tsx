import { useLocation } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

const pageTitleMap: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/menu': 'Menu',
  '/admin/categories': 'Categories',
  '/admin/tables': 'Tables',
  '/admin/reservations': 'Reservations',
  '/admin/orders': 'Orders',
  '/admin/customers': 'Customers',
  '/admin/staff': 'Staff',
  '/admin/promotions': 'Promotions',
  '/admin/reports': 'Reports',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'Settings',
};

const AdminHeader = ({ onToggleSidebar }: AdminHeaderProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const pageTitle = pageTitleMap[location.pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      {/* Right side - User info & Logout */}
      <div className="flex items-center gap-3">
        {/* User info */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <User size={16} />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {user?.full_name || user?.phone || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize leading-tight">
              {user?.role || 'Unknown'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
