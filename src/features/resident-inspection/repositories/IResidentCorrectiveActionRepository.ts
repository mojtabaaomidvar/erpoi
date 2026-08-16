// src/features/resident-inspection/repositories/IResidentCorrectiveActionRepository.ts

import type { ResidentCorrectiveAction } from "../domain/types";

export interface IResidentCorrectiveActionRepository {
  getById(id: string): Promise<ResidentCorrectiveAction | null>;
  getByIssue(issueId: string): Promise<ResidentCorrectiveAction[]>;
  getByIssues(issueIds: readonly string[]): Promise<ResidentCorrectiveAction[]>;
  getOverdue(): Promise<ResidentCorrectiveAction[]>;
  create(
    data: Omit<ResidentCorrectiveAction, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentCorrectiveAction>;
  update(
    id: string,
    data: Partial<ResidentCorrectiveAction>,
  ): Promise<ResidentCorrectiveAction>;
}
