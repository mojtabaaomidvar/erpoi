// src/features/resident-inspection/repositories/IResidentEngagementRepository.ts

import type { ResidentEngagement } from "../domain/types";

export interface IResidentEngagementRepository {
  getAll(): Promise<ResidentEngagement[]>;
  getById(id: string): Promise<ResidentEngagement | null>;
  getByProject(projectId: string): Promise<ResidentEngagement[]>;
  create(
    data: Omit<ResidentEngagement, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentEngagement>;
  update(
    id: string,
    data: Partial<ResidentEngagement>,
  ): Promise<ResidentEngagement>;
}
