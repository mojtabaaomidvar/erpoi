// src/features/inspection-management/application/ChecklistApplicationService.ts

import { checklistRepository } from "../repositories/SupabaseChecklistRepository";
import { checklistResultRepository } from "../repositories/ChecklistResultRepository";
import { NonConformityRepository } from "../repositories/NonConformityRepository";
import { inspectionSessionAppService } from "./InspectionSessionApplicationService";
import {
  decideInheritedTransition,
  selectInheritedChecklistResults,
} from "../domain/sessionChecklistInheritance";
import type {
  ChecklistData,
  ChecklistTemplate,
  ChecklistItemResult,
  ChecklistItemStatus,
  ChecklistSession,
  SessionChecklistContext,
  ChecklistTransitionDecision,
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

  /**
   * Results saved for one specific inspection session.
   */
  async getSessionResults(sessionId: string): Promise<ChecklistItemResult[]> {
    return checklistResultRepository.getResultsBySessionId(sessionId);
  }

  /**
   * Session-scoped checklist context:
   * - currentResults → this session's own saved results (falls back to legacy
   *   request-level rows while the session has none of its own)
   * - inherited → previous-session results pre-loaded for matching
   *   (equipment + method + stage) groups, most recent session wins
   */
  async getChecklistSessionContext(params: {
    requestId: string;
    sessionId?: string;
    equipmentId: string[];
    stages?: string[];
    methods?: string[];
  }): Promise<SessionChecklistContext> {
    const { requestId, sessionId } = params;

    const allResults =
      await checklistResultRepository.getResultsByRequestId(requestId);

    // No active session → legacy request-level behaviour (nothing inherited).
    if (!sessionId) {
      return {
        currentResults: allResults,
        inherited: [],
      };
    }

    const sessions =
      await inspectionSessionAppService.getSessionsByRequestId(requestId);
    const current = sessions.find((s) => s.id === sessionId);
    if (!current) {
      return {
        currentResults: [],
        inherited: [],
      };
    }

    const previousSessions = sessions.filter(
      (s) => s.session_number < current.session_number,
    );
    const currentRows = allResults.filter((r) => r.session_id === sessionId);
    const inherited = selectInheritedChecklistResults({
      currentSession: current,
      previousSessions,
      allResults,
      currentResults: currentRows,
      requestId,
    });

    return {
      currentResults: currentRows,
      inherited,
    };
  }

  evaluateInheritedTransition(
    sourceStatus: ChecklistItemStatus,
    targetStatus: ChecklistItemStatus,
  ): ChecklistTransitionDecision {
    return decideInheritedTransition(sourceStatus, targetStatus);
  }

  async getFindingForChecklistResult(
    requestId: string,
    result: ChecklistItemResult,
  ): Promise<
    | {
        type: "NCR";
        id: string;
        number: string;
        title: string;
        description: string;
        status: string;
      }
    | {
        type: "OBSERVATION";
        id: string;
        title: string;
        description: string;
        status: "UNRESOLVED";
      }
    | null
  > {
    const isSameChecklistIdentity = (finding: {
      equipment_id: string;
      inspection_method: string;
      checklist_item_id: string;
    }) =>
      finding.equipment_id === result.equipment_id &&
      finding.inspection_method === result.inspection_method &&
      finding.checklist_item_id === result.item_id;

    if (result.status === "REJECT") {
      const reports =
        await nonConformityRepo.getNonConformitysByRequestId(requestId);
      const report = reports.find(isSameChecklistIdentity);
      return report
        ? {
            type: "NCR",
            id: report.id,
            number: report.NonConformity_number,
            title: report.title,
            description: report.description,
            status: report.status,
          }
        : null;
    }

    if (result.status === "NOTE") {
      const observations =
        await nonConformityRepo.getObservationsByRequestId(requestId);
      const observation = observations.find(isSameChecklistIdentity);
      return observation
        ? {
            type: "OBSERVATION",
            id: observation.id,
            title: observation.category || "Observation",
            description: observation.observation_text,
            status: "UNRESOLVED",
          }
        : null;
    }

    return null;
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

  /**
   * Transition an NCR through its lifecycle
   * (OPEN → IN_PROGRESS → CLOSED / REJECTED).
   */
  async updateNonConformityStatus(
    ncrId: string,
    status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "REJECTED",
    closedBy?: string,
  ): Promise<void> {
    return nonConformityRepo.updateNonConformityStatus(ncrId, status, closedBy);
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
