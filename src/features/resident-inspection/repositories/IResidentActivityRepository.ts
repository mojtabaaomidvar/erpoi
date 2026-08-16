// src/features/resident-inspection/repositories/IResidentActivityRepository.ts

import type { ResidentDailyActivity } from "../domain/types";

export interface IResidentActivityRepository {
  getById(id: string): Promise<ResidentDailyActivity | null>;
  getByEngagement(engagementId: string): Promise<ResidentDailyActivity[]>;
  getByEngagementAndDate(
    engagementId: string,
    activityDate: string,
  ): Promise<ResidentDailyActivity[]>;
  create(
    data: Omit<ResidentDailyActivity, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentDailyActivity>;
  update(
    id: string,
    data: Partial<ResidentDailyActivity>,
  ): Promise<ResidentDailyActivity>;
  delete(id: string): Promise<void>;
}
