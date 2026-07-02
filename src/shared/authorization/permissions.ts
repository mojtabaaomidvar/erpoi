// src/shared/authorization/permissions.ts

// 🔧 FIX: فقط لیست Entity های ثابت سیستم
// با پیشرفت پروژه، entity های جدید اینجا اضافه میشن
export const ENTITIES = [
  'client',
  'contract',
  'inspection',
  'invoice',
  'ncr',
  'inspector',
  'report',
  'audit_log',
  'setting',
  'user',
  'notification',
  'dashboard',
  'department',
] as const;

export type EntityType = typeof ENTITIES[number];

// 🔧 FIX: لیست Action های پیش‌فرض (فقط برای پیشنهاد در UI)
// ولی اجباری نیست - می‌تونی هر action دلخواهی بسازی
export const DEFAULT_ACTIONS = [
  'create', 'read', 'update', 'delete', 'export', 'import',
  'approve', 'reject', 'assign', 'manage', 'view_all', 'view_own',
] as const;

export type ActionType = typeof DEFAULT_ACTIONS[number];

// 🔧 FIX: گروه‌بندی entity ها برای نمایش در UI
export const ENTITY_GROUPS: Record<EntityType, { label: string; icon: string }> = {
  client: { label: 'Clients', icon: '👥' },
  contract: { label: 'Contracts', icon: '📄' },
  inspection: { label: 'Inspections', icon: '🔍' },
  invoice: { label: 'Invoices', icon: '💵' },
  ncr: { label: 'NCRs', icon: '⚠️' },
  inspector: { label: 'Inspectors', icon: '👷' },
  report: { label: 'Reports', icon: '📊' },
  audit_log: { label: 'Audit Log', icon: '🛡️' },
  setting: { label: 'Settings', icon: '⚙️' },
  user: { label: 'Users', icon: '👤' },
  notification: { label: 'Notifications', icon: '🔔' },
  dashboard: { label: 'Dashboard', icon: '📈' },
  department: { label: 'Departments', icon: '🏢' },
};

// 🔧 FIX: حذف ALL_PERMISSIONS - فقط از DB خونده میشه