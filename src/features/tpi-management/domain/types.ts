// src/features/tpi-management/domain/types.ts

import type { BaseInspectionRequest } from "@/features/inspection-management/domain/types";

// ═══════════════════════════════════════
// 🎯 TPI-Specific Classifications
// ═══════════════════════════════════════

export type TPIMode = "SPOT" | "RESIDENT";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

// ═══════════════════════════════════════
// 🎯 TPI Core Classifications
// ═══════════════════════════════════════

export type TPIDiscipline =
  | "General"
  | "Mechanical"
  | "Dimensional"
  | "Welding"
  | "Paint & Coating"
  | "Civil"
  | "Piping"
  | "Electrical"
  | "Instrumentation"
  | "Structure"
  | "Process"
  | "Safety"
  | "Material"
  | "HVAC"
  | "Architecture"
  | "Telecommunication";

export type TPIInspectionStage =
  | "In-Process"
  | "Final Inspection"
  | "Pre-Shipment"
  | "Other";

export type TPIInspectionMethod =
  | "Pre-Inspection Meeting"
  | "Document Review"
  | "Visual Inspection"
  | "Dimensional Inspection"
  | "Marking / ID Verification"
  | "Functional Verification"
  | "Performance Verification"
  | "Quantity"
  | "Sampling"
  | "NDT (PT, MT, ...)"
  | "PMI"
  | "Laboratory Test"
  | "Hydrostatic Test"
  | "Other";

export const TPI_DISCIPLINE_OPTIONS: TPIDiscipline[] = [
  "General",
  "Mechanical",
  "Dimensional",
  "Welding",
  "Paint & Coating",
  "Civil",
  "Piping",
  "Electrical",
  "Instrumentation",
  "Structure",
  "Process",
  "Safety",
  "Material",
  "HVAC",
  "Architecture",
  "Telecommunication",
];

export const TPI_INSPECTION_STAGE_OPTIONS: TPIInspectionStage[] = [
  "In-Process",
  "Final Inspection",
  "Pre-Shipment",
  "Other",
];

export const TPI_INSPECTION_METHOD_OPTIONS: TPIInspectionMethod[] = [
  "Pre-Inspection Meeting",
  "Document Review",
  "Visual Inspection",
  "Dimensional Inspection",
  "Marking / ID Verification",
  "Functional Verification",
  "Performance Verification",
  "Quantity",
  "Sampling",
  "NDT (PT, MT, ...)",
  "PMI",
  "Laboratory Test",
  "Hydrostatic Test",
  "Other",
];

export type TPICancellationReason =
  | "REASSIGNED"
  | "CLIENT_REQUEST"
  | "VENDOR_UNAVAILABLE"
  | "SCOPE_CHANGED"
  | "OTHER";

export type TPIReportType = "IR" | "IRN" | "SRN";

export type TPIDocumentType =
  | "ITP"
  | "QCP"
  | "Procedure"
  | "Drawing"
  | "MTC"
  | "Calibration"
  | "WPS/PQR"
  | "NDT Report"
  | "Other";

// ═══════════════════════════════════════
// 🏭 Vendor
// ═══════════════════════════════════════

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

// ═══════════════════════════════════════
// 🏢 TPI Resident Entities
// ═══════════════════════════════════════

export interface ResidentInspection {
  id: string;
  tpi_request_id: string;
  site_representative_id: string;
  start_date: string;
  end_date?: string;
  disciplines: string[];
  status: "ACTIVE" | "COMPLETED" | "SUSPENDED";
  created_at: string;
  updated_at: string;
}

export interface MonthlyReport {
  id: string;
  resident_inspection_id: string;
  report_month: string;
  report_year: number;
  summary: string;
  achievements: string;
  issues: string;
  recommendations: string;
  submitted_by: string;
  submitted_at: string;
  approved_by?: string;
  approved_at?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InspectorAttendance {
  id: string;
  resident_inspection_id: string;
  inspector_id: string;
  discipline: string;
  attendance_date: string;
  status: AttendanceStatus;
  hours_worked?: number;
  notes?: string;
  recorded_by: string;
  created_at: string;
}

export interface MonthlyAttendanceSummary {
  inspector_id: string;
  inspector_name: string;
  discipline: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  attendance_percentage: number;
}

// ═══════════════════════════════════════
// 📋 TPI Request Entity
// ═══════════════════════════════════════

export interface TPIRequest extends BaseInspectionRequest {
  category: "TPI";
  tpi_mode: TPIMode;

  vendor_id?: string;
  site_representative_id?: string;

  disciplines: TPIDiscipline[];
  stages: TPIInspectionStage[];
  methods: TPIInspectionMethod[];
  cancellation_reason?: TPICancellationReason;
}

// ═══════════════════════════════════════
// 📦 Inspection Items
// ═══════════════════════════════════════

export type InspectionItemSourceType = "MANUAL" | "UPLOAD";
export type SourceFileType = "PACKING_LIST" | "MTO" | "OTHER";

export interface InspectionItem {
  id: string;
  tpi_request_id: string;
  item_name: string;
  tag_number?: string;
  description?: string;
  quantity: number;
  unit: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  source_type: InspectionItemSourceType;
  source_file_url?: string;
  source_file_name?: string;
  row_index: number;
  created_at: string;
  updated_at: string;
}

export interface SourceFile {
  id: string;
  tpi_request_id: string;
  file_name: string;
  file_url: string;
  file_type: SourceFileType;
  file_size?: number;
  uploaded_by?: string;
  uploaded_at: string;
}
