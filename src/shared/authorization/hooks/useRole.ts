// src/shared/authorization/hooks/useRole.ts

import { useCallback } from 'react';
import { Role } from '../types';
import { ROLES } from '../roles';
import { useAuth } from '@features/auth/hooks/useAuth';

export function useRole() {
  const { user } = useAuth();
  
  const role = (user?.role || 'viewer') as Role;
  
  // ✅ Safe: اگر role در ROLES نبود، viewer رو استفاده کن
  const roleInfo = ROLES[role] || ROLES.viewer;

  const roleName = roleInfo?.name || 'Viewer';
  const roleDescription = roleInfo?.description || 'Read-only access';

  const setRole = useCallback((newRole: Role) => {
    console.warn('setRole is deprecated. Use userService.updateRole instead.');
  }, []);

  return {
    role,
    roleName,
    roleDescription,
    setRole,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isInspector: role === 'inspector',
    isAccountant: role === 'accountant',
    isViewer: role === 'viewer',
  };
}