// src/features/audit-log/types.ts
import { DomainEvent } from '@infra/events';

export type AuditLogLevel = 'info' | 'warning' | 'error' | 'success';
export type AuditActorType = 'user' | 'system';

export interface AuditLogEntry {
  id: string;
  eventType: string;
  title: string;
  description?: string;
  level: AuditLogLevel;
  actorType: AuditActorType;
  payload: unknown;
  source?: string;
  userId?: string;
  userName?: string;
  userDepartment?: string;
  ipAddress?: string;
  timestamp: Date;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogFilter {
  eventType?: string;
  level?: AuditLogLevel;
  actorType?: AuditActorType;
  userId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export interface IAuditLogService {
  log(event: DomainEvent, metadata?: Record<string, unknown>): AuditLogEntry;
  getAll(): AuditLogEntry[];
  getFiltered(filter: AuditLogFilter): AuditLogEntry[];
  getById(id: string): AuditLogEntry | undefined;
  clear(): void;
  export(): string;
  exportAll(): string;
  getArchivedLogs(): AuditLogEntry[];
}