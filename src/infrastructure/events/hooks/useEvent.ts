// src/infrastructure/events/hooks/useEvent.ts

import { useEffect, useRef } from 'react';
import { eventBus } from '../EventBus';
import { EventHandler } from '../types';

/**
 * Hook برای اشتراک در رویدادها در کامپوننت‌های React
 * 
 * ویژگی‌ها:
 * - Cleanup خودکار هنگام unmount
 * - جلوگیری از stale closure با useRef
 * - Type safety
 * 
 * @example
 * useEvent(EVENT_TYPES.CONTRACT_EXPIRED, (event) => {
 *   showNotification(`قرارداد ${event.payload.contractId} منقضی شد`);
 * });
 */
export function useEvent<T>(
  eventType: string,
  handler: EventHandler<T>
): void {
  const handlerRef = useRef(handler);

  // به‌روزرسانی ref با آخرین handler (جلوگیری از stale closure)
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
  return (type: string, payload: unknown, source?: string) => {
    import('../publishEvent').then(({ publishEvent }) => {
      publishEvent(type, payload, { source });
    });
  };
}