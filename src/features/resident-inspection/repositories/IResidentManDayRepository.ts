// src/features/resident-inspection/repositories/IResidentManDayRepository.ts

import type { ResidentManDay } from "../domain/types";

export interface IResidentManDayRepository {
  getById(id: string): Promise<ResidentManDay | null>;
  getByEngagement(engagementId: string): Promise<ResidentManDay[]>;
  getByAssignment(assignmentId: string): Promise<ResidentManDay[]>;
  getByAssignmentAndMonth(
    assignmentId: string,
    month: string,
  ): Promise<ResidentManDay[]>;
  create(
    data: Omit<ResidentManDay, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentManDay>;
  update(
    id: string,
    data: Partial<ResidentManDay>,
  ): Promise<ResidentManDay>;
  delete(id: string): Promise<void>;
}
