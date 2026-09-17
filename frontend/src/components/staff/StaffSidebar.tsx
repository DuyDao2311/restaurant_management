import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Table,
  ShoppingCart,
  X,
  LogOut,
  Calendar,
  Utensils,
  CreditCard,
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
    title: 'OPERATIONS',
    items: [
      { label: 'Tables', path: '/staff/tables', icon: Table },
      { label: 'Reservations', path: '/staff/reservations', icon: Calendar },
      { label: 'Orders', path: '/staff/orders', icon: ShoppingCart },
      { label: 'Payments', path: '/staff/payments', icon: CreditCard },
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
          fixed top-0 left-0 z-50 h-full w-64 bg-[#111111] flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Brand */}
        <div className="pt-8 pb-6 px-6 border-b border-[#222]">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-10 h-10 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
              <Utensils size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-white tracking-widest leading-none">RESTAURANT</h1>
              <p className="text-[9px] text-gray-400 font-medium tracking-widest uppercase mt-1.5">GASTRONOMIE STAFF</p>
            </div>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 lg:hidden p-1 rounded-md text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Service Mode Button (Decorative matching design) */}
        {/* <div className="px-6 pt-6 pb-2">
          {/* <div className="border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 cursor-pointer transition-colors rounded-sm py-2.5 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></div>
            <span className="text-[10px] font-bold text-[#D4AF37] tracking-widest uppercase">SERVICE MODE</span>
          </div> */}
        {/* </div> */}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navSections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? "mt-4" : ""}>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

                  return (
                    <li key={item.path} className="relative">
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[2px] bg-[#D4AF37]" />
                      )}
                      <NavLink
                        to={item.path}
                        onClick={handleNavClick}
                        className={`
                          flex items-center gap-4 px-6 py-3 text-[11px] font-bold uppercase tracking-widest
                          transition-colors duration-150
                          ${isActive
                            ? 'text-[#D4AF37]'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          }
                        `}
                      >
                        <Icon
                          size={16}
                          className={isActive ? 'text-[#D4AF37]' : 'text-gray-500'}
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
        <div className="p-6 border-t border-[#222]">
          <button
            onClick={logout}
            className="flex w-full items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#D4AF37] transition-colors focus:outline-none"
          >
            <LogOut size={16} className="text-gray-500 group-hover:text-[#D4AF37]" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default StaffSidebar;
