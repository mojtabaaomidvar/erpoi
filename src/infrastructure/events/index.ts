// src/infrastructure/events/index.ts

export { eventBus } from'./EventBus';
export { publishEvent } from'./publishEvent';
export { EVENT_TYPES } from'./registry';
export { useEvent, useEventPublisher } from'./hooks/useEvent';
export type { DomainEvent, EventHandler, EventType, IEventBus } from'./types';