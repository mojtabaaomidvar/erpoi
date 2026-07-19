// src/features/inspection-management/repositories/IInspectionRequestRepository.ts

import type { InspectionRequest } from "../domain/types";
import type { CreateInspectionRequestCommand } from "../application/dto/CreateInspectionRequestCommand";

export interface IInspectionRequestRepository {
  getAll(): Promise<InspectionRequest[]>;
  getById(id: string): Promise<InspectionRequest | null>;
  getByProject(projectId: string): Promise<InspectionRequest[]>;
  create(
    data: CreateInspectionRequestCommand & { requested_by: string },
  ): Promise<InspectionRequest>;
  update(
    id: string,
    data: Partial<InspectionRequest>,
  ): Promise<InspectionRequest>;
  delete(id: string): Promise<void>;
}
