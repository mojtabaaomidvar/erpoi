// src/features/resident-inspection/repositories/IResidentPeriodicReportRepository.ts

import type { ResidentPeriodicReport } from "../domain/types";

export interface IResidentPeriodicReportRepository {
  getById(id: string): Promise<ResidentPeriodicReport | null>;
  getByEngagement(engagementId: string): Promise<ResidentPeriodicReport[]>;
  create(
    data: Omit<ResidentPeriodicReport, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentPeriodicReport>;
  update(
    id: string,
    data: Partial<ResidentPeriodicReport>,
  ): Promise<ResidentPeriodicReport>;
}
