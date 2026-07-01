// src/shared/authorization/permissions.ts

import { Permission, EntityType, ActionType } from './types';

// ═══════════════════════════════════════
// 📝 لیست تمام Permission ها
// ═══════════════════════════════════════
export const ALL_PERMISSIONS: Permission[] = [
  // Client
  'client:create', 'client:read', 'client:update', 'client:delete',
  'client:export', 'client:import', 'client:view_all', 'client:view_own', 'client:manage',

  // Contract
  'contract:create', 'contract:read', 'contract:update', 'contract:delete',
  'contract:export', 'contract:approve', 'contract:reject', 'contract:view_all', 'contract:view_own', 'contract:manage',

  // Inspection
  'inspection:create', 'inspection:read', 'inspection:update', 'inspection:delete',
  'inspection:export', 'inspection:assign', 'inspection:approve', 'inspection:view_all', 'inspection:view_own', 'inspection:manage',

  // Invoice
  'invoice:create', 'invoice:read', 'invoice:update', 'invoice:delete',
  'invoice:export', 'invoice:approve', 'invoice:view_all', 'invoice:view_own', 'invoice:manage',

  // NCR
  'ncr:create', 'ncr:read', 'ncr:update', 'ncr:delete',
  'ncr:export', 'ncr:approve', 'ncr:view_all', 'ncr:view_own', 'ncr:manage',

  // Inspector
  'inspector:create', 'inspector:read', 'inspector:update', 'inspector:delete',
  'inspector:export', 'inspector:assign', 'inspector:view_all', 'inspector:manage',

  // Report
  'report:create', 'report:read', 'report:export', 'report:manage',

  // Audit Log
  'audit_log:read', 'audit_log:export', 'audit_log:manage',

  // Notification
  'notification:read', 'notification:manage',

  // User
  'user:create', 'user:read', 'user:update', 'user:delete', 'user:manage',

  // Setting
  'setting:read', 'setting:update', 'setting:manage',
];

