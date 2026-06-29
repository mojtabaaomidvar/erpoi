// src/infrastructure/events/publishEvent.ts

import { eventBus } from'./EventBus';
import { DomainEvent } from'./types';

let eventCounter = 0;

/**
 * Helper برای انتشار آسان رویداد
 */
export function publishEvent<T>(
  type: string,
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