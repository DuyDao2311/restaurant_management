import { createContext, useState, useEffect, useContext, type ReactNode, useRef } from 'react';
import notificationService from '../services/notificationService';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import type { Notification, NotificationContextType } from '../types';
import Toast from '../components/common/Toast';

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);
  
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [hasMore, setHasMore] = useState<boolean>(false);
  const skipRef = useRef(0);
  const limit = 50;

  const fetchNotifications = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        skipRef.current = 0;
      }
      
      const isReadParam = filter === 'UNREAD' ? false : undefined;
      const res = await notificationService.getNotifications(skipRef.current, limit, isReadParam);
      
      if (reset) {
        setNotifications(res.items);
      } else {
        // Prevent duplicate during load more
        setNotifications((prev) => {
          const newItems = res.items.filter(newItem => !prev.some(p => p.id === newItem.id));
          return [...prev, ...newItems];
        });
      }
      
      // Update unread count based on total DB unread count, not just loaded items
      setUnreadCount(res.unread_count);
      setHasMore(skipRef.current + limit < res.total_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    skipRef.current += limit;
    await fetchNotifications(false);
  };

  // Re-fetch when filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(true);
    }
  }, [filter, isAuthenticated]);

  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setToastNotification(null);
      setFilter('ALL');
      setHasMore(false);
      skipRef.current = 0;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isAuthenticated) return;

    const handleNewNotification = (newNotif: Notification) => {
      setNotifications((prev) => {
        // Prevent duplicate
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        
        // If we are filtering by UNREAD, all new socket notifications are unread initially.
        // If filter is ALL, we also prepend it. 
        // So we just prepend it in both cases.
        return [newNotif, ...prev];
      });
      
      setUnreadCount((prev) => prev + 1);

      // Show toast
      setToastNotification(newNotif);
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [isAuthenticated]); // We rely on getSocket which is established in AuthContext when isAuthenticated is true

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        hasMore,
        filter,
        setFilter,
        fetchNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
      {toastNotification && (
        <Toast
          notification={toastNotification}
          onClose={() => setToastNotification(null)}
          onRead={() => markAsRead(toastNotification.id)}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
