// src/features/resident-inspection/application/ResidentEngagementApplicationService.ts

import type { ResidentEngagement } from "../domain/types";
import { ResidentEngagementLifecyclePolicy } from "../domain/services/ResidentEngagementLifecyclePolicy";
import type { IResidentEngagementRepository } from "../repositories/IResidentEngagementRepository";

export class ResidentEngagementApplicationService {
  constructor(private engagementRepository: IResidentEngagementRepository) {}

  async getAll(): Promise<ResidentEngagement[]> {
    return this.engagementRepository.getAll();
  }

  async getById(id: string): Promise<ResidentEngagement | null> {
    return this.engagementRepository.getById(id);
  }

  async getByProject(projectId: string): Promise<ResidentEngagement[]> {
    return this.engagementRepository.getByProject(projectId);
  }

  async create(
    data: Omit<
      ResidentEngagement,
      "id" | "created_at" | "updated_at" | "status"
    >,
  ): Promise<ResidentEngagement> {
    return this.engagementRepository.create({
      ...data,
      status: "DRAFT",
    });
  }

  async update(
    id: string,
    data: Partial<ResidentEngagement>,
  ): Promise<ResidentEngagement> {
    return this.engagementRepository.update(id, data);
  }

  /**
   * Advances the engagement lifecycle with domain-policy validation.
   */
  async transitionStatus(
    id: string,
    target: ResidentEngagement["status"],
  ): Promise<ResidentEngagement> {
    const engagement = await this.engagementRepository.getById(id);
    if (!engagement) throw new Error("Resident engagement not found");

    ResidentEngagementLifecyclePolicy.assertTransition(
      engagement.status,
      target,
    );

    const patch: Partial<ResidentEngagement> = { status: target };
    if (target === "ACTIVE" && !engagement.actual_start_date) {
      patch.actual_start_date = new Date().toISOString().split("T")[0];
    }
    if (target === "COMPLETED") {
      patch.actual_end_date = new Date().toISOString().split("T")[0];
    }

    return this.engagementRepository.update(id, patch);
  }
}
