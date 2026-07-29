// src/shared/authorization/config/RoleConfig.ts

export type UserRole =
  | "admin"
  | "manager"
  | "expert"
  | "inspector"
  | "coordinator"
  | "viewer";

export interface RoleConfig {
  id: UserRole;
  label: string;
  icon: string;
  color: string;
  description: string;
  defaultPermissions: string[];
  isManager: boolean;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    id: "admin",
    label: "Administrator",
    icon: "👑",
    color: "from-purple-500 to-pink-600",
    description: "Full system access - can manage everything",
    defaultPermissions: ["*"],
    isManager: false,
  },
  manager: {
    id: "manager",
    label: "Department / Unit Manager", // ✅ برچسب دقیق‌تر
    icon: "👔",
    color: "from-blue-500 to-indigo-600",
    description:
      "Manages department operations, workflows, and master data approvals", // ✅ توضیحات به‌روز شد
    defaultPermissions: [
      // 🏢 Clients
      "client:list",
      "client:view",
      "client:create",
      "client:update",
      // 📄 Contracts
      "contract:list",
      "contract:view",
      "contract:create",
      "contract:update",
      // 📝 Amendments
      "amendment:list",
      "amendment:view",
      "amendment:create",
      "amendment:approve",
      // 🔍 Inspections
      "inspection:list",
      "inspection:view",
      "inspection:create",
      "inspection:assign",
      // 👷 Inspectors
      "inspector:list",
      "inspector:view",
      // 💰 Financials
      "invoice:view",
      "tariff:view",
      // 📊 Reports
      "report:view",
      // 👥 Users
      "user:view",

      "approval:view",
      "approval:approve",
      "approval:reject",
    ],
    isManager: true,
  },
  coordinator: {
    id: "coordinator",
    label: "Coordinator",
    icon: "👷",
    color: "from-cyan-500 to-blue-600",
    description: "Coordinates inspections and manages workflows",
    defaultPermissions: [
      "contract:view",
      "amendment:create",
      "amendment:view",
      "inspection:create",
      "inspection:assign",
      "inspection:view",
      "client:view",
    ],
    isManager: false,
  },
  expert: {
    id: "expert",
    label: "Expert",
    icon: "🎯",
    color: "from-emerald-500 to-teal-600",
    description: "Creates and manages contracts and inspections",
    defaultPermissions: [
      "contract:create",
      "contract:view",
      "amendment:create",
      "amendment:view",
      "inspection:create",
      "inspection:view",
      "client:create",
      "client:view",
    ],
    isManager: false,
  },
  inspector: {
    id: "inspector",
    label: "Inspector",
    icon: "🔍",
    color: "from-amber-500 to-orange-600",
    description: "Performs inspections and reports findings",
    defaultPermissions: ["inspection:view", "inspection:update"],
    isManager: false,
  },
  viewer: {
    id: "viewer",
    label: "Viewer",
    icon: "👁️",
    color: "from-slate-500 to-gray-600",
    description: "Read-only access to view data",
    defaultPermissions: ["contract:view", "inspection:view", "client:view"],
    isManager: false,
  },
};

export const ROLES: UserRole[] = [
  "admin",
  "manager",
  "coordinator",
  "expert",
  "inspector",
  "viewer",
];

export function getRoleConfig(role: UserRole | string): RoleConfig {
  return ROLE_CONFIGS[role as UserRole] || ROLE_CONFIGS.viewer;
}

export function getRolePermissions(role: UserRole | string): string[] {
  return ROLE_CONFIGS[role as UserRole]?.defaultPermissions || [];
}

export function isManagerRole(role: UserRole | string): boolean {
  return ROLE_CONFIGS[role as UserRole]?.isManager || false;
}
