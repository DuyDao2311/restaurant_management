import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, User, Bell, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { staffCallService, StaffCall } from '../../services/staffCallService.ts';
import { tableService } from '../../services/tableService.ts';
import { RestaurantTable } from '../../types/table.ts';

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
  const [calls, setCalls] = useState<StaffCall[]>([]);
  const [tables, setTables] = useState<Record<number, string>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCalls = async () => {
    try {
      const response = await staffCallService.getCalls(1, 50, 'PENDING');
      setCalls(response.items || []);
    } catch (error) {
      console.error('Error fetching staff calls:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await tableService.getTables();
      const tableMap: Record<number, string> = {};
      response.data.forEach((t: RestaurantTable) => {
        tableMap[t.id] = t.table_number;
      });
      setTables(tableMap);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCompleteCall = async (id: number) => {
    try {
      await staffCallService.updateStatus(id, 'COMPLETED');
      setCalls(calls.filter(c => c.id !== id));
    } catch (error) {
      alert('Lỗi cập nhật yêu cầu');
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

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
          >
            <Bell size={20} className="text-gray-600" />
            {calls.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {calls.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 text-sm">Yêu cầu gọi nhân viên</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{calls.length} mới</span>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {calls.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    Không có yêu cầu nào
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {calls.map(call => (
                      <div key={call.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900 text-sm">
                              Bàn {tables[call.table_id] || call.table_id}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">Đang gọi phục vụ...</p>
                        </div>
                        <button
                          onClick={() => handleCompleteCall(call.id)}
                          className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Đã xử lý"
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
