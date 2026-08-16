import type { ChecklistItemResult } from "../domain/checklistTypes";
import {
  canTransitionFinding,
  normalizeFindingClassification,
  type Finding,
  type FindingClassification,
  type FindingKind,
  type FindingStatus,
  type FindingUpdate,
} from "../domain/models/Finding";
import type { IFindingRepository } from "../repositories/IFindingRepository";
import { findingRepository } from "../repositories/SupabaseFindingRepository";

export class FindingApplicationService {
  constructor(private readonly repository: IFindingRepository) {}

  listByRequestId(requestId: string): Promise<Finding[]> {
    return this.repository.getByRequestId(requestId);
  }

  getForChecklistResult(
    requestId: string,
    kind: FindingKind,
    result: ChecklistItemResult,
  ): Promise<Finding | null> {
    return this.repository.getByChecklistSource(requestId, kind, result);
  }

  createNcrFromReject(
    result: ChecklistItemResult,
    title: string,
    description: string,
    classification: FindingClassification | "HOLD POINT",
    category: string,
    createdBy: string,
    projectCode?: string,
  ): Promise<Finding> {
    if (result.status !== "REJECT") {
      throw new Error("Only a rejected checklist result can create an NCR");
    }
    if (!description.trim()) {
      throw new Error("A non-conformity description is required");
    }
    return this.repository.createNcr({
      result,
      title: title.trim(),
      description: description.trim(),
      classification: normalizeFindingClassification(classification),
      category,
      createdBy,
      projectCode,
    });
  }

  createObservationFromNote(
    result: ChecklistItemResult,
    observationText: string,
    category: string,
    createdBy: string,
  ): Promise<Finding> {
    if (result.status !== "NOTE") {
      throw new Error(
        "Only a noted checklist result can create an observation",
      );
    }
    if (!observationText.trim()) {
      throw new Error("An observation description is required");
    }
    return this.repository.createObservation({
      result,
      observationText: observationText.trim(),
      category,
      createdBy,
    });
  }

  updateFinding(finding: Finding, update: FindingUpdate): Promise<Finding> {
    if (finding.status === "CLOSED" || finding.status === "REJECTED") {
      throw new Error("A terminal finding cannot be edited");
    }
    return this.repository.update(finding.id, finding.kind, update);
  }

  transitionFinding(
    finding: Finding,
    nextStatus: FindingStatus,
    actorId: string,
  ): Promise<Finding> {
    if (!canTransitionFinding(finding.status, nextStatus)) {
      throw new Error(
        `Invalid finding transition: ${finding.status} to ${nextStatus}`,
      );
    }
    if (
      finding.kind === "NCR" &&
      nextStatus === "VERIFICATION" &&
      !finding.correctiveAction
    ) {
      throw new Error("Corrective action is required before verification");
    }
    if (
      finding.kind === "NCR" &&
      nextStatus === "CLOSED" &&
      !finding.verification
    ) {
      throw new Error("Verification is required before closing an NCR");
    }
    return this.repository.transition(finding.id, finding.kind, {
      status: nextStatus,
      actorId,
      closedAt:
        nextStatus === "CLOSED" || nextStatus === "REJECTED"
          ? new Date().toISOString()
          : undefined,
    });
  }
}

export const findingAppService = new FindingApplicationService(
  findingRepository,
);
