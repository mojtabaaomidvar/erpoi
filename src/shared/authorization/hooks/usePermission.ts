// src/shared/authorization/hooks/usePermission.ts

import { useCallback } from 'react';
import { Permission, Role } from '../types';
import { ROLES, hasPermission, hasAnyPermission, hasAllPermissions } from '../roles';
import { useAuth } from '@features/auth/hooks/useAuth';
import { userService } from '@shared/authorization/services/UserService';

export function usePermission() {
  const { user } = useAuth();
  
  // ✅ گرفتن role از کاربر لاگین شده
  const role = (user?.role || 'viewer') as Role;
  
  // ✅ گرفتن custom permissions کاربر
  const customPermissions = user?.id 
    ? (userService.getById(user.id)?.customPermissions || [])
    : [];

  const can = useCallback((permission: Permission): boolean => {
    // ✅ اول custom permissions رو چک کن
    if (customPermissions.includes(permission)) return true;
    // ✅ بعد role permissions رو چک کن (safe)
    return hasPermission(role, permission);
  }, [role, customPermissions]);

  const canAny = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(p => {
      if (customPermissions.includes(p)) return true;
      return hasPermission(role, p);
    });
  }, [role, customPermissions]);

  const canAll = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(p => {
      if (customPermissions.includes(p)) return true;
      return hasPermission(role, p);
    });
  }, [role, customPermissions]);

  const cannot = useCallback((permission: Permission): boolean => {
    return !can(permission);
  }, [can]);

  return {
    role,
    can,
    canAny,
    canAll,
    cannot,
    customPermissions,
  };
}