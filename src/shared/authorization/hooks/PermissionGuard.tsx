// src/shared/authorization/ui/PermissionGuard.tsx

import { ReactNode } from 'react';
import { usePermissionMapping } from '../hooks/usePermissionMapping';

interface PermissionGuardProps {
  elementId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ elementId, children, fallback = null }: PermissionGuardProps) {
  const { canAccessElement } = usePermissionMapping();

  if (!canAccessElement(elementId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}