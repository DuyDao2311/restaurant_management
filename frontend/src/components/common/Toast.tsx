import { useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import type { Notification } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { handleNotificationNavigation } from '../../config/notificationConfig';

interface ToastProps {
  notification: Notification;
  onClose: () => void;
  onRead: () => void;
}

const Toast = ({ notification, onClose, onRead }: ToastProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Auto close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    onRead();
    onClose();
    handleNotificationNavigation(notification, user?.role, navigate);
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 transform transition-all duration-300 translate-y-0 opacity-100">
      <div className="flex items-start justify-between">
        <div 
          className="flex gap-3 cursor-pointer flex-1"
          onClick={handleClick}
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Bell size={16} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
