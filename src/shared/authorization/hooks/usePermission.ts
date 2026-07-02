// src/shared/authorization/hooks/usePermission.ts

import { useCallback, useMemo } from 'react';
import { Permission } from '../types';
import { useAuth } from '@features/auth/hooks/useAuth';

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role || 'viewer';

  // 🔧 FIX: خواندن مستقیم از localStorage (نه از getDBSync)
  const rolePermissions = useMemo((): string[] => {
    try {
      const rolesJson = localStorage.getItem('ics_db_roles');
      if (!rolesJson) {
        console.warn('[usePermission] ❌ No roles in localStorage');
        return [];
      }
      
      const roles = JSON.parse(rolesJson);
      const dbRole = roles.find((r: any) => r.name === role);
      
      if (dbRole) {
        console.log(`[usePermission] ✅ Role "${role}" found, permissions:`, dbRole.permissions);
        return dbRole.permissions || [];
      } else {
        console.warn(`[usePermission] ❌ Role "${role}" not found in localStorage`);
      }
    } catch (error) {
      console.error('[usePermission] ❌ Failed to read roles:', error);
    }
    
    return [];
  }, [role]);

  const can = useCallback((permission: Permission | string): boolean => {
    // 🔧 FIX: چک کردن customPermissions کاربر
    const customPermissions = (user as any)?.customPermissions || [];
    if (customPermissions.includes(permission as string)) {
      console.log(`[usePermission] ✅ ${permission} granted via customPermissions`);
      return true;
    }

    // 🔧 FIX: چک کردن *:* (admin)
    if (rolePermissions.includes('*:*')) {
      console.log(`[usePermission] ✅ ${permission} granted via *:* (admin)`);
      return true;
    }

    // 🔧 FIX: چک کردن role permissions
    const hasPermission = rolePermissions.includes(permission as string);
    console.log(`[usePermission] ${hasPermission ? '✅' : '❌'} ${permission} = ${hasPermission}`);
    return hasPermission;
  }, [rolePermissions, user]);

  const canAny = useCallback((permissions: (Permission | string)[]): boolean => {
    return permissions.some(p => can(p));
  }, [can]);

  const canAll = useCallback((permissions: (Permission | string)[]): boolean => {
    return permissions.every(p => can(p));
  }, [can]);

  const cannot = useCallback((permission: Permission | string): boolean => {
    return !can(permission);
  }, [can]);

  return {
    role,
    can,
    canAny,
    canAll,
    cannot,
    customPermissions: (user as any)?.customPermissions || [],
  };
}