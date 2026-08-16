// src/features/resident-inspection/repositories/IResidentLookaheadRepository.ts

import type { ResidentLookaheadActivity } from "../domain/types";

export interface IResidentLookaheadRepository {
  getById(id: string): Promise<ResidentLookaheadActivity | null>;
  getByEngagement(engagementId: string): Promise<ResidentLookaheadActivity[]>;
  getUpcoming(
    engagementId: string,
    daysAhead?: number,
  ): Promise<ResidentLookaheadActivity[]>;
  create(
    data: Omit<ResidentLookaheadActivity, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentLookaheadActivity>;
  update(
    id: string,
    data: Partial<ResidentLookaheadActivity>,
  ): Promise<ResidentLookaheadActivity>;
  delete(id: string): Promise<void>;
}
