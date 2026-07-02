// src/shared/authorization/hooks/useEntityAccess.ts

import { useMemo } from 'react';
import { EntityType, Permission } from '../types';
import { usePermission } from './usePermission';
import { DEFAULT_ACTIONS } from '../permissions';

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
	  () =>
		DEFAULT_ACTIONS.map(
		  action => `${entity}:${action}` as Permission
		),
	  [entity]
  );

  const canCreate = can(`${entity}:create`);
  const canRead = can(`${entity}:read`);
  const canUpdate = can(`${entity}:update`);
  const canDelete = can(`${entity}:delete`);
  const canExport = can(`${entity}:export`);
  const canManage = can(`${entity}:manage`);
  const canApprove = can(`${entity}:approve`);
  const canAssign = can(`${entity}:assign`);

  const hasAccess = canCreate || canRead || canUpdate || canDelete || canManage || canApprove || canAssign;

  return {
    hasAccess,
    permissions: entityPermissions.filter((p: Permission) => can(p)),
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