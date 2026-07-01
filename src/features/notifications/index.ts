// src/features/notifications/index.ts

export { notificationService } from './services/NotificationService';
export { useNotifications } from './hooks/useNotifications';
export { useToast } from './hooks/useToast';
export { useEventToNotification } from './hooks/useEventToNotification';
export { NotificationCenter } from './ui/NotificationCenter';
export { ToastContainer } from './ui/ToastContainer';
export type {
  Notification,
  Toast,
  NotificationType,
  NotificationCategory,
  NotificationFilter,
  INotificationService,
} from './types';