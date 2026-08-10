// src/features/inspection-management/domain/sessionChecklistInheritance.ts

import type { InspectionSession } from "./models/InspectionSession";
import type {
  ChecklistItemResult,
  ChecklistItemStatus,
  ChecklistTransitionDecision,
  InheritedChecklistResult,
} from "./checklistTypes";

export function createChecklistResultIdentity(result: {
  request_id?: string;
  equipment_id: string;
  item_id: string;
  inspection_method: string;
}): string {
  return [
    result.request_id || "",
    result.equipment_id,
    result.item_id,
    result.inspection_method,
  ]
    .map((part) => `${part.length}:${part}`)
    .join("|");
}

export function decideInheritedTransition(
  sourceStatus: ChecklistItemStatus,
  targetStatus: ChecklistItemStatus,
): ChecklistTransitionDecision {
  if (sourceStatus === "PASS") {
    return {
      kind: "LOCKED",
      reason:
        "A result resolved as PASS in an earlier session cannot be changed.",
    };
  }
  if (targetStatus !== "PASS") return { kind: "ALLOW" };
  if (sourceStatus === "REJECT") {
    return { kind: "REQUIRES_RESOLUTION", findingType: "NCR" };
  }
  if (sourceStatus === "NOTE") {
    return { kind: "REQUIRES_RESOLUTION", findingType: "OBSERVATION" };
  }
  if (sourceStatus === "N/A") {
    return {
      kind: "BLOCKED",
      reason:
        "The domain policy for resolving an inherited N/A result is not defined.",
    };
  }
  return { kind: "ALLOW" };
}

/** Select the nearest previous result for each exact checklist identity. */
export function selectInheritedChecklistResults(params: {
  currentSession: InspectionSession;
  previousSessions: InspectionSession[];
  allResults: ChecklistItemResult[];
  currentResults: ChecklistItemResult[];
  requestId: string;
}): InheritedChecklistResult[] {
  const {
    currentSession,
    previousSessions,
    allResults,
    currentResults,
    requestId,
  } = params;
  const currentEquipment = new Set(currentSession.equipment_ids || []);
  const currentCoverage = new Set([
    ...(currentSession.methods || []),
    ...(currentSession.stages || []),
  ]);
  const currentKeys = new Set(
    currentResults.map((result) => createChecklistResultIdentity(result)),
  );
  const resultsBySession = new Map<string, ChecklistItemResult[]>();

  for (const result of allResults) {
    if (!result.session_id || result.request_id !== requestId) continue;
    const rows = resultsBySession.get(result.session_id) || [];
    rows.push(result);
    resultsBySession.set(result.session_id, rows);
  }

  const inherited: InheritedChecklistResult[] = [];
  const seen = new Set<string>();
  const sortedSessions = [...previousSessions].sort(
    (left, right) => right.session_number - left.session_number,
  );

  for (const sourceSession of sortedSessions) {
    const sourceEquipment = new Set(sourceSession.equipment_ids || []);
    const sourceCoverage = new Set([
      ...(sourceSession.methods || []),
      ...(sourceSession.stages || []),
    ]);

    for (const result of resultsBySession.get(sourceSession.id) || []) {
      if (!currentEquipment.has(result.equipment_id)) continue;
      if (!sourceEquipment.has(result.equipment_id)) continue;
      if (!currentCoverage.has(result.inspection_method)) continue;
      if (!sourceCoverage.has(result.inspection_method)) continue;
      if (result.status === "PENDING") continue;

      const key = createChecklistResultIdentity(result);
      if (currentKeys.has(key) || seen.has(key)) continue;
      seen.add(key);
      inherited.push({
        result,
        sourceSessionNumber: sourceSession.session_number,
        locked: result.status === "PASS",
      });
    }
  }

  return inherited;
}
