// src/infrastructure/events.ts

// ═══════════════════════════════════════════════════════════
// 🎯 Type Definitions
// ═══════════════════════════════════════════════════════════

export type EventType =
  // Client Events
  | "client.created"
  | "client.updated"
  | "client.deleted"
  | "client.duplicated"

  // Contract Events
  | "contract.created"
  | "contract.updated"
  | "contract.deleted"
  | "contract.expiring"
  | "contract.expired"
  | "contract.terminated"
  | "contract.renewed"

  // Project Events
  | "project.created"
  | "project.updated"
  | "project.deleted"
  | "project.member.added"
  | "project.member.removed"

  // Inspection Events
  | "inspection.created"
  | "inspection.updated"
  | "inspection.assigned"
  | "inspection.completed"
  | "inspection.cancelled"
  | "inspection.deleted"
  | "inspection.session.deleted"
  | "tpi.package.deletion.requested"
  | "tpi.package.deletion.approved"
  | "tpi.package.deletion.rejected"

  // NCR Events
  | "ncr.raised"
  | "ncr.resolved"
  | "ncr.closed"

  // Invoice Events
  | "invoice.created"
  | "invoice.issued"
  | "invoice.paid"
  | "invoice.overdue"
  | "invoice.cancelled"
  | "invoice.updated"
  | "invoice.deleted"

  // Inspector Events
  | "inspector.created"
  | "inspector.available"
  | "inspector.busy"
  | "inspector.onLeave"
  | "inspector.updated"
  | "inspector.deleted"

  // User Events
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "user.role.changed"
  | "user.status.changed"
  | "user.permissions.changed"
  | "user.password.reset"

  // Role Events
  | "user.role.created"
  | "user.role.updated"
  | "user.role.deleted"

  // Storage Events
  | "storage.clients.changed"
  | "storage.contracts.changed"
  | "storage.inspections.changed"
  | "storage.inspectors.changed"
  | "storage.invoices.changed"
  | "storage.ncrs.changed"
  | "storage.settings.changed"
  | "storage.notifications.changed"

  // System Events
  | "system.user.login"
  | "system.user.logout"
  | "system.theme.changed"
  | "system.notification.sent"

  // 🔧 NEW: Amendment Events
  | "amendment.created"
  | "amendment.approved"
  | "amendment.rejected"

  // 🔧 NEW: Notification Events
  | "notification.created"
  | "notification.read"
  | "notification.deleted"

  // Wildcard
  | "*";

/**
 * ساختار استاندارد یک Domain Event
 */
export interface DomainEvent<T = unknown> {
  type: EventType;
  payload: T;
  timestamp: Date;
  eventId: string;
  source?: string;
  userId?: string;
  correlationId?: string;
}

/**
 * امضای تابع Handler
 */
export type EventHandler<T = unknown> = (
  event: DomainEvent<T>,
) => void | Promise<void>;

/**
 * رابط کاربری برای Event Bus
 */
export interface IEventBus {
  publish<T>(event: DomainEvent<T>): void;
  subscribe<T>(type: EventType, handler: EventHandler<T>): () => void;
  once<T>(type: EventType, handler: EventHandler<T>): () => void;
  clear(): void;
  getStats(): {
    totalSubscribers: number;
    eventTypes: string[];
  };
}

// ═══════════════════════════════════════════════════════════
// 🏗️ کلاس EventBus (Singleton)
// ═══════════════════════════════════════════════════════════

class EventBus implements IEventBus {
  private static instance: EventBus;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private isDevelopment = import.meta.env.DEV;

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  publish<T>(event: DomainEvent<T>): void {
    if (this.isDevelopment) {
      console.log(`📢 [EventBus] ${event.type}`, {
        source: event.source,
        payload: event.payload,
      });
    }

    if (event.type === "*") {
      console.warn("[EventBus] Cannot publish wildcard event");
      return;
    }

    this.dispatchToSubscribers(event.type, event);
    this.dispatchToSubscribers("*", event);
  }

