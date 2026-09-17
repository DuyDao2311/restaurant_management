import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import { StaffCall } from '../../services/staffCallService';

interface NotificationBellProps {
  calls?: StaffCall[];
  tables?: Record<number, string>;
  onCompleteCall?: (id: number) => void;
}

const NotificationBell = ({ calls = [], tables = {}, onCompleteCall }: NotificationBellProps) => {
  const { unreadCount } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Thông báo"
      >
        <Bell size={20} />
        {(unreadCount + calls.length) > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {(unreadCount + calls.length) > 99 ? '99+' : (unreadCount + calls.length)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50">
          <NotificationDropdown 
            onClose={() => setIsOpen(false)} 
            calls={calls}
            tables={tables}
            onCompleteCall={onCompleteCall}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
