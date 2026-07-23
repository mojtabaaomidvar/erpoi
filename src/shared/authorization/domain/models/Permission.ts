//src/shared/authorization/domain/models/Permission.ts

export type Permission = string;

export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "import"
  | "approve"
  | "reject"
  | "assign"
  | "manage"
  | "view_all"
  | "view_own";

export type EntityType =
  | "client"
  | "contract"
  | "inspection"
  | "invoice"
  | "ncr"
  | "inspector"
  | "report"
  | "audit_log"
  | "setting"
  | "user"
  | "notification"
  | "dashboard"
  | "department";