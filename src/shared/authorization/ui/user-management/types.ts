// src/shared/authorization/ui/user-management/types.ts

import type { DBUser, DBPermissionMapping } from "@shared/database/types";

import type { Department } from "@shared/authorization";
// ═══════════════════════════════════════
// 🎯 Tab Types
// ═══════════════════════════════════════

export type UserManagementTab = "users" | "departments" | "permissions";

export interface TabConfig {
  key: UserManagementTab;
  label: string;
  icon: string;
  description: string;
}

export const USER_MANAGEMENT_TABS: TabConfig[] = [
  {
    key: "users",
    label: "Users",
    icon: "👤",
    description: "Manage user accounts and access",
  },
  {
    key: "departments",
    label: "Departments",
    icon: "🏢",
    description: "Manage organizational departments",
  },
  {
    key: "permissions",
    label: "Permissions",
    icon: "🔐",
    description: "Define which UI elements each permission can access",
  },
];

// ═══════════════════════════════════════
// 📊 Data Types
// ═══════════════════════════════════════

export interface UserManagementData {
  users: DBUser[];
  departments: Department[];
  mappings: Map<string, DBPermissionMapping>;
}

export interface DepartmentWithUsers extends Department {
  users: DBUser[];
  manager: DBUser | null;
}

// ═══════════════════════════════════════
// 🎯 Action Types
// ═══════════════════════════════════════

export interface UserAction {
  type: "edit" | "delete" | "permissions";
  user: DBUser;
}

export interface DepartmentAction {
  type: "edit" | "delete" | "view-users";
  department: Department;
}
