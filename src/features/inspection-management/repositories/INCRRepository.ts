// src/features/inspection-management/repositories/INCRRepository.ts

import type { NonConformity } from "../domain/types";

export interface INCRRepository {
  getAll(): Promise<NonConformity[]>;
  getById(id: string): Promise<NonConformity | null>;
  getByInspection(inspectionId: string): Promise<NonConformity[]>;
  create(
    data: Omit<NonConformity, "id" | "created_at" | "updated_at">,
  ): Promise<NonConformity>;
  update(id: string, data: Partial<NonConformity>): Promise<NonConformity>;
  delete(id: string): Promise<void>;
}
