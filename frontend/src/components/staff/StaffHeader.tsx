import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { staffCallService, StaffCall } from '../../services/staffCallService.ts';
import { tableService } from '../../services/tableService.ts';
import { RestaurantTable } from '../../types/table.ts';
import NotificationBell from '../common/NotificationBell';
import { useToast } from '../../context/ToastContext';

interface StaffHeaderProps {
  onToggleSidebar: () => void;
}

const pageTitleMap: Record<string, string> = {
  '/staff/dashboard': 'Dashboard',
  '/staff/tables': 'Tables',
  '/staff/orders': 'Orders',
};

const StaffHeader = ({ onToggleSidebar }: StaffHeaderProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();
  const [calls, setCalls] = useState<StaffCall[]>([]);
  const [tables, setTables] = useState<Record<number, string>>({});

  const fetchCalls = async () => {
    try {
      const response = await staffCallService.getCalls(1, 50, 'PENDING');
      if (response.success) {
        setCalls(response.data.items || []);
      }
    } catch (error) {
      console.error('Error fetching staff calls:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await tableService.getTables(1, 100);
      if (response.success) {
        const tableMap: Record<number, string> = {};
        response.data.items.forEach((t: RestaurantTable) => {
          tableMap[t.id] = t.table_number;
        });
        setTables(tableMap);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  useEffect(() => {
    fetchCalls();
    fetchTables();
    const interval = setInterval(fetchCalls, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCompleteCall = async (id: number) => {
    try {
      await staffCallService.updateStatus(id, 'COMPLETED');
      setCalls(calls.filter(c => c.id !== id));
    } catch (error) {
      showToast('Lỗi cập nhật yêu cầu', 'error');
    }
  };

  const pageTitle = pageTitleMap[location.pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
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

      {/* Right side - User info & Notifications */}
      <div className="flex items-center gap-4">
        
        <NotificationBell 
          calls={calls}
          tables={tables}
          onCompleteCall={handleCompleteCall}
        />

        {/* User info */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
            <User size={14} />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {user?.full_name || user?.phone || 'Staff Member'}
            </p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-tight mt-0.5">
              {user?.role || 'STAFF'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;
