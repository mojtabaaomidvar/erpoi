// src/features/inspection-management/repositories/IReportRepository.ts

import type { InspectionReport } from "../domain/types";

export interface IReportRepository {
  getAll(): Promise<InspectionReport[]>;
  getById(id: string): Promise<InspectionReport | null>;
  getByInspection(inspectionId: string): Promise<InspectionReport[]>;
  create(
    data: Omit<InspectionReport, "id" | "created_at">,
  ): Promise<InspectionReport>;
  update(
    id: string,
    data: Partial<InspectionReport>,
  ): Promise<InspectionReport>;
  delete(id: string): Promise<void>;
}
