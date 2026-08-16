// src/features/resident-inspection/repositories/IResidentITPMonitoringRepository.ts

import type { ResidentITPMonitoring } from "../domain/types";

export interface IResidentITPMonitoringRepository {
  getById(id: string): Promise<ResidentITPMonitoring | null>;
  getByEngagement(engagementId: string): Promise<ResidentITPMonitoring[]>;
  getPending(engagementId: string): Promise<ResidentITPMonitoring[]>;
  create(
    data: Omit<ResidentITPMonitoring, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentITPMonitoring>;
  update(
    id: string,
    data: Partial<ResidentITPMonitoring>,
  ): Promise<ResidentITPMonitoring>;
}
