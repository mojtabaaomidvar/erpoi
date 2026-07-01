// src/features/notifications/services/NotificationService.ts

import {
  Notification,
  NotificationCategory,
  NotificationFilter,
  INotificationService,
} from '../types';

const STORAGE_KEY = 'ics_notifications';
const MAX_NOTIFICATIONS = 500;

class NotificationService implements INotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  create(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'isStarred'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false,
      isStarred: false,
    };

    this.notifications.unshift(newNotification);

    if (this.notifications.length > MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, MAX_NOTIFICATIONS);
    }

    this.saveToStorage();
    return newNotification;
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  getFiltered(filter: NotificationFilter): Notification[] {
    return this.notifications.filter((n) => {
      if (filter.type && n.type !== filter.type) return false;
      if (filter.category && n.category !== filter.category) return false;
      if (filter.isRead !== undefined && n.isRead !== filter.isRead) return false;
      if (filter.isStarred !== undefined && n.isStarred !== filter.isStarred) return false;
      
      if (filter.search) {
        const search = filter.search.toLowerCase();
        const searchableText = `${n.title} ${n.message}`.toLowerCase();
        if (!searchableText.includes(search)) return false;
      }
      
      return true;
    });
  }

  markAsRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.saveToStorage();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.saveToStorage();
  }

  toggleStar(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.isStarred = !notif.isStarred;
      this.saveToStorage();
    }
  }

  delete(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
  }

  clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
  }

  getStats() {
    const byCategory = {} as Record<NotificationCategory, number>;
    this.notifications.forEach(n => {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
    });

    return {
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.isRead).length,
      starred: this.notifications.filter(n => n.isStarred).length,
      byCategory,
    };
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (error) {
      console.error('[NotificationService] Failed to load:', error);
      this.notifications = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('[NotificationService] Failed to save:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();