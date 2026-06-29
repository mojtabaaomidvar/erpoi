// src/infrastructure/events.ts

export type EventType =
  | 'client.created'
  | 'client.updated'
  | 'client.deleted'
  | 'contract.created'
  | 'contract.updated'
  | 'invoice.created'
  | 'invoice.paid'
  | 'inspection.created'
  | 'inspection.updated'
  | string;

export interface DomainEvent<T = unknown> {
  type: EventType;
  payload: T;
  timestamp: Date;
  eventId: string;
  source?: string;
  userId?: string;
  correlationId?: string;
}

export type EventHandler<T = unknown> = (
  event: DomainEvent<T>
) => void | Promise<void>;

export interface IEventBus {
  publish<T>(event: DomainEvent<T>): void;
  subscribe<T>(
    type: EventType,
    handler: EventHandler<T>
  ): () => void;

  once<T>(
    type: EventType,
    handler: EventHandler<T>
  ): () => void;

  clear(): void;

  getStats(): {
    totalSubscribers: number;
    eventTypes: string[];
  };
}