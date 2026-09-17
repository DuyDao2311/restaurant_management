import { Notification, NotificationTypeEnum } from '../types';
import { NavigateFunction } from 'react-router-dom';

export interface NotificationConfigType {
  icon?: string; // Tạm thời có thể bỏ qua icon nếu đang dùng cứng Bell ở component
  navigateTo: (reference_id: number | null, role: string, navigate: NavigateFunction) => void;
}

export const notificationConfig: Record<string, NotificationConfigType> = {
  [NotificationTypeEnum.RESERVATION_CREATED]: {
    navigateTo: (reference_id, role, navigate) => {
      if (role === 'ADMIN') {
        // Có thể dẫn hướng tới reservation chi tiết nếu có route, hiện tại dẫn tới list
        navigate('/admin/reservations'); 
      } else if (role === 'STAFF') {
        navigate('/staff/reservations');
      }
    }
  }
};

export const handleNotificationNavigation = (
  notification: Notification,
  role: string | undefined,
  navigate: NavigateFunction
) => {
  if (!role) return;
  const config = notificationConfig[notification.type];
  if (config) {
    config.navigateTo(notification.reference_id, role, navigate);
  }
};
