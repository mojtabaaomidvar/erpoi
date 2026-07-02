// src/shared/authorization/roles.ts

import { Role, RoleInfo, Permission } from './types';

// 🔧 FIX: فقط admin role ثابت - بقیه از DB میان
export const ROLES: Record<string, RoleInfo> = {
  admin: {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: ['*:*' as Permission],  // 🔧 FIX: فقط *:*
  },
};

export function getRolePermissions(role: string): Permission[] {
  return ROLES[role]?.permissions || [];
}

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLES[role]?.permissions.includes(permission) || false;
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  const rolePermissions = ROLES[role]?.permissions || [];
  return permissions.some(p => rolePermissions.includes(p));
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  const rolePermissions = ROLES[role]?.permissions || [];
  return permissions.every(p => rolePermissions.includes(p));
}

export const CURRENT_USER = {
  userId: 'user_001',
  userName: 'Administrator',
  role: 'admin' as string,
  department: 'it',
};

export function setUserRole(role: string): void {
  CURRENT_USER.role = role;
  localStorage.setItem('ics_current_role', role);
}

export function getUserRole(): string {
  const stored = localStorage.getItem('ics_current_role');
  if (stored) {
    CURRENT_USER.role = stored;
  }
  return CURRENT_USER.role;
}