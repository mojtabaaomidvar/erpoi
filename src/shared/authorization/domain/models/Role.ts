//src/shared/authorization/domain/models/Role.ts

import type { Permission } from "./Permission";

export type Role = string;
export type UserRole = string;

export interface RoleInfo {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}