// src/shared/authorization/hooks/useEntityAccess.ts

import { useMemo } from 'react';
import { EntityType, Permission } from '../types';
import { usePermission } from './usePermission';
import { ALL_PERMISSIONS } from '../permissions';

/**
 * چک می‌کنه آیا کاربر دسترسی معناداری به یک entity داره یا نه
 * فقط permission های create, update, delete, manage, approve, assign رو چک می‌کنه
 * نه فقط read
 */
export function useEntityAccess(entity: EntityType): {
  hasAccess: boolean;
  permissions: Permission[];
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canManage: boolean;
  canApprove: boolean;
  canAssign: boolean;
} {
  const { can } = usePermission();

  const entityPermissions = useMemo(
    () => ALL_PERMISSIONS.filter(p => p.startsWith(`${entity}:`)),
    [entity]
  );

  const canCreate = can(`${entity}:create` as Permission);
  const canRead = can(`${entity}:read` as Permission);
  const canUpdate = can(`${entity}:update` as Permission);
  const canDelete = can(`${entity}:delete` as Permission);
  const canExport = can(`${entity}:export` as Permission);
  const canManage = can(`${entity}:manage` as Permission);
  const canApprove = can(`${entity}:approve` as Permission);
  const canAssign = can(`${entity}:assign` as Permission);

  // ✅ فقط اگر کاربر بتونه create, update, delete, manage, approve, یا assign کنه
  // یعنی دسترسی معنادار داره، نه فقط read
  const hasAccess = canCreate || canUpdate || canDelete || canManage || canApprove || canAssign;

  return {
    hasAccess,
    permissions: entityPermissions.filter(p => can(p)),
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    canManage,
    canApprove,
    canAssign,
  };
}