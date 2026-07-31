//src/features/inspection-management/application/ChecklistApplicationService.ts

import { checklistRepository } from "../repositories/ChecklistRepository";
import type {
  ChecklistData,
  ChecklistTemplate,
} from "../domain/checklistTypes";

export class ChecklistApplicationService {
  async getChecklistByEquipment(equipmentId: string): Promise<ChecklistData> {
    return checklistRepository.getChecklistByEquipmentId(equipmentId);
  }

  async getChecklistByTemplate(templateId: string): Promise<ChecklistData> {
    return checklistRepository.getChecklistByTemplateId(templateId);
  }

  async getAllTemplates(): Promise<ChecklistTemplate[]> {
    return checklistRepository.getAllTemplates();
  }
}

export const checklistAppService = new ChecklistApplicationService();
