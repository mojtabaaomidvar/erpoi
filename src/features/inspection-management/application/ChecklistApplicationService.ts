// src/features/inspection-management/application/ChecklistApplicationService.ts

import { checklistRepository } from "../repositories/SupabaseChecklistRepository";
import { checklistResultRepository } from "../repositories/ChecklistResultRepository";
import { NonConformityRepository } from "../repositories/NonConformityRepository";
import type {
  ChecklistData,
  ChecklistTemplate,
  ChecklistItemResult,
  ChecklistSession,
} from "../domain/checklistTypes";
import type {
  NonConformityReport,
  Observation,
} from "../repositories/NonConformityRepository";
import type {
  InspectionPhoto,
  UploadPhotoParams,
} from "../repositories/InspectionPhotoRepository";
import { inspectionPhotoRepository } from "../repositories/InspectionPhotoRepository";

const nonConformityRepo = new NonConformityRepository();

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

  // ✅ استفاده از instance به جای static call
  async createNonConformityFromReject(
    result: ChecklistItemResult,
    title: string,
    description: string,
    severity: "MINOR" | "MAJOR" | "OBSERVATION" | "HOLD POINT",
    category: string,
    createdBy: string,
  ): Promise<NonConformityReport> {
    return nonConformityRepo.createNonConformityFromReject(
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
    return nonConformityRepo.createObservationFromNote(
      result,
      observationText,
      category,
      createdBy,
    );
  }

  async getNonConformitysByRequestId(
    requestId: string,
  ): Promise<NonConformityReport[]> {
    return nonConformityRepo.getNonConformitysByRequestId(requestId);
  }

  async getObservationsByRequestId(requestId: string): Promise<Observation[]> {
    return nonConformityRepo.getObservationsByRequestId(requestId);
  }

  // ✅ Photo upload methods
  async uploadInspectionPhoto(
    params: UploadPhotoParams,
  ): Promise<InspectionPhoto> {
    return inspectionPhotoRepository.uploadPhoto(params);
  }

  async getPhotosByChecklistItem(
    checklistItemId: string,
  ): Promise<InspectionPhoto[]> {
    return inspectionPhotoRepository.getPhotosByChecklistItem(checklistItemId);
  }

  async getPhotosByRequestId(requestId: string): Promise<InspectionPhoto[]> {
    return inspectionPhotoRepository.getPhotosByRequestId(requestId);
  }

  async deletePhoto(photoId: string): Promise<void> {
    return inspectionPhotoRepository.deletePhoto(photoId);
  }

  async updatePhotoDescription(
    photoId: string,
    description: string,
  ): Promise<void> {
    return inspectionPhotoRepository.updatePhotoDescription(
      photoId,
      description,
    );
  }
}

export const checklistAppService = new ChecklistApplicationService();
