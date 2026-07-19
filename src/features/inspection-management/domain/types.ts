// src/features/inspection-management/domain/types.ts

// ═══════════════════════════════════════
// 🔍 Shared Inspection Types
// ═══════════════════════════════════════

export type InspectionStatus =
  | "PENDING"
  | "DOCUMENT_REVIEW"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED";

export type InspectionExecutionStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type InspectionCategory = "TPI" | "MWS";
export type InspectionMode = "SPOT" | "RESIDENT";
export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type DocumentType =
  | "ITP"
  | "PROCEDURE"
  | "CERTIFICATE"
  | "DRAWING"
  | "OTHER";
export type ReviewStatus = "PENDING" | "APPROVED" | "COMMENTED" | "REJECTED";
export type ReportType = "IR" | "IRN" | "SRN";
export type NCRSeverity = "MINOR" | "MAJOR" | "CRITICAL";
export type NCRStatus =
  | "OPEN"
  | "CORRECTIVE_ACTION"
  | "VERIFICATION"
  | "CLOSED";
export type ChecklistCategory =
  | "VISUAL"
  | "DIMENSIONAL"
  | "MATERIAL"
  | "WELDING"
  | "NDT"
  | "COATING"
  | "PACKAGING"
  | "DOCUMENTATION"
  | "OTHER";

// ═══════════════════════════════════════
// 📋 Core Entities
// ═══════════════════════════════════════

export interface InspectionRequest {
  id: string;
  project_id: string;
  client_id: string;
  contract_id: string;
  vendor_id?: string;
  category: InspectionCategory;
  service_domain: string;
  inspection_mode?: InspectionMode;
  inspection_scope: string;
  inspection_date: string;
  requested_by: string;
  status: InspectionStatus;
  priority: Priority;
  notes?: string;
  related_inspection_id?: string;
  site_representative_id?: string;
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
  created_at: string;
  updated_at: string;
}

export interface DocumentReview {
  id: string;
  inspection_request_id: string;
  document_type: DocumentType;
  document_name: string;
  document_url: string;
  document_number?: string;
  revision?: string;
  review_status: ReviewStatus;
  comments?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  category: ChecklistCategory;
  result?: "PASS" | "FAIL" | "N/A";
  notes?: string;
  checked_by?: string;
  checked_at?: string;
}

export interface Checklist {
  id: string;
  inspection_id: string;
  category: ChecklistCategory;
  checklist_name: string;
  items: ChecklistItem[];
  results?: ChecklistItem[];
  overall_status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  checked_by?: string;
  checked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NonConformity {
  id: string;
  inspection_id: string;
  ncr_number?: string;
  title: string;
  description: string;
  severity: NCRSeverity;
  status: NCRStatus;
  location_found?: string;
  photos: string[];
  corrective_action?: string;
  root_cause?: string;
  preventive_action?: string;
  reported_by?: string;
  assigned_to?: string;
  due_date?: string;
  closed_at?: string;
  closed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionReport {
  id: string;
  inspection_id: string;
  report_type: ReportType;
  report_number?: string;
  report_url: string;
  issued_by: string;
  issued_at: string;
  approved_by?: string;
  approved_at?: string;
  sent_to_client: boolean;
  sent_at?: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  inspection_id: string;
  certificate_type: string;
  certificate_number?: string;
  certificate_url: string;
  issued_by_vendor?: string;
  issue_date?: string;
  expiry_date?: string;
  verified_by_ics: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EngineeringDocument {
  id?: string;
  name: string;
  document_number: string;
  revision: string;
  file_url: string;
  file_name: string;
  file_size: number;
  client_approved: boolean;
  uploaded_at?: string;
}

export type TPIServiceDomain =
  | "General"
  | "Telecommunication"
  | "Architecture"
  | "Piping"
  | "Instrumentation"
  | "Mechanical"
  | "Electrical"
  | "Process"
  | "Welding"
  | "HVAC"
  | "Civil"
  | "Coating"
  | "NDT"
  | "Structure"
  | "Material";

export type MWSServiceDomain =
  | "Load-out"
  | "Transportation - Wet Tow"
  | "Transportation - Dry Tow / Heavy Lift Vessel"
  | "Jacket Installation"
  | "Topside Installation"
  | "Float-over"
  | "Pile Driving"
  | "Subsea Installation"
  | "Cable / Pipeline Lay"
  | "Jack-Up Rig Move"
  | "Crane Vessel Operations"
  | "Anchor Handling"
  | "DP Operations";
