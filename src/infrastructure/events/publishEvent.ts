// src/infrastructure/events/publishEvent.ts

import type { DomainEvent, EventType } from "./types";
import { eventBus } from "./EventBus";

export function publishEvent<T>(
  type: EventType,
  payload: T,
  userId?: string,
  source: string = "application-service",
): void {
  const event: DomainEvent<T> = {
    type: type as EventType,
    payload,
    timestamp: new Date(),
    eventId: crypto.randomUUID(),
    userId,
    source,
  };

  eventBus.publish(event);
}
