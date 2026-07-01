// src/shared/authorization/types.ts

// ═══════════════════════════════════════
// 🎯 Entity Types
// ═══════════════════════════════════════
export type EntityType = 
  | 'client'
  | 'contract'
  | 'inspection'
  | 'invoice'
  | 'ncr'
  | 'inspector'
  | 'report'
  | 'audit_log'
  | 'notification'
  | 'user'
  | 'setting';

// ═══════════════════════════════════════
// 🔧 Action Types
// ══════════════════════════════════════
export type ActionType = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'view_all'
  | 'view_own'
  | 'manage';

// ═══════════════════════════════════════
// 🔑 Permission String
// ═══════════════════════════════════════
// فرمت: "entity:action" مثال: "client:create"
export type Permission = `${EntityType}:${ActionType}`;

// ═══════════════════════════════════════
// 👥 Role Types
// ═══════════════════════════════════════
export type Role = 
  | 'admin'
  | 'manager'
  | 'inspector'
  | 'accountant'
  | 'viewer';

export interface RoleInfo {
  id: Role;
  name: string;
  description: string;
  permissions: Permission[];
}

// ═══════════════════════════════════════
// 👤 User Role
// ═══════════════════════════════════════
export interface UserRole {
  userId: string;
  userName: string;
  role: Role;
  department?: string;
}


// ═══════════════════════════════════════
// 👤 User Types
// ═══════════════════════════════════════
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'fa';
  notifications: {
    email: boolean;
    inApp: boolean;
    contractExpiry: boolean;
    invoiceDue: boolean;
    inspectionAssigned: boolean;
  };
  timezone: string;
  dateFormat: 'gregorian' | 'jalaali';
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  department?: string;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  preferences: UserPreferences;
  customPermissions?: Permission[];
  createdAt: Date;
  lastLogin?: Date;
  createdBy?: string;
}

export interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  password?: string;
  role: Role;
  department?: string;
  phone?: string;
  status: UserStatus;
  customPermissions?: Permission[];
  preferences?: Partial<UserPreferences>;
}

export interface UserRole {
  userId: string;
  userName: string;
  role: Role;
  department?: string;
}