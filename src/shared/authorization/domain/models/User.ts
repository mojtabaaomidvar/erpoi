//src/shared/authorization/domain/models/User.ts

export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  status?: UserStatus;
  managerId?: string;
  customPermissions?: string[];
  preferences?: Record<string, any>;
  phone?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

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