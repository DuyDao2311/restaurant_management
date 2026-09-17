import api from './api';
import type { Notification, NotificationListResponse } from '../types';

export const getNotifications = async (skip = 0, limit = 20, is_read?: boolean): Promise<NotificationListResponse> => {
  const params: any = { skip, limit };
  if (is_read !== undefined) params.is_read = is_read;
  
  const response = await api.get('/notifications', { params });
  return response.data;
};

export const getUnreadCount = async (): Promise<{ unread_count: number }> => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markAsRead = async (id: number): Promise<Notification> => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<{ success: boolean; message: string; updated_count: number }> => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
