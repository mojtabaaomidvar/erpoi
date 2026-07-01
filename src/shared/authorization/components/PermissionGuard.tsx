// src/shared/authorization/components/PermissionGuard.tsx

import { ReactNode } from 'react';
import { Permission } from '../types';
import { usePermission } from '../hooks/usePermission';

interface Props {
  permission: Permission | Permission[];
  requireAll?: boolean; // true = همه permission ها لازم، false = حداقل یکی
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ 
  permission, 
  requireAll = false, 
  fallback = null, 
  children 
}: Props) {
  const { can, canAny, canAll } = usePermission();

  const permissions = Array.isArray(permission) ? permission : [permission];
  
  const hasAccess = requireAll 
    ? canAll(permissions) 
    : canAny(permissions);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ═══════════════════════════════════════
//  Shortcut Components
// ═══════════════════════════════════════

export function CanCreate({ entity, children }: { entity: string; children: ReactNode }) {
  return (
    <PermissionGuard permission={`${entity}:create` as Permission}>
      {children}
    </PermissionGuard>
  );
}

export function CanEdit({ entity, children }: { entity: string; children: ReactNode }) {
  return (
    <PermissionGuard permission={`${entity}:update` as Permission}>
      {children}
    </PermissionGuard>
  );
}

export function CanDelete({ entity, children }: { entity: string; children: ReactNode }) {
  return (
    <PermissionGuard permission={`${entity}:delete` as Permission}>
      {children}
    </PermissionGuard>
  );
}

export function CanExport({ entity, children }: { entity: string; children: ReactNode }) {
  return (
    <PermissionGuard permission={`${entity}:export` as Permission}>
      {children}
    </PermissionGuard>
  );
}