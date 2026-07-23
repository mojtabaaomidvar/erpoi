//src/shared/authorization/domain/repositories/IDepartmentRepository.ts

import type { Department } from "../models/Department";

export interface IDepartmentRepository {
  getAll(): Promise<Department[]>;
  getById(id: string): Promise<Department | null>;
  create(department: Omit<Department, "id" | "created_at" | "updated_at">): Promise<Department>;
  update(id: string, department: Partial<Department>): Promise<Department>;
  delete(id: string): Promise<void>;
}