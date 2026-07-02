// src/shared/authorization/index.ts

export type {
  User,
  Role,
  UserRole,
  RoleInfo,
  Permission,
  EntityType,
  ActionType,
  UserStatus,
  UserFormData,
} from './types';

export { ROLES, getRolePermissions, hasPermission, hasAnyPermission, hasAllPermissions } from './roles';
export {
  ENTITIES,
  DEFAULT_ACTIONS,
  ENTITY_GROUPS,
} from './permissions';

export type {
  EntityType as PermissionEntityType,
} from './permissions';

export { useRole } from './hooks/useRole';
export { usePermission } from './hooks/usePermission';
export { useEntityAccess } from './hooks/useEntityAccess';

export { RoleGuard } from './components/RoleGuard';
export { RoleManager } from './components/RoleManager';
export { PermissionExplorer } from './components/PermissionExplorer';

export { roleService } from './services/RoleService';
export { userService } from './services/UserService';