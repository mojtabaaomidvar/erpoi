// src/shared/authorization/types.ts

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  status?: UserStatus;
  customPermissions?: string[];
  preferences?: Record<string, any>;
  phone?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserStatus = 'active' | 'inactive' | 'suspended';

export type Role = string;

export type UserRole = string;

export interface RoleInfo {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export type Permission = string;

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'approve' | 'reject' | 'assign' | 'manage' | 'view_all' | 'view_own';

export type EntityType = 'client' | 'contract' | 'inspection' | 'invoice' | 'ncr' | 'inspector' | 'report' | 'audit_log' | 'setting' | 'user' | 'notification' | 'dashboard' | 'department';

export interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  password?: string;
  role: string;
  department?: string;
  status?: UserStatus;
  customPermissions?: string[];
  phone?: string;
}