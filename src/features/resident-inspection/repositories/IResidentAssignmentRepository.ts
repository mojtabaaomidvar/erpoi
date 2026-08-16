// src/features/resident-inspection/repositories/IResidentAssignmentRepository.ts

import type { ResidentAssignment } from "../domain/types";

export interface IResidentAssignmentRepository {
  getById(id: string): Promise<ResidentAssignment | null>;
  getByEngagement(engagementId: string): Promise<ResidentAssignment[]>;
  create(
    data: Omit<ResidentAssignment, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentAssignment>;
  update(
    id: string,
    data: Partial<ResidentAssignment>,
  ): Promise<ResidentAssignment>;
}
