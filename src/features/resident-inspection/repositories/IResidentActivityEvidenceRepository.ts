// src/features/resident-inspection/repositories/IResidentActivityEvidenceRepository.ts

import type { ResidentActivityEvidence } from "../domain/types";

export interface IResidentActivityEvidenceRepository {
  getByActivityIds(
    activityIds: readonly string[],
  ): Promise<ResidentActivityEvidence[]>;
}
