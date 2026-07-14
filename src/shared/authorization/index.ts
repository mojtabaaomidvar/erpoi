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
} from "./types";

export {
  ROLES,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "./constants/roles";
export { ENTITIES, ENTITY_GROUPS } from "./constants/permissions";

export type { EntityType as PermissionEntityType } from "./constants/permissions";

export { usePermission } from "./hooks/usePermission";
export { usePermissionMapping } from "./hooks/usePermissionMapping";

export {
  RoleGuard,
  AdminOnly,
  ManagerOrAbove,
  InspectorOnly,
} from "./ui/guards/RoleGuard";
export { PermissionGuard } from "./ui/guards/PermissionGuard";

export { userService } from "./services/UserService";
