// src/features/audit-log/domain/types.ts

export type AuditLogLevel = "info" | "warning" | "error" | "success";
export type AuditActorType = "system" | "user";

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  payload?: any;
  reason?: string;
  created_at: string;

  // فیلدهای مورد انتظار UI
  level?: AuditLogLevel;
  title?: string;
  description?: string;
  timestamp?: string;
  actorType?: AuditActorType;
  userName?: string;
  ipAddress?: string;
}

export interface AuditLogEntry extends AuditLog {}

export interface AuditLogFilter {
  user_id?: string;
  action?: string;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
  level?: AuditLogLevel;
  search?: string;
  actorType?: AuditActorType;
}
