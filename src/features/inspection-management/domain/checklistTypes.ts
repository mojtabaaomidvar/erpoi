// src/features/inspection-management/domain/checklistTypes.ts

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface ChecklistItem {
  id: string;
  template_id: string;
  inspection_method: string;
  sequence: number;
  checklist_text: string;
  is_active: boolean;
}

export interface ChecklistGroup {
  method: string;
  items: ChecklistItem[];
}

export interface ChecklistData {
  template: ChecklistTemplate | null;
  groups: ChecklistGroup[];
}
export type ChecklistItemStatus =
  | "PENDING"
  | "PASS"
  | "REJECT"
  | "NOTE"
  | "N/A";

export interface StatusMetadata {
  label: string;
  icon: string;
  color: string;
  gradient: string;
  softColor: string;
  borderColor: string;
}

export interface ChecklistItemResult {
  item_id: string;
  request_id?: string;
  /** Inspection session this result belongs to (undefined = legacy request-level row) */
  session_id?: string;
  equipment_id: string;
  inspection_method: string;
  checklist_text?: string;
  status: ChecklistItemStatus;
  comment?: string;
  checked_by?: string;
  checked_at?: string;
  photo_urls?: string[];
}

export interface ChecklistSession {
  id: string;
  request_id: string;
  /** Inspection session id that owns these results (undefined = legacy request-level) */
  session_id?: string;
  equipment_id: string;
  inspection_method: string;
  results: ChecklistItemResult[];
  total_items: number;
  completed_items: number;
  status: "IN_PROGRESS" | "COMPLETED" | "SUBMITTED";
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * A result inherited from a previous session (same item + method + stage).
 */
export interface InheritedChecklistResult {
  result: ChecklistItemResult;
  sourceSessionNumber: number;
  locked: boolean;
}
export interface SessionChecklistContext {
  currentResults: ChecklistItemResult[];
  inherited: InheritedChecklistResult[];
}

export type ChecklistTransitionDecision =
  | { kind: "ALLOW" }
  | { kind: "LOCKED"; reason: string }
  | { kind: "REQUIRES_RESOLUTION"; findingType: "NCR" | "OBSERVATION" }
  | { kind: "BLOCKED"; reason: string };

export interface SharedChecklistItem {
  checklist_text: string;
  equipment_ids: string[];
  methods: string[];
  count: number;
}

export interface MethodMetadata {
  method: string;
  icon: string;
  gradient: string;
  color: string;
}
