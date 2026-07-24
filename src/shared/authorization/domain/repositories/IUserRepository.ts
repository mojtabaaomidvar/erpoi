//src/shared/authorization/domain/repositories/IUserRepository.ts

import type { User, UserStatus } from "../models";

export interface CreateUserPayload {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: string;
  department: string;
  status: UserStatus;
  manager_id: string | null;
  custom_permissions: string[];
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  full_name?: string;
  role?: string;
  department?: string;
  status?: UserStatus;
  manager_id?: string | null;
  custom_permissions?: string[];
  updated_at: string;
}

export interface IUserRepository {
  getAll(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  getByUsername(username: string): Promise<User | null>;
  getByDepartmentAndRole(
    departmentId: string,
    role: string,
  ): Promise<User | null>;
  create(payload: CreateUserPayload): Promise<User>;
  update(id: string, payload: UpdateUserPayload): Promise<User>;
  delete(id: string): Promise<void>;
  changePassword(id: string, newPassword: string): Promise<void>;
}
