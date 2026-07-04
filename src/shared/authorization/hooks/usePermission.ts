// src/shared/authorization/hooks/usePermission.ts

import { useCallback, useMemo } from 'react';
import { Permission } from '../types';
import { useAuth } from '@features/auth/hooks/useAuth';

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role || 'viewer';
  const isAdmin = role === 'admin';

  // 🔐 customPermissions کاربر
  const customPermissions = useMemo((): string[] => {
    return (user as any)?.customPermissions || [];
  }, [user]);

  // 🔐  rolePermissions از Batch Permission (از localStorage)
  const rolePermissions = useMemo((): string[] => {
    if (isAdmin) return ['*:*'];
    
    try {
      const rolesJson = localStorage.getItem('ics_db_roles');
      if (!rolesJson) return [];
      
      const roles = JSON.parse(rolesJson);
      const dbRole = roles.find((r: any) => r.name === role);
      
      if (dbRole && dbRole.permissions) {
        return dbRole.permissions;
      }
    } catch (error) {
      console.error('[usePermission] Failed to read roles:', error);
    }
    
    return [];
  }, [role, isAdmin]);

  // 🔐 ترکیب همه permission ها
  const allPermissions = useMemo((): string[] => {
    if (isAdmin) return ['*:*'];
    return [...new Set([...customPermissions, ...rolePermissions])];
  }, [customPermissions, rolePermissions, isAdmin]);

  // 🔐 تابع چک کردن permission با پشتیبانی از wildcard و entity-level
  const can = useCallback((permission: Permission | string): boolean => {
    if (isAdmin) return true;
    
    const perm = permission as string;
    
    // چک کردن دقیق
    if (allPermissions.includes(perm)) return true;
    
    // چک کردن wildcard (مثلاً client:* با client:read match می‌شه)
    const entity = perm.split(':')[0];
    if (allPermissions.includes(`${entity}:*`)) return true;
    if (allPermissions.includes('*:*')) return true;
    
    // چک کردن entity-level (مثلاً can('client') true برمی‌گرداند اگه کاربر هر دسترسی client:* داشته باشه)
    if (!perm.includes(':')) {
      return allPermissions.some(p => p.startsWith(`${perm}:`));
    }
    
    return false;
  }, [allPermissions, isAdmin]);

  const canAny = useCallback((permissions: (Permission | string)[]): boolean => {
    return permissions.some(p => can(p));
  }, [can]);

  const canAll = useCallback((permissions: (Permission | string)[]): boolean => {
    return permissions.every(p => can(p));
  }, [can]);

  const cannot = useCallback((permission: Permission | string): boolean => {
    return !can(permission);
  }, [can]);

  // 🔐 تابع چک کردن دسترسی به entity - حالا allPermissions را چک می‌کند
  const canAccessEntity = useCallback((entity: string): boolean => {
    if (isAdmin) return true;
    
    // 🔧 چک کردن در allPermissions (شامل customPermissions + rolePermissions)
    return allPermissions.some((perm: string) => {
      const permEntity = perm.split(':')[0];
      return permEntity === entity;
    });
  }, [isAdmin, allPermissions]);

  return {
    role,
    isAdmin,
    can,
    canAny,
    canAll,
    cannot,
    canAccessEntity,
    customPermissions,
    rolePermissions,
    allPermissions,   
  };
}