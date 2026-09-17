import { useNotification } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StaffCall } from '../../services/staffCallService';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface NotificationDropdownProps {
  onClose: () => void;
  calls?: StaffCall[];
  tables?: Record<number, string>;
  onCompleteCall?: (id: number) => void;
}

const NotificationDropdown = ({ onClose, calls = [], tables = {}, onCompleteCall }: NotificationDropdownProps) => {
  const { notifications, loading, markAllAsRead, unreadCount } = useNotification();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'system' | 'calls'>('system');

  const isStaffView = !!onCompleteCall;

  const handleViewAll = () => {
    onClose();
    if (user?.role === 'ADMIN') {
      navigate('/admin/notifications');
    } else {
      navigate('/staff/notifications');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Thông báo</h3>
        {(!isStaffView || activeTab === 'system') && unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Tabs for Staff */}
      {isStaffView && (
        <div className="flex border-b border-gray-100 bg-white">
          <button
            className={`flex-1 py-2 text-sm font-medium text-center relative ${activeTab === 'system' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('system')}
          >
            Hệ thống
            {unreadCount > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-600 text-[10px] py-0.5 px-1.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
            {activeTab === 'system' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium text-center relative ${activeTab === 'calls' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('calls')}
          >
            Gọi phục vụ
            {calls.length > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-600 text-[10px] py-0.5 px-1.5 rounded-full font-bold">
                {calls.length}
              </span>
            )}
            {activeTab === 'calls' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
      )}

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {(!isStaffView || activeTab === 'system') ? (
          <>
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <span className="text-3xl mb-2">🔕</span>
                <p className="text-sm">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 10).map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onCloseDropdown={onClose}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {calls.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <span className="text-3xl mb-2">👋</span>
                <p className="text-sm">Không có yêu cầu gọi phục vụ</p>
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
                      onClick={() => onCompleteCall && onCompleteCall(call.id)}
                      className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors shrink-0"
                      title="Đã xử lý"
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {(!isStaffView || activeTab === 'system') && notifications.length > 0 && (
        <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
          <button
            onClick={handleViewAll}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium w-full py-1"
          >
            Xem tất cả
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
