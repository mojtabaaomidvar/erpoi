// src/features/tpi-management/repositories/IResidentInspectionRepository.ts

import type { ResidentInspection } from "../domain/types";

export interface IResidentInspectionRepository {
  getAll(): Promise<ResidentInspection[]>;
  getById(id: string): Promise<ResidentInspection | null>;
  getByTPIRequest(requestId: string): Promise<ResidentInspection[]>;
  create(
    data: Omit<ResidentInspection, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentInspection>;
  update(
    id: string,
    data: Partial<ResidentInspection>,
  ): Promise<ResidentInspection>;
  delete(id: string): Promise<void>;
}