// ═══════════════════════════════════════
// 📖 توضیحات هر Permission
// ═══════════════════════════════════════
export const PERMISSION_DESCRIPTIONS: Partial<Record<Permission, { label: string; description: string }>> = {
  // Client Permissions
  'client:create': { 
    label: 'Create Client', 
    description: 'Allows adding new clients to the system. Required for anyone who needs to register new customers.' 
  },
  'client:read': { 
    label: 'View Client Details', 
    description: 'Allows viewing basic client information. Does not include viewing all clients (see view_all).' 
  },
  'client:update': { 
    label: 'Edit Client Information', 
    description: 'Allows modifying client details such as name, contact info, and address.' 
  },
  'client:delete': { 
    label: 'Delete Clients', 
    description: 'Allows removing clients from the system. Use with caution as this cannot be undone.' 
  },
  'client:export': { 
    label: 'Export Client Data', 
    description: 'Allows exporting client information to CSV/Excel files.' 
  },
  'client:import': { 
    label: 'Import Clients', 
    description: 'Allows importing clients from CSV/Excel files.' 
  },
  'client:view_all': { 
    label: 'View All Clients', 
    description: 'Allows viewing ALL clients in the system, not just assigned ones. Useful for managers and admins.' 
  },
  'client:view_own': { 
    label: 'View Own Clients', 
    description: 'Allows viewing only clients assigned to this user. More restrictive than view_all.' 
  },
  'client:manage': { 
    label: 'Full Client Management', 
    description: 'Grants all client permissions (create, read, update, delete, export, import, view_all, view_own).' 
  },

  // Contract Permissions
  'contract:create': { 
    label: 'Create Contract', 
    description: 'Allows creating new contracts with clients.' 
  },
  'contract:read': { 
    label: 'View Contract Details', 
    description: 'Allows viewing contract information and terms.' 
  },
  'contract:update': { 
    label: 'Edit Contract', 
    description: 'Allows modifying contract details, terms, and pricing.' 
  },
  'contract:delete': { 
    label: 'Delete Contract', 
    description: 'Allows removing contracts from the system.' 
  },
  'contract:export': { 
    label: 'Export Contracts', 
    description: 'Allows exporting contract data to files.' 
  },
  'contract:approve': { 
    label: 'Approve Contracts', 
    description: 'Allows approving pending contracts. Required for contract workflow.' 
  },
  'contract:reject': { 
    label: 'Reject Contracts', 
    description: 'Allows rejecting contracts with a reason.' 
  },
  'contract:view_all': { 
    label: 'View All Contracts', 
    description: 'Allows viewing ALL contracts in the system.' 
  },
  'contract:view_own': { 
    label: 'View Own Contracts', 
    description: 'Allows viewing only contracts assigned to or created by this user.' 
  },
  'contract:manage': { 
    label: 'Full Contract Management', 
    description: 'Grants all contract permissions.' 
  },

  // Inspection Permissions
  'inspection:create': { 
    label: 'Create Inspection', 
    description: 'Allows creating new inspection requests.' 
  },
  'inspection:read': { 
    label: 'View Inspection Details', 
    description: 'Allows viewing inspection information and status.' 
  },
  'inspection:update': { 
    label: 'Edit Inspection', 
    description: 'Allows modifying inspection details and updating status.' 
  },
  'inspection:delete': { 
    label: 'Delete Inspection', 
    description: 'Allows removing inspections from the system.' 
  },
  'inspection:export': { 
    label: 'Export Inspections', 
    description: 'Allows exporting inspection data and reports.' 
  },
  'inspection:assign': { 
    label: 'Assign Inspectors', 
    description: 'Allows assigning inspectors to inspections. Critical for inspection managers.' 
  },
  'inspection:approve': { 
    label: 'Approve Inspections', 
    description: 'Allows approving completed inspections and finalizing reports.' 
  },
  'inspection:view_all': { 
    label: 'View All Inspections', 
    description: 'Allows viewing ALL inspections in the system.' 
  },
  'inspection:view_own': { 
    label: 'View Own Inspections', 
    description: 'Allows viewing only inspections assigned to this user.' 
  },
  'inspection:manage': { 
    label: 'Full Inspection Management', 
    description: 'Grants all inspection permissions.' 
  },

  // Invoice Permissions
  'invoice:create': { 
    label: 'Create Invoice', 
    description: 'Allows creating new invoices for completed work.' 
  },
  'invoice:read': { 
    label: 'View Invoice Details', 
    description: 'Allows viewing invoice information and payment status.' 
  },
  'invoice:update': { 
    label: 'Edit Invoice', 
    description: 'Allows modifying invoice details, amounts, and due dates.' 
  },
  'invoice:delete': { 
    label: 'Delete Invoice', 
    description: 'Allows removing invoices from the system.' 
  },
  'invoice:export': { 
    label: 'Export Invoices', 
    description: 'Allows exporting invoice data for accounting.' 
  },
  'invoice:approve': { 
    label: 'Approve Invoices', 
    description: 'Allows approving invoices for payment. Critical for finance managers.' 
  },
  'invoice:view_all': { 
    label: 'View All Invoices', 
    description: 'Allows viewing ALL invoices in the system.' 
  },
  'invoice:view_own': { 
    label: 'View Own Invoices', 
    description: 'Allows viewing only invoices related to this user.' 
  },
  'invoice:manage': { 
    label: 'Full Invoice Management', 
    description: 'Grants all invoice permissions.' 
  },

  // NCR Permissions
  'ncr:create': { 
    label: 'Create NCR', 
    description: 'Allows creating Non-Conformance Reports when issues are found.' 
  },
  'ncr:read': { 
    label: 'View NCR Details', 
    description: 'Allows viewing NCR information and resolution status.' 
  },
  'ncr:update': { 
    label: 'Edit NCR', 
    description: 'Allows updating NCR details and resolution progress.' 
  },
  'ncr:delete': { 
    label: 'Delete NCR', 
    description: 'Allows removing NCRs from the system.' 
  },
  'ncr:export': { 
    label: 'Export NCRs', 
    description: 'Allows exporting NCR data for quality reports.' 
  },
  'ncr:approve': { 
    label: 'Approve NCR Resolutions', 
    description: 'Allows approving NCR resolutions and closing NCRs.' 
  },
  'ncr:view_all': { 
    label: 'View All NCRs', 
    description: 'Allows viewing ALL NCRs in the system.' 
  },
  'ncr:view_own': { 
    label: 'View Own NCRs', 
    description: 'Allows viewing only NCRs assigned to this user.' 
  },
  'ncr:manage': { 
    label: 'Full NCR Management', 
    description: 'Grants all NCR permissions.' 
  },

  // Inspector Permissions
  'inspector:create': { 
    label: 'Create Inspector Profile', 
    description: 'Allows adding new inspectors to the system.' 
  },
  'inspector:read': { 
    label: 'View Inspector Profiles', 
    description: 'Allows viewing inspector information and qualifications.' 
  },
  'inspector:update': { 
    label: 'Edit Inspector Information', 
    description: 'Allows modifying inspector details, certifications, and availability.' 
  },
  'inspector:delete': { 
    label: 'Delete Inspectors', 
    description: 'Allows removing inspectors from the system.' 
  },
  'inspector:export': { 
    label: 'Export Inspector Data', 
    description: 'Allows exporting inspector information.' 
  },
  'inspector:assign': { 
    label: 'Assign Inspectors to Tasks', 
    description: 'Allows assigning inspectors to inspections and projects.' 
  },
  'inspector:view_all': { 
    label: 'View All Inspectors', 
    description: 'Allows viewing ALL inspectors in the system.' 
  },
  'inspector:manage': { 
    label: 'Full Inspector Management', 
    description: 'Grants all inspector permissions.' 
  },

  // Report Permissions
  'report:create': { 
    label: 'Create Reports', 
    description: 'Allows generating new reports from system data.' 
  },
  'report:read': { 
    label: 'View Reports', 
    description: 'Allows viewing existing reports and analytics.' 
  },
  'report:export': { 
    label: 'Export Reports', 
    description: 'Allows exporting reports to PDF, Excel, or other formats.' 
  },
  'report:manage': { 
    label: 'Full Report Management', 
    description: 'Grants all report permissions including custom report creation.' 
  },

  // Audit Log Permissions
  'audit_log:read': { 
    label: 'View Audit Log', 
    description: 'Allows viewing system activity logs. Critical for compliance and security.' 
  },
  'audit_log:export': { 
    label: 'Export Audit Log', 
    description: 'Allows exporting audit logs for compliance reporting.' 
  },
  'audit_log:manage': { 
    label: 'Manage Audit Log', 
    description: 'Allows clearing old audit logs and managing log retention.' 
  },

  // Notification Permissions
  'notification:read': { 
    label: 'View Notifications', 
    description: 'Allows viewing system notifications.' 
  },
  'notification:manage': { 
    label: 'Manage Notifications', 
    description: 'Allows clearing notifications and managing notification preferences.' 
  },

  // User Permissions
  'user:create': { 
    label: 'Create Users', 
    description: 'Allows adding new users to the system. Admin-level permission.' 
  },
  'user:read': { 
    label: 'View User Profiles', 
    description: 'Allows viewing user information and roles.' 
  },
  'user:update': { 
    label: 'Edit Users', 
    description: 'Allows modifying user information, roles, and permissions.' 
  },
  'user:delete': { 
    label: 'Delete Users', 
    description: 'Allows removing users from the system. Use with extreme caution.' 
  },
  'user:manage': { 
    label: 'Full User Management', 
    description: 'Grants all user permissions. Should be limited to administrators.' 
  },

  // Setting Permissions
  'setting:read': { 
    label: 'View System Settings', 
    description: 'Allows viewing system configuration and settings.' 
  },
  'setting:update': { 
    label: 'Edit System Settings', 
    description: 'Allows modifying system configuration. Admin-level permission.' 
  },
  'setting:manage': { 
    label: 'Full Settings Management', 
    description: 'Grants all settings permissions. Should be limited to administrators.' 
  },
};

