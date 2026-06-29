// src/infrastructure/events/EventBus.ts

import { DomainEvent, EventHandler, IEventBus } from'./types';

/**
 * Event Bus مرکزی با الگوی Singleton
 * 
 * ویژگی‌ها:
 * - Thread-safe (در محیط browser)
 * - Error isolation (یک handler خراب بقیه رو متوقف نمی‌کنه)
 * - Memory leak prevention
 * - Debug logging در dev mode
 */
class EventBus implements IEventBus {
  private static instance: EventBus;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private isDevelopment = process.env.NODE_ENV ==='development';

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

    const subscribers = this.handlers.get(event.type);
    if (!subscribers || subscribers.size === 0) {
      if (this.isDevelopment) {
        console.warn(`⚠️ [EventBus] No subscribers for event: ${event.type}`);
      }
      return;
    }

    subscribers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(
          `❌ [EventBus] Error in handler for ${event.type}:`,
          error
        );
      }
    });
  }

  /**
   * اشتراک در یک نوع رویداد
   * @returns تابع unsubscribe برای cleanup
   */
  subscribe<T>(type: string, handler: EventHandler<T>): () => void {
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
  once<T>(type: string, handler: EventHandler<T>): () => void {
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

/**
 * Instance سراسری Event Bus
 */
export const eventBus = EventBus.getInstance();