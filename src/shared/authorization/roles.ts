// src/shared/authorization/roles.ts
import { Role, RoleInfo, Permission } from './types';

export const ROLES: Record<Role, RoleInfo> = {
  admin: {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      'client:create', 'client:read', 'client:update', 'client:delete', 'client:export', 'client:import', 'client:view_all', 'client:view_own', 'client:manage',
      'contract:create', 'contract:read', 'contract:update', 'contract:delete', 'contract:export', 'contract:approve', 'contract:reject', 'contract:view_all', 'contract:view_own', 'contract:manage',
      'inspection:create', 'inspection:read', 'inspection:update', 'inspection:delete', 'inspection:export', 'inspection:assign', 'inspection:approve', 'inspection:view_all', 'inspection:view_own', 'inspection:manage',
      'invoice:create', 'invoice:read', 'invoice:update', 'invoice:delete', 'invoice:export', 'invoice:approve', 'invoice:view_all', 'invoice:view_own', 'invoice:manage',
      'ncr:create', 'ncr:read', 'ncr:update', 'ncr:delete', 'ncr:export', 'ncr:approve', 'ncr:view_all', 'ncr:view_own', 'ncr:manage',
      'inspector:create', 'inspector:read', 'inspector:update', 'inspector:delete', 'inspector:export', 'inspector:assign', 'inspector:view_all', 'inspector:manage',
      'report:create', 'report:read', 'report:export', 'report:manage',
      'audit_log:read', 'audit_log:export', 'audit_log:manage',
      'notification:read', 'notification:manage',
      'user:create', 'user:read', 'user:update', 'user:delete', 'user:manage',
      'setting:read', 'setting:update', 'setting:manage',
    ],
  },
  manager: {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage clients, contracts, inspections',
    permissions: [
      'client:create', 'client:read', 'client:update', 'client:export', 'client:view_all', 'client:view_own',
      'contract:create', 'contract:read', 'contract:update', 'contract:export', 'contract:approve', 'contract:view_all', 'contract:view_own',
      'inspection:create', 'inspection:read', 'inspection:update', 'inspection:export', 'inspection:assign', 'inspection:approve', 'inspection:view_all', 'inspection:view_own',
      'invoice:read', 'invoice:export', 'invoice:view_all', 'invoice:view_own',
      'ncr:create', 'ncr:read', 'ncr:update', 'ncr:export', 'ncr:approve', 'ncr:view_all', 'ncr:view_own',
      'inspector:read', 'inspector:assign', 'inspector:view_all',
      'report:create', 'report:read', 'report:export',
      'audit_log:read',
      'notification:read',
    ],
  },
  inspector: {
    id: 'inspector',
    name: 'Inspector',
    description: 'Can view and update assigned inspections',
    permissions: [
      'client:read', 'client:view_own',
      'contract:read', 'contract:view_own',
      'inspection:read', 'inspection:update', 'inspection:view_own',
      'invoice:read', 'invoice:view_own',
      'ncr:create', 'ncr:read', 'ncr:update', 'ncr:view_own',
      'inspector:read',
      'report:read',
      'notification:read',
    ],
  },
  accountant: {
    id: 'accountant',
    name: 'Accountant',
    description: 'Can manage invoices and view financial reports',
    permissions: [
      'client:read', 'client:view_all',
      'contract:read', 'contract:view_all',
      'inspection:read', 'inspection:view_all',
      'invoice:create', 'invoice:read', 'invoice:update', 'invoice:export', 'invoice:approve', 'invoice:view_all', 'invoice:view_own',
      'ncr:read', 'ncr:view_all',
      'report:create', 'report:read', 'report:export',
      'audit_log:read',
      'notification:read',
    ],
  },
  viewer: {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to all modules',
    permissions: [
      'client:read', 'client:view_all',
      'contract:read', 'contract:view_all',
      'inspection:read', 'inspection:view_all',
      'invoice:read', 'invoice:view_all',
      'ncr:read', 'ncr:view_all',
      'inspector:read', 'inspector:view_all',
      'report:read',
      'audit_log:read',
      'notification:read',
    ],
  },
};

export function getRolePermissions(role: Role): Permission[] {
  return ROLES[role]?.permissions || [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLES[role]?.permissions.includes(permission) || false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = ROLES[role]?.permissions || [];
  return permissions.some(p => rolePermissions.includes(p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = ROLES[role]?.permissions || [];
  return permissions.every(p => rolePermissions.includes(p));
}

export const CURRENT_USER = {
  userId: 'user_001',
  userName: 'Ali Rezai',
  role: 'admin' as Role,
  department: 'IT',
};

export function setUserRole(role: Role): void {
  CURRENT_USER.role = role;
  localStorage.setItem('ics_current_role', role);
}

export function getUserRole(): Role {
  const stored = localStorage.getItem('ics_current_role');
  if (stored && stored in ROLES) {
    CURRENT_USER.role = stored as Role;
  }
  return CURRENT_USER.role;
}