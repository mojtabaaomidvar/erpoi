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
} from "./roles";
export { ENTITIES, ENTITY_GROUPS } from "./permissions";

export type { EntityType as PermissionEntityType } from "./permissions";

export { usePermission } from "./hooks/usePermission";
export { usePermissionMapping } from "./hooks/usePermissionMapping";

export {
  RoleGuard,
  AdminOnly,
  ManagerOrAbove,
  InspectorOnly,
} from "./components/RoleGuard";
export { PermissionGuard } from "./ui/PermissionGuard";

export { userService } from "./services/UserService";
