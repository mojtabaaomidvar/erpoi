// src/features/inspection-management/repositories/IInspectionRepository.ts

import type { Inspection } from "../domain/types";

export interface IInspectionRepository {
  getAll(): Promise<Inspection[]>;
  getById(id: string): Promise<Inspection | null>;
  getByInspectionRequest(requestId: string): Promise<Inspection[]>;
  create(
    data: Omit<Inspection, "id" | "created_at" | "updated_at">,
  ): Promise<Inspection>;
  update(id: string, data: Partial<Inspection>): Promise<Inspection>;
  delete(id: string): Promise<void>;
}
