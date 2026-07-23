//src/shared/authorization/application/services/DepartmentApplicationService.ts

import type { Department } from "../../domain/models/Department";
import type { IDepartmentRepository } from "../../domain/repositories/IDepartmentRepository";

export class DepartmentApplicationService {
  constructor(private departmentRepository: IDepartmentRepository) {}

  async getAll(): Promise<Department[]> {
    return await this.departmentRepository.getAll();
  }

  async getById(id: string): Promise<Department | null> {
    return await this.departmentRepository.getById(id);
  }

  async create(department: Omit<Department, "id" | "created_at" | "updated_at">): Promise<Department> {
    return await this.departmentRepository.create(department);
  }

  async update(id: string, department: Partial<Department>): Promise<Department> {
    return await this.departmentRepository.update(id, department);
  }

  async delete(id: string): Promise<void> {
    return await this.departmentRepository.delete(id);
  }
}