// src/features/inspection-management/repositories/IInspectionRequestRepository.ts

import type { BaseInspectionRequest } from "../domain/types";

export interface IInspectionRequestRepository {
  getAll(): Promise<BaseInspectionRequest[]>;
  getById(id: string): Promise<BaseInspectionRequest | null>;
  getByProject(projectId: string): Promise<BaseInspectionRequest[]>;
  create(
    data: Omit<BaseInspectionRequest, "id" | "created_at" | "updated_at">,
  ): Promise<BaseInspectionRequest>;
  update(
    id: string,
    data: Partial<BaseInspectionRequest>,
  ): Promise<BaseInspectionRequest>; // ✅ تغییر به BaseInspectionRequest
  delete(id: string): Promise<void>;
}
