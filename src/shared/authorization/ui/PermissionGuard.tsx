// src/shared/authorization/ui/PermissionGuard.tsx

import { ReactNode } from 'react';
import { usePermissionMapping } from '../hooks/usePermissionMapping';

interface PermissionGuardProps {
  elementId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ elementId, children, fallback = null }: PermissionGuardProps) {
  const { canAccessElement, loading } = usePermissionMapping();

  if (loading) {
    return <>{fallback}</>;
  }

  const hasAccess = canAccessElement(elementId);
  
  console.log(`[PermissionGuard] elementId: ${elementId}, hasAccess: ${hasAccess}`);

  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
}