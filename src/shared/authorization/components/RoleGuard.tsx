// src/shared/authorization/components/RoleGuard.tsx

import { ReactNode } from 'react';
import { useRole } from '../hooks/useRole';

interface RoleGuardProps {
  allowedRoles: string[];  // 🔧 FIX: از Role به string
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { role } = useRole();

  if (!allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 🔧 FIX: اضافه کردن AdminOnly, ManagerOrAbove, InspectorOnly
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function ManagerOrAbove({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['admin', 'manager']} fallback={fallback}>{children}</RoleGuard>;
}

export function InspectorOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard allowedRoles={['inspector']} fallback={fallback}>{children}</RoleGuard>;
}