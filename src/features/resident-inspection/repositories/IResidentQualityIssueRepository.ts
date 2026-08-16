// src/features/resident-inspection/repositories/IResidentQualityIssueRepository.ts

import type { ResidentQualityIssue } from "../domain/types";

export interface IResidentQualityIssueRepository {
  getById(id: string): Promise<ResidentQualityIssue | null>;
  getByEngagement(engagementId: string): Promise<ResidentQualityIssue[]>;
  getOpen(engagementId: string): Promise<ResidentQualityIssue[]>;
  create(
    data: Omit<ResidentQualityIssue, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentQualityIssue>;
  update(
    id: string,
    data: Partial<ResidentQualityIssue>,
  ): Promise<ResidentQualityIssue>;
}
