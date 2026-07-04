// src/shared/authorization/components/RoleGuard.tsx

import { ReactNode } from 'react';
import { useAuth } from '@features/auth/hooks/useAuth';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  const role = user?.role || 'viewer';

  if (!allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function ManagerOrAbove({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['admin', 'manager']} fallback={fallback}>{children}</RoleGuard>;
}

export function InspectorOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['inspector']} fallback={fallback}>{children}</RoleGuard>;
}