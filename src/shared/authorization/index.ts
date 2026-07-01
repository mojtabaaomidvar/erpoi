// src/shared/authorization/index.ts

// Types
export type { 
  EntityType, 
  ActionType, 
  Permission, 
  Role, 
  RoleInfo, 
  UserRole 
} from './types';

// Permissions
export { 
  ALL_PERMISSIONS, 
  PERMISSION_GROUPS, 
  parsePermission, 
  formatPermission 
} from './permissions';

// Roles
export { 
  ROLES, 
  getRolePermissions, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  CURRENT_USER,
  setUserRole,
  getUserRole,
} from './roles';

// Hooks
export { usePermission } from './hooks/usePermission';
export { useRole } from './hooks/useRole';

// Services
export { userService } from './services/UserService';

// Components
export { 
  PermissionGuard, 
  CanCreate, 
  CanEdit, 
  CanDelete, 
  CanExport 
} from './components/PermissionGuard';
export { UserForm } from './components/UserForm';

export { 
  RoleGuard, 
  AdminOnly, 
  ManagerOrAbove, 
  InspectorOnly 
} from './components/RoleGuard';