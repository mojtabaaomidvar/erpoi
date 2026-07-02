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

  // 🔧 FIX: اگه هنوز loading هست، children رو نشون بده
  if (loading) {
    return <>{children}</>;
  }

  const hasAccess = canAccessElement(elementId);

  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
}