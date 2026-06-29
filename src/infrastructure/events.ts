// src/infrastructure/events.ts

export type EventType =
  // Client Events
  |'client.created'|'client.updated'|'client.deleted'|'client.duplicated'// Contract Events
  |'contract.created'|'contract.updated'|'contract.deleted'|'contract.expiring'|'contract.expired'|'contract.terminated'|'contract.renewed'// Inspection Events
  |'inspection.created'|'inspection.updated'|'inspection.assigned'|'inspection.completed'|'inspection.cancelled'// NCR Events
  |'ncr.raised'|'ncr.resolved'|'ncr.closed'// Invoice Events
  |'invoice.created'|'invoice.issued'|'invoice.paid'|'invoice.overdue'|'invoice.cancelled'// Inspector Events
  |'inspector.available'|'inspector.busy'|'inspector.onLeave'// System Events
  |'system.user.login'|'system.user.logout'|'system.theme.changed'|'system.notification.sent'// Storage Events
  |'storage.clients.changed'|'storage.contracts.changed'|'storage.inspections.changed'|'storage.inspectors.changed'|'storage.invoices.changed'|'storage.ncrs.changed'|'storage.settings.changed'|'storage.notifications.changed'|'storage.audit_log.changed'// Wildcard (برای گوش دادن به همه رویدادها)
  |'*';

/**
 * ساختار استاندارد یک Domain Event
 */
export interface DomainEvent<T = unknown> {
  /** نوع رویداد */
  type: EventType;
  /** داده‌های همراه رویداد */
  payload: T;
  /** زمان وقوع رویداد */
  timestamp: Date;
  /** شناسه یکتای رویداد */
  eventId: string;
  /** ماژول/کامپوننت ارسال‌کننده */
  source?: string;
  /** شناسه کاربری که رویداد رو ایجاد کرده */
  userId?: string;
  /** شناسه correlation برای ردیابی زنجیره رویدادها */
  correlationId?: string;
}

/**
 * امضای تابع Handler
 */
