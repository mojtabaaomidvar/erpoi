// src/features/inspection-management/repositories/IChecklistRepository.ts

import type { InspectionChecklist, ChecklistItem } from "../domain/types";

export interface IChecklistRepository {
  getByInspectionId(inspectionId: string): Promise<InspectionChecklist | null>;
  upsertChecklist(
    inspectionId: string,
    inspectorId: string,
    items: Omit<ChecklistItem, "id" | "checklist_id">[]
  ): Promise<InspectionChecklist>;
}