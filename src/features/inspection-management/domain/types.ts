// src/features/inspection-management/domain/types.ts

import type { Inspector } from "@/features/inspector-managment/domain";

// ═══════════════════════════════════════
// 🔍 Shared Universal Types
// ═══════════════════════════════════════

export type InspectionCategory = "TPI" | "MWS";
export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type InspectionStatus =
  | "NEW"
  | "INSPECTOR_ASSIGNED"
  | "INSPECTION_COMPLETED"
  | "REPORT_ISSUED"
  | "FOLLOW_UP"
  | "CLOSED"
  | "REJECTED";

export type InspectionExecutionStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type ReviewStatus = "INITIAL" | "APPROVED" | "COMMENTED" | "REJECTED";

export type CancellationReason =
  | "REASSIGNED"
  | "CLIENT_REQUEST"
  | "VENDOR_UNAVAILABLE"
  | "SCOPE_CHANGED"
  | "OTHER";

// ═══════════════════════════════════════
// 📋 Base Entities
// ═══════════════════════════════════════

export interface BaseInspectionRequest {
  id: string;
  project_id: string;
  client_id: string;
  contract_id: string;
  category: InspectionCategory;
  inspection_date: string;
  requested_by: string;
  status: InspectionStatus;
  priority: Priority;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  inspection_request_id: string;
  inspector_id: string;
  assigned_by: string;
  assigned_at: string;
  execution_date?: string;
  location?: string;
  vendor_site?: string;
  status: InspectionExecutionStatus;
  actual_start_time?: string;
  actual_end_time?: string;
  weather_conditions?: string;
  general_remarks?: string;

  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: CancellationReason;
  related_inspection_id?: string;
  new_scheduled_date?: string;
  date_is_unknown?: boolean;
  new_scopes?: string[];
  cancellation_notes?: string;

  created_at: string;
  updated_at: string;
}

export interface DocumentReview {
  id: string;
  inspection_request_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  document_number?: string;
  revision?: string;
  review_status: ReviewStatus;
  comments?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  verified_by_ics?: boolean;
  verification_letter_number?: string;
  verification_date?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EnrichedInspector {
  inspector: Inspector;
  isMatch: boolean;
  isAvailable: boolean;
  conflictingInspections: Inspection[];
}
