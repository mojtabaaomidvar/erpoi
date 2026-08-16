// src/features/resident-inspection/repositories/IResidentCloseoutRepository.ts

import type { ResidentCloseout } from "../domain/types";

export interface IResidentCloseoutRepository {
  getById(id: string): Promise<ResidentCloseout | null>;
  getByEngagement(engagementId: string): Promise<ResidentCloseout | null>;
  create(
    data: Omit<ResidentCloseout, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentCloseout>;
  update(
    id: string,
    data: Partial<ResidentCloseout>,
  ): Promise<ResidentCloseout>;
}
