// src/features/notifications/hooks/useEventToNotification.ts

import { useEffect } from 'react';
import { eventBus } from '@infra/events';
import { notificationService } from '../services/NotificationService';

/**
 * تبدیل خودکار رویدادهای Event Bus به اعلان
 */
export function useEventToNotification() {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('*', (event) => {
      // تبدیل eventType به notification
      const notification = mapEventToNotification(event);
      
      if (notification) {
        notificationService.create(notification);
      }
    });

    return unsubscribe;
  }, []);
}

function mapEventToNotification(event: any) {
  const eventType = event.type;
  const payload = event.payload;

  // Contract Events
  if (eventType.includes('contract.expiring')) {
    return {
      type: 'warning' as const,
      category: 'contract' as const,
      title: 'Contract Expiring Soon',
      message: `Contract ${payload.contractNo || payload.contractId} is expiring in ${payload.daysLeft} days`,
    };
  }

  if (eventType.includes('contract.expired')) {
    return {
      type: 'error' as const,
      category: 'contract' as const,
      title: 'Contract Expired',
      message: `Contract ${payload.contractNo || payload.contractId} has expired`,
    };
  }

  if (eventType.includes('contract.created')) {
    return {
      type: 'success' as const,
      category: 'contract' as const,
      title: 'New Contract Created',
      message: `Contract ${payload.contractNo || payload.contractId} has been created`,
    };
  }

  // Client Events
  if (eventType.includes('client.created')) {
    return {
      type: 'success' as const,
      category: 'client' as const,
      title: 'New Client Added',
      message: `Client ${payload.clientName || payload.clientId} has been added`,
    };
  }

  // Inspection Events
  if (eventType.includes('inspection.completed')) {
    return {
      type: 'success' as const,
      category: 'inspection' as const,
      title: 'Inspection Completed',
      message: `Inspection ${payload.inspectionNo || payload.inspectionId} has been completed`,
    };
  }

  // Invoice Events
  if (eventType.includes('invoice.overdue')) {
    return {
      type: 'error' as const,
      category: 'invoice' as const,
      title: 'Invoice Overdue',
      message: `Invoice ${payload.invoiceNo || payload.invoiceId} is overdue`,
    };
  }

  if (eventType.includes('invoice.paid')) {
    return {
      type: 'success' as const,
      category: 'invoice' as const,
      title: 'Invoice Paid',
      message: `Invoice ${payload.invoiceNo || payload.invoiceId} has been paid`,
    };
  }

  // NCR Events
  if (eventType.includes('ncr.raised')) {
    return {
      type: 'warning' as const,
      category: 'ncr' as const,
      title: 'NCR Raised',
      message: `NCR ${payload.ncrNo || payload.ncrId} has been raised`,
    };
  }

  // System Events
  if (eventType.includes('system.theme.changed')) {
    return {
      type: 'info' as const,
      category: 'system' as const,
      title: 'Theme Changed',
      message: `Theme changed to ${payload.newValue || 'unknown'}`,
    };
  }

  return null;
}