  private dispatchToSubscribers<T>(type: string, event: DomainEvent<T>): void {
    const subscribers = this.handlers.get(type);
    if (!subscribers || subscribers.size === 0) {
      if (this.isDevelopment && type !== "*") {
        console.warn(`⚠️ [EventBus] No subscribers for: ${type}`);
      }
      return;
    }

    subscribers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`❌ [EventBus] Error in handler for ${type}:`, error);
      }
    });
  }

  subscribe<T>(type: EventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(type)?.delete(handler as EventHandler);
      if (this.handlers.get(type)?.size === 0) {
        this.handlers.delete(type);
      }
    };
  }

  once<T>(type: EventType, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (event) => {
      unsubscribe();
      handler(event);
    };
    const unsubscribe = this.subscribe(type, wrapper);
    return unsubscribe;
  }

  clear(): void {
    this.handlers.clear();
  }

  getStats() {
    return {
      totalSubscribers: Array.from(this.handlers.values()).reduce(
        (sum, set) => sum + set.size,
        0,
      ),
      eventTypes: Array.from(this.handlers.keys()),
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 🎯 Instance سراسری و Helper ها
// ═══════════════════════════════════════════════════════════

/**
 * Instance سراسری Event Bus
 */
export const eventBus = EventBus.getInstance();

let eventCounter = 0;

/**
 * Helper برای انتشار آسان رویداد
 */
export function publishEvent<T>(
  type: EventType,
  payload: T,
  options: { source?: string; userId?: string; correlationId?: string } = {},
): void {
  const event: DomainEvent<T> = {
    type,
    payload,
    timestamp: new Date(),
    eventId: `evt_${Date.now()}_${++eventCounter}`,
    ...options,
  };
  eventBus.publish(event);
}

/**
 * Helper برای اشتراک آسان
 */
export function subscribeToEvent<T>(
  type: EventType,
  handler: EventHandler<T>,
): () => void {
  return eventBus.subscribe(type, handler);
}

/**
 * Helper برای اشتراک یک‌بار مصرف
 */
export function subscribeOnce<T>(
  type: EventType,
  handler: EventHandler<T>,
): () => void {
  return eventBus.once(type, handler);
}

// ═══════════════════════════════════════════════════════════
// 🎯 Event Types Registry
// ═══════════════════════════════════════════════════════════

export const EVENT_TYPES = {
  // Client
  CLIENT_CREATED: "client.created" as const,
  CLIENT_UPDATED: "client.updated" as const,
  CLIENT_DELETED: "client.deleted" as const,
  CLIENT_DUPLICATED: "client.duplicated" as const,

  // Contract
  CONTRACT_CREATED: "contract.created" as const,
  CONTRACT_UPDATED: "contract.updated" as const,
  CONTRACT_DELETED: "contract.deleted" as const,
  CONTRACT_EXPIRING: "contract.expiring" as const,
  CONTRACT_EXPIRED: "contract.expired" as const,
  CONTRACT_TERMINATED: "contract.terminated" as const,
  CONTRACT_RENEWED: "contract.renewed" as const,

  // Inspection
  INSPECTION_CREATED: "inspection.created" as const,
  INSPECTION_UPDATED: "inspection.updated" as const,
  INSPECTION_ASSIGNED: "inspection.assigned" as const,
  INSPECTION_COMPLETED: "inspection.completed" as const,
  INSPECTION_CANCELLED: "inspection.cancelled" as const,
  INSPECTION_DELETED: "inspection.deleted" as const,
  INSPECTION_SESSION_DELETED: "inspection.session.deleted" as const,
  TPI_PACKAGE_DELETION_REQUESTED: "tpi.package.deletion.requested" as const,
  TPI_PACKAGE_DELETION_APPROVED: "tpi.package.deletion.approved" as const,
  TPI_PACKAGE_DELETION_REJECTED: "tpi.package.deletion.rejected" as const,

  // NCR
  NCR_RAISED: "ncr.raised" as const,
  NCR_RESOLVED: "ncr.resolved" as const,
  NCR_CLOSED: "ncr.closed" as const,

  // Invoice
  INVOICE_CREATED: "invoice.created" as const,
  INVOICE_ISSUED: "invoice.issued" as const,
  INVOICE_PAID: "invoice.paid" as const,
  INVOICE_OVERDUE: "invoice.overdue" as const,
  INVOICE_CANCELLED: "invoice.cancelled" as const,
  INVOICE_UPDATED: "invoice.updated" as const,
  INVOICE_DELETED: "invoice.deleted" as const,

  // Inspector
  INSPECTOR_AVAILABLE: "inspector.available" as const,
  INSPECTOR_BUSY: "inspector.busy" as const,
  INSPECTOR_ON_LEAVE: "inspector.onLeave" as const,
  INSPECTOR_CREATED: "inspector.created" as const,
  INSPECTOR_UPDATED: "inspector.updated" as const,
  INSPECTOR_DELETED: "inspector.deleted" as const,

  // System
  USER_LOGIN: "system.user.login" as const,
  USER_LOGOUT: "system.user.logout" as const,
  THEME_CHANGED: "system.theme.changed" as const,
  NOTIFICATION_SENT: "system.notification.sent" as const,

  // Storage Events
  STORAGE_CLIENTS_CHANGED: "storage.clients.changed" as const,
  STORAGE_CONTRACTS_CHANGED: "storage.contracts.changed" as const,
  STORAGE_INSPECTIONS_CHANGED: "storage.inspections.changed" as const,
  STORAGE_INSPECTORS_CHANGED: "storage.inspectors.changed" as const,
  STORAGE_INVOICES_CHANGED: "storage.invoices.changed" as const,
  STORAGE_NCRS_CHANGED: "storage.ncrs.changed" as const,

  // User Events
  USER_CREATED: "user.created" as const,
  USER_UPDATED: "user.updated" as const,
  USER_DELETED: "user.deleted" as const,
  USER_ROLE_CHANGED: "user.role.changed" as const,
  USER_STATUS_CHANGED: "user.status.changed" as const,
  USER_PERMISSIONS_CHANGED: "user.permissions.changed" as const,
  USER_PASSWORD_RESET: "user.password.reset" as const,

  // Role Events
  USER_ROLE_CREATED: "user.role.created" as const,
  USER_ROLE_UPDATED: "user.role.updated" as const,
  USER_ROLE_DELETED: "user.role.deleted" as const,

  // 🔧 NEW: Amendment Events
  AMENDMENT_CREATED: "amendment.created" as const,
  AMENDMENT_APPROVED: "amendment.approved" as const,
  AMENDMENT_REJECTED: "amendment.rejected" as const,

  // 🔧 NEW: Notification Events
  NOTIFICATION_CREATED: "notification.created" as const,
  NOTIFICATION_READ: "notification.read" as const,
  NOTIFICATION_DELETED: "notification.deleted" as const,

  // Wildcard
  ALL: "*" as const,
} as const;

// ═══════════════════════════════════════════════════════════
// 🪝 React Hook (inline برای جلوگیری از circular dependency)
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef } from "react";

/**
 * Hook برای اشتراک در رویدادها در کامپوننت‌های React
 * با auto-cleanup در unmount
 */
export function useEvent<T = unknown>(
  eventType: EventType,
  handler: EventHandler<T>,
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const stableHandler: EventHandler<T> = (event) => {
      handlerRef.current(event);
    };

    const unsubscribe = eventBus.subscribe(eventType, stableHandler);
    return unsubscribe;
  }, [eventType]);
}

/**
 * Hook برای انتشار رویداد
 */
export function useEventPublisher() {
  return <T>(type: EventType, payload: T, source?: string) => {
    publishEvent(type, payload, { source });
  };
}
