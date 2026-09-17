import { Bell } from 'lucide-react';
import type { Notification } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { handleNotificationNavigation } from '../../config/notificationConfig';

interface NotificationItemProps {
  notification: Notification;
  onCloseDropdown?: () => void;
}

const getRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  
  // Convert UTC to local before diffing since the dateStr is usually UTC from server.
  // Actually, new Date(dateStr) parses the ISO string including 'Z' correctly into local time.
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Vừa xong';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Hôm qua';
  if (diffInDays < 30) return `${diffInDays} ngày trước`;
  
  return date.toLocaleDateString('vi-VN');
};

const NotificationItem = ({ notification, onCloseDropdown }: NotificationItemProps) => {
  const { markAsRead } = useNotification();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (onCloseDropdown) {
      onCloseDropdown();
    }
    
    handleNotificationNavigation(notification, user?.role, navigate);
  };

  return (
    <div 
      onClick={handleClick}
      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${
        !notification.is_read ? 'bg-blue-50/50' : 'bg-white'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        !notification.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
      }`}>
        <Bell size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
          {notification.title}
        </h4>
        <p className={`text-sm mt-0.5 line-clamp-2 ${!notification.is_read ? 'text-gray-600' : 'text-gray-500'}`}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {getRelativeTime(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1"></div>
      )}
    </div>
  );
};

export default NotificationItem;
