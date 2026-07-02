// src/shared/authorization/hooks/useRole.ts

import { useCallback } from 'react';
import { useAuth } from '@features/auth/hooks/useAuth';

export function useRole() {
  const { user } = useAuth();
  
  const role = user?.role || 'viewer';
  
  // 🔧 FIX: خواندن مستقیم از localStorage
  let roleInfo = {
    id: role,
    name: role,
    description: 'Unknown role',
    permissions: [] as string[],
    isSystem: false,
  };
  
  try {
    const rolesJson = localStorage.getItem('ics_db_roles');
    if (rolesJson) {
      const roles = JSON.parse(rolesJson);
      const dbRole = roles.find((r: any) => r.name === role);
      
      if (dbRole) {
        roleInfo = {
          id: role,
          name: dbRole.displayName,
          description: dbRole.description,
          permissions: dbRole.permissions,
          isSystem: dbRole.isSystem,
        };
      }
    }
  } catch (e) {
    console.error('[useRole] Failed to read role:', e);
  }

  const roleName = roleInfo?.name || role;
  const roleDescription = roleInfo?.description || '';

  const setRole = useCallback((_newRole: string) => {
    console.warn('setRole is deprecated. Use userService.updateRole instead.');
  }, []);

  return {
    role,
    roleName,
    roleDescription,
    setRole,
    isAdmin: role === 'admin',
    isSystem: roleInfo?.isSystem || false,
  };
}