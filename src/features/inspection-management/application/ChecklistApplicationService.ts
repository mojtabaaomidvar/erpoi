// src/features/inspection-management/application/ChecklistApplicationService.ts

import { checklistRepository } from "../repositories/SupabaseChecklistRepository";
import type { Checklist } from "../domain/types";
import {
  CreateChecklistSchema,
  type CreateChecklistCommand,
} from "./dto/ChecklistCommand";

class ChecklistApplicationService {
  private repository = checklistRepository;

  async getAll(): Promise<Checklist[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<Checklist | null> {
    return await this.repository.getById(id);
  }

  async getByInspection(inspectionId: string): Promise<Checklist[]> {
    return await this.repository.getByInspection(inspectionId);
  }

  async create(command: CreateChecklistCommand): Promise<Checklist> {
    const validatedData = CreateChecklistSchema.parse(command);

    return await this.repository.create({
      ...validatedData,
      overall_status: "PENDING",
    });
  }

  async update(id: string, data: Partial<Checklist>): Promise<Checklist> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async updateItemResult(
    checklistId: string,
    itemId: string,
    result: "PASS" | "FAIL" | "N/A",
    notes?: string,
    checkedBy?: string,
  ): Promise<Checklist> {
    const checklist = await this.repository.getById(checklistId);
    if (!checklist) throw new Error("Checklist not found");

    const updatedResults = (checklist.results || checklist.items || []).map(
      (item) => {
        if (item.id === itemId) {
          return {
            ...item,
            result,
            notes: notes || item.notes,
            checked_by: checkedBy,
            checked_at: new Date().toISOString(),
          };
        }
        return item;
      },
    );

    const allChecked = updatedResults.every((r) => r.result);
    const overallStatus = allChecked ? "COMPLETED" : "IN_PROGRESS";

    return await this.repository.update(checklistId, {
      results: updatedResults,
      overall_status: overallStatus,
      checked_by: checkedBy,
      checked_at: allChecked ? new Date().toISOString() : undefined,
    });
  }

  async createFromTemplate(
    inspectionId: string,
    category: any,
    checklistName: string,
    items: any[],
  ): Promise<any> {
    return await this.repository.create({
      inspection_id: inspectionId,
      category,
      checklist_name: checklistName,
      items,
      overall_status: "PENDING",
    });
  }
}

export const checklistAppService = new ChecklistApplicationService();
