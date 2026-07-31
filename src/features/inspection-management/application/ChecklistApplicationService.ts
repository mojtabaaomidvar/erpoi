//src/features/inspection-management/application/ChecklistApplicationService.ts

import { checklistRepository } from "../repositories/ChecklistRepository";
import type {
  ChecklistData,
  ChecklistTemplate,
} from "../domain/checklistTypes";

export class ChecklistApplicationService {
  /**
   * دریافت چک‌لیست بر اساس equipment_id
   */
  async getChecklistByEquipment(equipmentId: string): Promise<ChecklistData> {
    return checklistRepository.getChecklistByEquipmentId(equipmentId);
  }

  /**
   * دریافت چک‌لیست بر اساس template_id
   */
  async getChecklistByTemplate(templateId: string): Promise<ChecklistData> {
    return checklistRepository.getChecklistByTemplateId(templateId);
  }

  /**
   * دریافت تمام template‌ها
   */
  async getAllTemplates(): Promise<ChecklistTemplate[]> {
    return checklistRepository.getAllTemplates();
  }
}

export const checklistAppService = new ChecklistApplicationService();
