// src/features/inspection-core/domain/types.ts
// ═══════════════════════════════════════
// 🔍 Inspection Core - Shared Domain Types
// ═══════════════════════════════════════

/**
 * هسته مشترک بین ماژول‌های TPI و MWS
 * شامل موجودیت‌ها، تایپ‌ها و وضعیت‌های مشترک
 */

// ═══════════════════════════════════════
// 🎯 وضعیت‌های مشترک
// ═══════════════════════════════════════

export type InspectionRequestStatus =
  | "INITIAL"
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

export type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type ReviewStatus = "INITIAL" | "APPROVED" | "COMMENTED" | "REJECTED";

export type NCRSeverity = "MINOR" | "MAJOR" | "CRITICAL";

export type NCRStatus =
  | "OPEN"
  | "CORRECTIVE_ACTION"
  | "VERIFICATION"
  | "CLOSED";

export type ReportType = "IR" | "IRN" | "SRN";

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
// 🏷️ نوع درخواست (مشترک بین TPI و MWS)
// ═══════════════════════════════════════

export type InspectionCategory = "TPI" | "MWS";

// ═══════════════════════════════════════
// 📋 موجودیت‌های مشترک (Core Entities)
// ═══════════════════════════════════════

/**
 * درخواست بازرسی - موجودیت اصلی که هم TPI و هم MWS از آن استفاده می‌کنند
 */
export interface InspectionRequest {
  id: string;
  project_id: string;
  client_id: string;
  contract_id: string;
  category: InspectionCategory;
  inspection_scope: string;
  inspection_date: string;
  requested_by: string;
  status: InspectionRequestStatus;
  priority: Priority;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * بازرسی اجرایی - پس از انتساب بازرس ایجاد می‌شود
 */
export interface Inspection {
  id: string;
  inspection_request_id: string;
  inspector_id: string;
  assigned_by: string;
  assigned_at: string;
  execution_date?: string;
  location?: string;
  status: InspectionExecutionStatus;
  actual_start_time?: string;
  actual_end_time?: string;
  general_remarks?: string;
  created_at: string;
  updated_at: string;
}

/**
 * بررسی مستندات - مشترک بین هر دو ماژول
 */
export interface DocumentReview {
  id: string;
  inspection_request_id: string;
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

/**
 * آیتم چک‌لیست
 */
export interface ChecklistItem {
  id: string;
  description: string;
  category: ChecklistCategory;
  result?: "PASS" | "FAIL" | "N/A";
  notes?: string;
  checked_by?: string;
  checked_at?: string;
}

/**
 * چک‌لیست بازرسی
 */
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

/**
 * گزارش عدم انطباق (NCR) - مشترک بین هر دو ماژول
 */
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

/**
 * گزارش بازرسی - مشترک بین هر دو ماژول
 */
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

// ═══════════════════════════════════════
// 📦 Command DTOs (برای Application Layer)
// ═══════════════════════════════════════

export interface CreateInspectionRequestCommand {
  project_id: string;
  client_id: string;
  contract_id: string;
  category: InspectionCategory;
  inspection_scope: string;
  inspection_date: string;
  priority: Priority;
  notes?: string;
}

export interface CreateInspectionCommand {
  inspection_request_id: string;
  inspector_id: string;
  assigned_by: string;
  execution_date?: string;
  location?: string;
}

export interface CreateNCRCommand {
  inspection_id: string;
  title: string;
  description: string;
  severity: NCRSeverity;
  location_found?: string;
  photos?: string[];
  reported_by?: string;
}

export interface CreateReportCommand {
  inspection_id: string;
  report_type: ReportType;
  report_url: string;
  issued_by: string;
  issued_at: string;
  sent_to_client?: boolean;
}
