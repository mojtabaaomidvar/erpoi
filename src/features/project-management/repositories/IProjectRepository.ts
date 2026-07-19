// src/features/project-management/repositories/IProjectRepository.ts

import type { Project, ProjectMember, ProjectRole } from "../domain/types";

export interface IProjectRepository {
  // CRUD Operations
  getAll(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
  getByContract(contractId: string): Promise<Project[]>;
  getByClient(clientId: string): Promise<Project[]>;
  create(
    data: Omit<Project, "id" | "created_at" | "updated_at">,
  ): Promise<Project>;
  update(id: string, data: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;

  // Member Management
  addMember(
    projectId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<ProjectMember>;
  removeMember(
    projectId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<void>;
  getMembers(projectId: string): Promise<ProjectMember[]>;
  getUserRole(projectId: string, userId: string): Promise<ProjectRole | null>;
}