export type EventHandler<T = unknown> = (
  event: DomainEvent<T>
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

  /**
   * انتشار یک رویداد به تمام subscriber ها
   */
  publish<T>(event: DomainEvent<T>): void {
    if (this.isDevelopment) {
      console.log(`📢 [EventBus] ${event.type}`, {
        source: event.source,
        payload: event.payload,
      });
    }

    // اگر نوع رویداد'*'هست، به همه handler ها ارسال کن
    if (event.type ==='*') {
      console.warn('[EventBus] Cannot publish wildcard event');
      return;
    }

    // ارسال به subscriber های خاص این نوع
    this.dispatchToSubscribers(event.type, event);

    // ارسال به subscriber های wildcard (اگه وجود داشته باشن)
    this.dispatchToSubscribers('*', event);
  }

  private dispatchToSubscribers<T>(type: string, event: DomainEvent<T>): void {
    const subscribers = this.handlers.get(type);
    if (!subscribers || subscribers.size === 0) {
      if (this.isDevelopment && type !=='*') {
        console.warn(`⚠️ [EventBus] No subscribers for: ${type}`);
      }
      return;
    }

    subscribers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(
          `❌ [EventBus] Error in handler for ${type}:`,
          error
        );
      }
    });
  }

  /**
   * اشتراک در یک نوع رویداد
   * @returns تابع unsubscribe برای cleanup
   */
  subscribe<T>(type: EventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(type)?.delete(handler as EventHandler);
      // پاکسازی خودکار اگه هیچ subscriber ای نمونده
      if (this.handlers.get(type)?.size === 0) {
        this.handlers.delete(type);
      }
    };
  }

  /**
   * اشتراک یک‌بار مصرف (فقط اولین بار اجرا میشه)
   */
  once<T>(type: EventType, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (event) => {
      unsubscribe();
      handler(event);
    };
    const unsubscribe = this.subscribe(type, wrapper);
    return unsubscribe;
  }

  /**
   * پاکسازی تمام subscribers (برای تست‌ها)
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * آمار وضعیت Event Bus (برای دیباگ)
   */
  getStats() {
    return {
      totalSubscribers: Array.from(this.handlers.values()).reduce(
        (sum, set) => sum + set.size,
        0
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

/**
 * Counter برای تولید eventId یکتا
 */
let eventCounter = 0;

/**
 * Helper برای انتشار آسان رویداد
 * 
 * @example
 * publishEvent('client.created', { clientId:'123'}, { source:'client-management'});
 */
export function publishEvent<T>(
  type: EventType,
  payload: T,
  options: { source?: string; userId?: string; correlationId?: string } = {}
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
 * 
 * @example
 * const unsubscribe = subscribeToEvent('contract.expired', (event) => {
 *   console.log('Contract expired:', event.payload);
 * });
 */
export function subscribeToEvent<T>(
  type: EventType,
  handler: EventHandler<T>
): () => void {
  return eventBus.subscribe(type, handler);
}

/**
 * Helper برای اشتراک یک‌بار مصرف
 */
export function subscribeOnce<T>(
  type: EventType,
  handler: EventHandler<T>
): () => void {
  return eventBus.once(type, handler);
}

// ═══════════════════════════════════════════════════════════
// 🔧 Utility ها
// ═══════════════════════════════════════════════════════════

/**
 * ثابت‌های رویدادها برای استفاده به جای رشته‌های خام
 * 
 * @example
 * publishEvent(EVENT_TYPES.CLIENT_CREATED, { ... });
 */
export const EVENT_TYPES = {
  // Client
  CLIENT_CREATED:'client.created'as const,
  CLIENT_UPDATED:'client.updated'as const,
  CLIENT_DELETED:'client.deleted'as const,
  CLIENT_DUPLICATED:'client.duplicated'as const,

  // Contract
  CONTRACT_CREATED:'contract.created'as const,
  CONTRACT_UPDATED:'contract.updated'as const,
  CONTRACT_DELETED:'contract.deleted'as const,
  CONTRACT_EXPIRING:'contract.expiring'as const,
  CONTRACT_EXPIRED:'contract.expired'as const,
  CONTRACT_TERMINATED:'contract.terminated'as const,
  CONTRACT_RENEWED:'contract.renewed'as const,

  // Inspection
  INSPECTION_CREATED:'inspection.created'as const,
  INSPECTION_UPDATED:'inspection.updated'as const,
  INSPECTION_ASSIGNED:'inspection.assigned'as const,
  INSPECTION_COMPLETED:'inspection.completed'as const,
  INSPECTION_CANCELLED:'inspection.cancelled'as const,

  // NCR
  NCR_RAISED:'ncr.raised'as const,
  NCR_RESOLVED:'ncr.resolved'as const,
  NCR_CLOSED:'ncr.closed'as const,

  // Invoice
  INVOICE_CREATED:'invoice.created'as const,
  INVOICE_ISSUED:'invoice.issued'as const,
  INVOICE_PAID:'invoice.paid'as const,
  INVOICE_OVERDUE:'invoice.overdue'as const,
  INVOICE_CANCELLED:'invoice.cancelled'as const,

  // Inspector
  INSPECTOR_AVAILABLE:'inspector.available'as const,
  INSPECTOR_BUSY:'inspector.busy'as const,
  INSPECTOR_ON_LEAVE:'inspector.onLeave'as const,

  // System
  USER_LOGIN:'system.user.login'as const,
  USER_LOGOUT:'system.user.logout'as const,
  THEME_CHANGED:'system.theme.changed'as const,
  NOTIFICATION_SENT:'system.notification.sent'as const,
  
  // Storage Events
  STORAGE_CLIENTS_CHANGED:'storage.clients.changed'as const,
  STORAGE_CONTRACTS_CHANGED:'storage.contracts.changed'as const,
  STORAGE_INSPECTIONS_CHANGED:'storage.inspections.changed'as const,
  STORAGE_INSPECTORS_CHANGED:'storage.inspectors.changed'as const,
  sSTORAGE_INVOICES_CHANGED:'storage.invoices.changed'as const,
  STORAGE_NCRS_CHANGED:'storage.ncrs.changed'as const,

  // Wildcard
  ALL:'*'as const,
} as const;