import type { ChecklistItemResult } from "../domain/checklistTypes";
import type {
  Finding,
  FindingClassification,
  FindingKind,
  FindingStatus,
  FindingUpdate,
} from "../domain/models/Finding";

export interface CreateNcrFindingCommand {
  result: ChecklistItemResult;
  title: string;
  description: string;
  classification: FindingClassification;
  category: string;
  createdBy: string;
  projectCode?: string;
}

export interface CreateObservationFindingCommand {
  result: ChecklistItemResult;
  observationText: string;
  category: string;
  createdBy: string;
}

export interface FindingTransitionPersistence {
  status: FindingStatus;
  actorId: string;
  closedAt?: string;
}

export interface IFindingRepository {
  createNcr(command: CreateNcrFindingCommand): Promise<Finding>;
  createObservation(command: CreateObservationFindingCommand): Promise<Finding>;
  getByRequestId(requestId: string): Promise<Finding[]>;
  getByChecklistSource(
    requestId: string,
    kind: FindingKind,
    result: ChecklistItemResult,
  ): Promise<Finding | null>;
  update(
    findingId: string,
    kind: FindingKind,
    update: FindingUpdate,
  ): Promise<Finding>;
  transition(
    findingId: string,
    kind: FindingKind,
    transition: FindingTransitionPersistence,
  ): Promise<Finding>;
}
