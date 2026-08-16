// src/features/resident-inspection/application/ResidentAssignmentApplicationService.ts

import type { ResidentAssignment } from "../domain/types";
import type { IResidentAssignmentRepository } from "../repositories/IResidentAssignmentRepository";

export class ResidentAssignmentApplicationService {
  constructor(private assignmentRepository: IResidentAssignmentRepository) {}

  async getByEngagement(engagementId: string): Promise<ResidentAssignment[]> {
    return this.assignmentRepository.getByEngagement(engagementId);
  }

  async getById(id: string): Promise<ResidentAssignment | null> {
    return this.assignmentRepository.getById(id);
  }

  async create(
    data: Omit<ResidentAssignment, "id" | "created_at" | "updated_at" | "status">,
  ): Promise<ResidentAssignment> {
    return this.assignmentRepository.create({
      ...data,
      status: "ASSIGNED",
      assigned_at: new Date().toISOString(),
    });
  }

  async update(
    id: string,
    data: Partial<ResidentAssignment>,
  ): Promise<ResidentAssignment> {
    return this.assignmentRepository.update(id, data);
  }

  async relieve(
    id: string,
    relievedBy: string,
    reason?: string,
  ): Promise<ResidentAssignment> {
    return this.assignmentRepository.update(id, {
      status: "RELIEVED",
      relieved_by: relievedBy,
      relieved_at: new Date().toISOString(),
      relieved_reason: reason,
    });
  }
}
