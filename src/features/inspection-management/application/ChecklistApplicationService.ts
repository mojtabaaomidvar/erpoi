//src/features/inspection-management/application/ChecklistApplicationService.ts

import { checklistRepository } from "../repositories/SupabaseChecklistRepository";
import type { InspectionChecklist, ChecklistItem } from "../domain/types";

class ChecklistApplicationService {
  async getByInspectionId(
    inspectionId: string,
  ): Promise<InspectionChecklist | null> {
    return await checklistRepository.getByInspectionId(inspectionId);
  }

  async saveChecklist(
    inspectionId: string,
    inspectorId: string,
    items: Omit<ChecklistItem, "id" | "checklist_id">[],
  ): Promise<InspectionChecklist> {
    return await checklistRepository.upsertChecklist(
      inspectionId,
      inspectorId,
      items,
    );
  }
}

export const checklistAppService = new ChecklistApplicationService();
