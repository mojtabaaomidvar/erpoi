// src/features/inspection-management/repositories/IChecklistRepository.ts

import type {
  ChecklistData,
  ChecklistTemplate,
} from "../domain/checklistTypes";

export interface IChecklistRepository {
  getChecklistByEquipmentId(equipmentId: string): Promise<ChecklistData>;

  getAllTemplates(): Promise<ChecklistTemplate[]>;
}
