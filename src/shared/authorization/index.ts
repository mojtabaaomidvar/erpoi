// src/shared/authorization/index.ts
// ═══════════════════════════════════════
// 🏛️ AUTHORIZATION MODULE - BARREL FILE
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// 1. INFRASTRUCTURE IMPORTS (Repository Implementations)
// ═══════════════════════════════════════
import { SupabaseDepartmentRepository } from "./repositories/SupabaseDepartmentRepository";
import { SupabaseUserRepository } from "./repositories/SupabaseUserRepository";
import { SupabasePermissionMappingRepository } from "./repositories/SupabasePermissionMappingRepository";

// ═══════════════════════════════════════
// 2. APPLICATION SERVICE IMPORTS
// ═══════════════════════════════════════
import { DepartmentApplicationService } from "./application/services/DepartmentApplicationService";
import { UserApplicationService } from "./application/services/UserApplicationService";
import { PermissionMappingApplicationService } from "./application/services/PermissionMappingApplicationService";

// ═══════════════════════════════════════
// 3. APPLICATION SERVICE INSTANCES (Singleton-like)
// ═══════════════════════════════════════
export const departmentAppService = new DepartmentApplicationService(
  new SupabaseDepartmentRepository(),
);

export const userAppService = new UserApplicationService(
  new SupabaseUserRepository(),
);

export const permissionMappingAppService =
  new PermissionMappingApplicationService(
    new SupabasePermissionMappingRepository(),
  );

// ═══════════════════════════════════════
// 4. DOMAIN MODELS (Explicit Exports)
// ═══════════════════════════════════════
export type { User, UserStatus, UserFormData } from "./domain/models/User";
export type { Role, UserRole, RoleInfo } from "./domain/models/Role";
export type {
  Permission,
  ActionType,
  EntityType,
} from "./domain/models/Permission";
export type { Department } from "./domain/models/Department";
export type { PermissionMapping } from "./domain/models/PermissionMapping";

// ═══════════════════════════════════════
// 5. REPOSITORY INTERFACES (Explicit Exports)
// ═══════════════════════════════════════
export type {
  IUserRepository,
  CreateUserPayload,
  UpdateUserPayload,
} from "./domain/repositories/IUserRepository";
export type { IDepartmentRepository } from "./domain/repositories/IDepartmentRepository";
export type { IPermissionMappingRepository } from "./domain/repositories/IPermissionMappingRepository";

// ═══════════════════════════════════════
// 6. APPLICATION SERVICE CLASSES (Explicit Exports)
// ═══════════════════════════════════════
export { DepartmentApplicationService } from "./application/services/DepartmentApplicationService";
export { UserApplicationService } from "./application/services/UserApplicationService";
export { PermissionMappingApplicationService } from "./application/services/PermissionMappingApplicationService";

// ═══════════════════════════════════════
// 7. CONFIGURATION & CONSTANTS (Explicit Exports)
// ═══════════════════════════════════════
export {
  ROLE_BASE_PERMISSIONS,
  getBasePermissions,
  isBasePermission,
  getBasePermissionsInfo,
  getAllEntities,
} from "./config/RoleBasePermissions";

export {
  ROLES,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  CURRENT_USER,
  setUserRole,
  getUserRole,
} from "./constants/roles";

export { ENTITIES, ENTITY_GROUPS } from "./constants/permissions";
export type { EntityType as PermissionEntityType } from "./constants/permissions";

export {
  DEPARTMENTS,
  getDepartmentById,
  getDepartmentName,
} from "./constants/departments";

// ═══════════════════════════════════════
// 8. UTILITIES (Explicit Exports)
// ═══════════════════════════════════════
export {
  calculateEffectivePermissions,
  filterCustomPermissionsOnly,
  getCustomPermissions,
  isPermissionRemovable,
  groupPermissionsByEntity,
  countPermissionsByEntity,
} from "./utils/PermissionCalculator";

// ═══════════════════════════════════════
// 9. HOOKS (Explicit Exports)
// ═══════════════════════════════════════
export { usePermissionMapping } from "./hooks/usePermissionMapping";

// ═══════════════════════════════════════
// 10. UI GUARDS (Explicit Exports)
// ═══════════════════════════════════════
export {
  RoleGuard,
  AdminOnly,
  ManagerOrAbove,
  InspectorOnly,
} from "./ui/guards/RoleGuard";
export { PermissionGuard } from "./ui/guards/PermissionGuard";
