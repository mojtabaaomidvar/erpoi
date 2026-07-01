// src/features/notifications/hooks/useNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/NotificationService';
import { Notification, NotificationFilter } from '../types';
import { eventBus } from '@infra/events';

/**
 * Hook برای دریافت و مدیریت اعلان‌ها
 */
export function useNotifications(filter?: NotificationFilter) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(() => {
    setIsLoading(true);
    try {
      const filtered = filter
        ? notificationService.getFiltered(filter)
        : notificationService.getAll();
      setNotifications(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const markAsRead = useCallback((id: string) => {
    notificationService.markAsRead(id);
    refresh();
  }, [refresh]);

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
    refresh();
  }, [refresh]);

  const toggleStar = useCallback((id: string) => {
    notificationService.toggleStar(id);
    refresh();
  }, [refresh]);

  const deleteNotification = useCallback((id: string) => {
    notificationService.delete(id);
    refresh();
  }, [refresh]);

  const clearAll = useCallback(() => {
    notificationService.clearAll();
    refresh();
  }, [refresh]);

  const stats = notificationService.getStats();

  useEffect(() => {
    refresh();

    const unsubscribe = eventBus.subscribe('*', () => {
      refresh();
    });

    return unsubscribe;
  }, [refresh]);

  return {
    notifications,
    isLoading,
    stats,
    markAsRead,
    markAllAsRead,
    toggleStar,
    deleteNotification,
    clearAll,
    refresh,
  };
}