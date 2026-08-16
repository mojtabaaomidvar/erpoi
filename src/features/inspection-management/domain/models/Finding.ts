export type FindingKind = "NCR" | "OBSERVATION";

export type FindingClassification =
  | "MAJOR"
  | "MINOR"
  | "OBSERVATION"
  | "HOLD_POINT";

export type FindingStatus =
  | "OPEN"
  | "CORRECTIVE_ACTION"
  | "VERIFICATION"
  | "CLOSED"
  | "REJECTED";

export type FindingCloseoutDecision =
  | "ACCEPTED_CLOSED"
  | "REJECTED_NEW_NCR"
  | "CONDITIONALLY_ACCEPTED";

export interface FindingDocumentReference {
  number: string;
  title: string;
  revision?: string;
  clauseSection?: string;
}

export interface Finding {
  id: string;
  kind: FindingKind;
  number?: string;
  revision: string;
  requestId: string;
  sessionId?: string | null;
  equipmentId?: string;
  inspectionMethod?: string;
  checklistItemId?: string;
  checklistText?: string;
  title: string;
  description: string;
  classification: FindingClassification;
  category?: string;
  locationFound?: string;
  evidence?: string;
  photos: string[];
  documentReferences: FindingDocumentReference[];
  immediateContainment?: string;
  correctiveAction?: string;
  targetCompletionDate?: string;
  responsiblePerson?: string;
  rootCause?: string;
  preventiveAction?: string;
  verification?: string;
  closeoutDecision?: FindingCloseoutDecision;
  closeoutNote?: string;
  closeoutDate?: string;
  status: FindingStatus;
  closedBy?: string;
  closedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindingUpdate {
  title?: string;
  description?: string;
  classification?: FindingClassification;
  category?: string;
  locationFound?: string;
  evidence?: string;
  photos?: string[];
  documentReferences?: FindingDocumentReference[];
  immediateContainment?: string;
  correctiveAction?: string;
  targetCompletionDate?: string;
  responsiblePerson?: string;
  rootCause?: string;
  preventiveAction?: string;
  verification?: string;
  closeoutDecision?: FindingCloseoutDecision;
  closeoutNote?: string;
  closeoutDate?: string;
}

const ALLOWED_TRANSITIONS: Record<FindingStatus, readonly FindingStatus[]> = {
  OPEN: ["CORRECTIVE_ACTION", "CLOSED"],
  CORRECTIVE_ACTION: ["VERIFICATION", "OPEN"],
  VERIFICATION: ["CLOSED", "REJECTED", "CORRECTIVE_ACTION"],
  CLOSED: [],
  REJECTED: [],
};

export function canTransitionFinding(
  current: FindingStatus,
  next: FindingStatus,
): boolean {
  return current === next || ALLOWED_TRANSITIONS[current].includes(next);
}

export function normalizeFindingClassification(
  value: FindingClassification | "HOLD POINT",
): FindingClassification {
  return value === "HOLD POINT" ? "HOLD_POINT" : value;
}