// ═══════════════════════════════════════
// 📊 Permission Groups (برای UI)
// ═══════════════════════════════════════
export const PERMISSION_GROUPS: Record<EntityType, {
  label: string;
  icon: string;
  permissions: Permission[];
}> = {
  client: { label: 'Client Management', icon: '👤', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('client:')) },
  contract: { label: 'Contract Management', icon: '📄', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('contract:')) },
  inspection: { label: 'Inspection Management', icon: '🔍', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('inspection:')) },
  invoice: { label: 'Invoice Management', icon: '💰', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('invoice:')) },
  ncr: { label: 'NCR Management', icon: '⚠️', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('ncr:')) },
  inspector: { label: 'Inspector Management', icon: '👷', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('inspector:')) },
  report: { label: 'Reports', icon: '📊', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('report:')) },
  audit_log: { label: 'Audit Log', icon: '📋', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('audit_log:')) },
  notification: { label: 'Notifications', icon: '🔔', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('notification:')) },
  user: { label: 'User Management', icon: '👥', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('user:')) },
  setting: { label: 'Settings', icon: '⚙️', permissions: ALL_PERMISSIONS.filter(p => p.startsWith('setting:')) },
};

// ═══════════════════════════════════════
// 🔧 Helper Functions
// ═══════════════════════════════════════
export function parsePermission(permission: Permission): { entity: EntityType; action: ActionType } {
  const [entity, action] = permission.split(':') as [EntityType, ActionType];
  return { entity, action };
}

export function getPermissionLabel(permission: Permission): string {
  return PERMISSION_DESCRIPTIONS[permission]?.label || permission;
}

export function getPermissionDescription(permission: Permission): string {
  return PERMISSION_DESCRIPTIONS[permission]?.description || 'No description available';
}

export function formatPermission(permission: Permission): string {
  const [entity, action] = permission.split(':');
  return `${entity.charAt(0).toUpperCase() + entity.slice(1)}: ${action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ')}`;
}

export function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}