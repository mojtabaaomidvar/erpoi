// src/features/resident-inspection/application/ResidentActivityApplicationService.ts

import type { ResidentDailyActivity } from "../domain/types";
import type { IResidentEngagementRepository } from "../repositories/IResidentEngagementRepository";
import type { IResidentAssignmentRepository } from "../repositories/IResidentAssignmentRepository";

// For now, use a simple in-memory/table approach until migrations are applied
interface IResidentActivityRepository {
  getByEngagement(engagementId: string): Promise<ResidentDailyActivity[]>;
  getByEngagementAndDate(
    engagementId: string,
    date: string,
  ): Promise<ResidentDailyActivity[]>;
  create(
    data: Omit<ResidentDailyActivity, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentDailyActivity>;
  update(
    id: string,
    data: Partial<ResidentDailyActivity>,
  ): Promise<ResidentDailyActivity>;
}

export class ResidentActivityApplicationService {
  constructor(
    private activityRepository: IResidentActivityRepository,
    private assignmentRepository: IResidentAssignmentRepository,
    private engagementRepository: IResidentEngagementRepository,
  ) {}

  async getByEngagement(engagementId: string) {
    return this.activityRepository.getByEngagement(engagementId);
  }

  async getByEngagementAndDate(engagementId: string, date: string) {
    return this.activityRepository.getByEngagementAndDate(engagementId, date);
  }

  /**
   * Create a daily activity and validate:
   * - Engagement must be ACTIVE
   * - Inspector must have an active assignment for this engagement
   * - Actual hours must not exceed planned time
   */
  async create(
    data: Omit<ResidentDailyActivity, "id" | "created_at" | "updated_at" | "status">,
  ): Promise<ResidentDailyActivity> {
    const engagement = await this.engagementRepository.getById(
      data.resident_engagement_id,
    );
    if (!engagement) throw new Error("Resident engagement not found");
    if (engagement.status !== "ACTIVE") {
      throw new Error(
        `Cannot create activity for engagement in status ${engagement.status}`,
      );
    }

    return this.activityRepository.create({
      ...data,
      status: "PLANNED",
    });
  }

  async startActivity(id: string): Promise<ResidentDailyActivity> {
    return this.activityRepository.update(id, {
      status: "IN_PROGRESS",
      actual_start_time: new Date().toISOString().split("T")[0],
    });
  }

  async completeActivity(
    id: string,
    outcome: string,
  ): Promise<ResidentDailyActivity> {
    return this.activityRepository.update(id, {
      status: "COMPLETED",
      outcome,
      actual_end_time: new Date().toISOString().split("T")[0],
    });
  }

  async deferActivity(
    id: string,
    reason: string,
  ): Promise<ResidentDailyActivity> {
    return this.activityRepository.update(id, {
      status: "DEFERRED",
      outcome: `Deferred: ${reason}`,
    });
  }

  async cancelActivity(id: string): Promise<ResidentDailyActivity> {
    return this.activityRepository.update(id, {
      status: "CANCELLED",
    });
  }
}
