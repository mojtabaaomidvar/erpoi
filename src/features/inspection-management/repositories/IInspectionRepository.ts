// src/features/inspection-management/repositories/IInspectionRepository.ts

import type { Inspection } from "../domain/types";
import type { TPICancellationReason } from "@/features/tpi-management";

export interface IInspectionRepository {
  getAll(): Promise<Inspection[]>;
  getById(id: string): Promise<Inspection | null>;
  getByInspectionRequest(requestId: string): Promise<Inspection[]>;
  create(
    data: Omit<Inspection, "id" | "created_at" | "updated_at">,
  ): Promise<Inspection>;
  update(id: string, data: Partial<Inspection>): Promise<Inspection>;
  delete(id: string): Promise<void>;

  getInspectionsByInspectorAndDate(
    inspectorId: string,
    executionDate: string,
  ): Promise<Inspection[]>;

  cancelInspection(
    id: string,
    cancelledBy: string,
    reason?: TPICancellationReason,
    relatedInspectionId?: string,
    newScheduledDate?: string,
    dateIsUnknown?: boolean,
    newScopes?: string[],
    cancellationNotes?: string,
  ): Promise<Inspection>;

  getInspectionWithDetails(id: string): Promise<any>;
}
