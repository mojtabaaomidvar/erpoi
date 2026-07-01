// src/shared/authorization/components/RoleGuard.tsx

import { ReactNode } from 'react';
import { Role } from '../types';
import { useRole } from '../hooks/useRole';

interface Props {
  roles: Role | Role[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({ roles, fallback = null, children }: Props) {
  const { role } = useRole();
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ═══════════════════════════════════════
//  Shortcut Components
// ═══════════════════════════════════════

export function AdminOnly({ children }: { children: ReactNode }) {
  return <RoleGuard roles="admin">{children}</RoleGuard>;
}

export function ManagerOrAbove({ children }: { children: ReactNode }) {
  return (
    <RoleGuard roles={['admin', 'manager']}>
      {children}
    </RoleGuard>
  );
}

export function InspectorOnly({ children }: { children: ReactNode }) {
  return <RoleGuard roles="inspector">{children}</RoleGuard>;
}