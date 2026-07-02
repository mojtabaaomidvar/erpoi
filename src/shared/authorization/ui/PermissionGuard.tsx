// src/shared/authorization/ui/PermissionGuard.tsx
import { ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';
import { permissionMappingService } from '../services/PermissionMappingService';

interface PermissionGuardProps {
  elementId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ elementId, children, fallback = null }: PermissionGuardProps) {
  const { can } = usePermission();
  const mapping = permissionMappingService.getRegistry();
  
  // چک می‌کنه آیا کاربر به این element دسترسی داره یا نه
  const hasAccess = Object.entries(mapping.elements).some(([id]) => {
    if (id !== elementId) return false;
    // چک کن آیا کاربر permission ای داره که این element رو allowed کرده
    const allMappings = permissionMappingService.getAllMappings();
    return allMappings.some(m => {
      const permission = m.permission;
      return can(permission) && m.allowedElements.includes(elementId);
    });
  });

  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
}