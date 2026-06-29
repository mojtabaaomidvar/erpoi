// src/infrastructure/events/registry.ts

/**
 * لیست مرکزی تمام رویدادهای سیستم
 * جلوگیری از Magic Strings و اطمینان از Type Safety
 */
export const EVENT_TYPES = {
  // ═══════════════════════════════════════
  // Client Events
  // ═══════════════════════════════════════
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_DELETED: 'client.deleted',
  CLIENT_DUPLICATED: 'client.duplicated',

  // ═══════════════════════════════════════
  // Contract Events
  // ═══════════════════════════════════════
  CONTRACT_CREATED: 'contract.created',
  CONTRACT_UPDATED: 'contract.updated',
  CONTRACT_EXPIRING: 'contract.expiring',     // 132 روز مانده به پایان
  CONTRACT_EXPIRED: 'contract.expired',
  CONTRACT_TERMINATED: 'contract.terminated',
  CONTRACT_RENEWED: 'contract.renewed',

  // ═══════════════════════════════════════
  // Inspection Events
  // ═══════════════════════════════════════
  INSPECTION_REQUESTED: 'inspection.requested',
  INSPECTION_ASSIGNED: 'inspection.assigned',
  INSPECTION_COMPLETED: 'inspection.completed',
  INSPECTION_CANCELLED: 'inspection.cancelled',

  // ═══════════════════════════════════════
  // NCR Events
  // ═══════════════════════════════════════
  NCR_RAISED: 'ncr.raised',
  NCR_RESOLVED: 'ncr.resolved',
  NCR_CLOSED: 'ncr.closed',

  // ═══════════════════════════════════════
  // Invoice Events
  // ═══════════════════════════════════════
  INVOICE_ISSUED: 'invoice.issued',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_OVERDUE: 'invoice.overdue',

  // ═══════════════════════════════════════
  // Inspector Events
  // ═══════════════════════════════════════
  INSPECTOR_AVAILABLE: 'inspector.available',
  INSPECTOR_BUSY: 'inspector.busy',
  INSPECTOR_ON_LEAVE: 'inspector.onLeave',

  // ═══════════════════════════════════════
  // System Events
  // ═══════════════════════════════════════
  USER_LOGIN: 'system.user.login',
  USER_LOGOUT: 'system.user.logout',
  THEME_CHANGED: 'system.theme.changed',
  NOTIFICATION_SENT: 'system.notification.sent',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];