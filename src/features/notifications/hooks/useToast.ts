// src/features/notifications/hooks/useToast.ts

import { useState, useCallback } from 'react';
import { Toast, NotificationType } from '../types';
import { notificationService } from '../services/NotificationService';

/**
 * Hook برای نمایش toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    duration = 5000
  ) => {
    const toast: Toast = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      duration,
    };

    setToasts(prev => [...prev, toast]);

    // حذف خودکار بعد از duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Helper functions
  const showSuccess = useCallback((title: string, message: string) => {
    showToast('success', title, message);
  }, [showToast]);

  const showError = useCallback((title: string, message: string) => {
    showToast('error', title, message, 8000);
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string) => {
    showToast('warning', title, message, 6000);
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string) => {
    showToast('info', title, message);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}