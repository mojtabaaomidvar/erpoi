// src/shared/authorization/index.ts

// ═══════════════════════════════════════
// 1. IMPORTS FOR INSTANTIATION (Infrastructure -> Application)
// ═══════════════════════════════════════
import { SupabaseDepartmentRepository } from "./repositories/SupabaseDepartmentRepository";
import { DepartmentApplicationService } from "./application/services/DepartmentApplicationService";

import { SupabaseUserRepository } from "./repositories/SupabaseUserRepository";
import { UserApplicationService } from "./application/services/UserApplicationService";

import { SupabasePermissionMappingRepository } from "./repositories/SupabasePermissionMappingRepository";
import { PermissionMappingApplicationService } from "./application/services/PermissionMappingApplicationService";

// ═══════════════════════════════════════
// 2. APPLICATION SERVICE INSTANCES (Ready to use)
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
// 3. DOMAIN LAYER (Models & Repository Interfaces)
// ═══════════════════════════════════════
// Models
export * from "./domain/models/Department";
export * from "./domain/models/User";
export * from "./domain/models/Role";
export * from "./domain/models/Permission";
export * from "./domain/models/PermissionMapping";

// Repository Interfaces
export * from "./domain/repositories/IDepartmentRepository";
export * from "./domain/repositories/IUserRepository";
export * from "./domain/repositories/IPermissionMappingRepository";

// ═══════════════════════════════════════
// 4. APPLICATION LAYER (Service Classes)
// ═══════════════════════════════════════
export * from "./application/services/DepartmentApplicationService";
export * from "./application/services/UserApplicationService";
export * from "./application/services/PermissionMappingApplicationService";

// ═══════════════════════════════════════
// 5. CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════
export {
  ROLES,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "./constants/roles";

export { ENTITIES, ENTITY_GROUPS } from "./constants/permissions";
export type { EntityType as PermissionEntityType } from "./constants/permissions";

// ═══════════════════════════════════════
// 6. HOOKS
// ═══════════════════════════════════════
export { usePermission } from "./hooks/usePermission";
export { usePermissionMapping } from "./hooks/usePermissionMapping";

// ═══════════════════════════════════════
// 7. SHARED UI (Lightweight Guards)
// ═══════════════════════════════════════
export {
  RoleGuard,
  AdminOnly,
  ManagerOrAbove,
  InspectorOnly,
} from "./ui/guards/RoleGuard";

export { PermissionGuard } from "./ui/guards/PermissionGuard";
