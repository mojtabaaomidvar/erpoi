// src/features/inspection-management/application/ChecklistApplicationService.ts

import { checklistRepository } from "../repositories/SupabaseChecklistRepository";
import { checklistResultRepository } from "../repositories/ChecklistResultRepository";
import { ncrRepository } from "../repositories/NcrRepository";
import type {
  ChecklistData,
  ChecklistTemplate,
  ChecklistItemResult,
  ChecklistSession,
} from "../domain/checklistTypes";
import type { NcrReport, Observation } from "../repositories/NcrRepository";

export class ChecklistApplicationService {
  async getChecklist(filters: {
    equipmentId: string[];
    stages?: string[];
    methods?: string[];
  }): Promise<ChecklistData> {
    return checklistRepository.getChecklist(filters);
  }

  async getAllTemplates(): Promise<ChecklistTemplate[]> {
    return checklistRepository.getAllTemplates();
  }

  async saveResults(session: ChecklistSession): Promise<void> {
    await checklistResultRepository.saveResults(session);
  }

  async getSavedResults(requestId: string): Promise<ChecklistItemResult[]> {
    return checklistResultRepository.getResultsByRequestId(requestId);
  }

  // ✅ متدهای جدید برای NCR و Observation
  async createNcrFromReject(
    result: ChecklistItemResult,
    title: string,
    description: string,
    severity: "MINOR" | "MAJOR" | "OBSERVATION" | "HOLD POINT",
    category: string,
    createdBy: string,
  ): Promise<NcrReport> {
    return ncrRepository.createNcrFromReject(
      result,
      title,
      description,
      severity,
      category,
      createdBy,
    );
  }

  async createObservationFromNote(
    result: ChecklistItemResult,
    observationText: string,
    category: string,
    createdBy: string,
  ): Promise<Observation> {
    return ncrRepository.createObservationFromNote(
      result,
      observationText,
      category,
      createdBy,
    );
  }

  async getNcrsByRequestId(requestId: string): Promise<NcrReport[]> {
    return ncrRepository.getNcrsByRequestId(requestId);
  }

  async getObservationsByRequestId(requestId: string): Promise<Observation[]> {
    return ncrRepository.getObservationsByRequestId(requestId);
  }
}

export const checklistAppService = new ChecklistApplicationService();
