// src/features/notifications/types.ts

export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export type NotificationCategory =
  | 'contract'
  | 'client'
  | 'inspection'
  | 'invoice'
  | 'ncr'
  | 'system'
  | 'general';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  actionUrl?: string; // لینک به صفحه مرتبط
  metadata?: Record<string, unknown>;
}

export interface Toast {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // میلی‌ثانیه، پیش‌فرض 5000
}

export interface NotificationFilter {
  type?: NotificationType;
  category?: NotificationCategory;
  isRead?: boolean;
  isStarred?: boolean;
  search?: string;
}

export interface INotificationService {
  create(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'isStarred'>): Notification;
  getAll(): Notification[];
  getUnread(): Notification[];
  getFiltered(filter: NotificationFilter): Notification[];
  markAsRead(id: string): void;
  markAllAsRead(): void;
  toggleStar(id: string): void;
  delete(id: string): void;
  clearAll(): void;
  getStats(): {
    total: number;
    unread: number;
    starred: number;
    byCategory: Record<NotificationCategory, number>;
  };
}