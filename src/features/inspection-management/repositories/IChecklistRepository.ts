// src/features/inspection-management/repositories/IChecklistRepository.ts

import type { Checklist } from "../domain/types";

export interface IChecklistRepository {
  getAll(): Promise<Checklist[]>;
  getById(id: string): Promise<Checklist | null>;
  getByInspection(inspectionId: string): Promise<Checklist[]>;
  create(
    data: Omit<Checklist, "id" | "created_at" | "updated_at">,
  ): Promise<Checklist>;
  update(id: string, data: Partial<Checklist>): Promise<Checklist>;
  delete(id: string): Promise<void>;
}
