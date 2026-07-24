// src/features/inspection-management/constants.ts

import type {
  InspectionStatus,
  InspectionExecutionStatus,
  DocumentType,
  ReviewStatus,
  ReportType,
  NCRSeverity,
  NCRStatus,
  ChecklistCategory,
  Priority,
  InspectionCategory,
  InspectionMode,
  TPIServiceDomain,
  MWSServiceDomain,
} from "./domain/types";

export const INSPECTION_STATUS_CONFIG: Record<
  InspectionStatus,
  { label: string; color: string; icon: string }
> = {
  PENDING: { label: "Pending", color: "amber", icon: "⏳" },
  DOCUMENT_REVIEW: { label: "Document Review", color: "blue", icon: "📄" },
  APPROVED: { label: "Approved", color: "emerald", icon: "✅" },
  IN_PROGRESS: { label: "In Progress", color: "indigo", icon: "" },
  COMPLETED: { label: "Completed", color: "slate", icon: "✓" },
  REJECTED: { label: "Rejected", color: "rose", icon: "" },
};

export const INSPECTION_EXECUTION_STATUS_CONFIG: Record<
  InspectionExecutionStatus,
  { label: string; color: string; icon: string }
> = {
  SCHEDULED: { label: "Scheduled", color: "blue", icon: "📅" },
  IN_PROGRESS: { label: "In Progress", color: "indigo", icon: "" },
  COMPLETED: { label: "Completed", color: "emerald", icon: "✓" },
  CANCELLED: { label: "Cancelled", color: "slate", icon: "⊘" },
};

export const DOCUMENT_TYPE_CONFIG: Record<
  DocumentType,
  { label: string; icon: string }
> = {
  ITP: { label: "ITP", icon: "📋" },
  PROCEDURE: { label: "Procedure", icon: "" },
  CERTIFICATE: { label: "Certificate", icon: "📜" },
  DRAWING: { label: "Drawing", icon: "📐" },
  OTHER: { label: "Other", icon: "" },
};

export const REVIEW_STATUS_CONFIG: Record<
  ReviewStatus,
  { label: string; color: string; icon: string }
> = {
  PENDING: { label: "Pending", color: "amber", icon: "⏳" },
  APPROVED: { label: "Approved", color: "emerald", icon: "✅" },
  COMMENTED: { label: "Commented", color: "blue", icon: "💬" },
  REJECTED: { label: "Rejected", color: "rose", icon: "❌" },
};

export const REPORT_TYPE_CONFIG: Record<
  ReportType,
  { label: string; description: string }
> = {
  IR: { label: "IR", description: "Inspection Report" },
  IRN: { label: "IRN", description: "Inspection Release  Note" },
  SRN: { label: "SRN", description: "Shipping Release  Note" },
};

export const NCR_SEVERITY_CONFIG: Record<
  NCRSeverity,
  { label: string; color: string; priority: number }
> = {
  MINOR: { label: "Minor", color: "amber", priority: 1 },
  MAJOR: { label: "Major", color: "orange", priority: 2 },
  CRITICAL: { label: "Critical", color: "rose", priority: 3 },
};

export const NCR_STATUS_CONFIG: Record<
  NCRStatus,
  { label: string; color: string; icon: string }
> = {
  OPEN: { label: "Open", color: "rose", icon: "⚠️" },
  CORRECTIVE_ACTION: { label: "Corrective Action", color: "blue", icon: "🔧" },
  VERIFICATION: { label: "Verification", color: "indigo", icon: "✓" },
  CLOSED: { label: "Closed", color: "emerald", icon: "✅" },
};

export const CHECKLIST_CATEGORY_CONFIG: Record<
  ChecklistCategory,
  { label: string; icon: string }
> = {
  VISUAL: { label: "Visual Inspection", icon: "👁️" },
  DIMENSIONAL: { label: "Dimensional Check", icon: "📏" },
  MATERIAL: { label: "Material Verification", icon: "" },
  WELDING: { label: "Welding Inspection", icon: "🔥" },
  NDT: { label: "NDT", icon: "" },
  COATING: { label: "Coating Inspection", icon: "🎨" },
  PACKAGING: { label: "Packaging", icon: "📦" },
  DOCUMENTATION: { label: "Documentation", icon: "📑" },
  OTHER: { label: "Other", icon: "📋" },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; icon: string }
> = {
  LOW: { label: "Low", color: "", icon: "🔽" },
  NORMAL: { label: "Normal", color: "blue", icon: "➡️" },
  HIGH: { label: "High", color: "orange", icon: "️" },
  URGENT: { label: "Urgent", color: "rose", icon: "🚨" },
};

export const INSPECTION_CATEGORY_CONFIG: Record<
  InspectionCategory,
  { label: string; icon: string; color: string }
> = {
  TPI: { label: "Third Party Inspection (TPI)", icon: "🏭", color: "indigo" },
  MWS: { label: "Marine Warranty Survey (MWS)", icon: "🚢", color: "emerald" },
};

export const INSPECTION_MODE_CONFIG: Record<
  InspectionMode,
  { label: string; icon: string }
> = {
  SPOT: { label: "Spot / Occasional Inspection", icon: "📍" },
  RESIDENT: { label: "Resident Inspection", icon: "🏢" },
};

export const TPI_DOMAINS: TPIServiceDomain[] = [
  "General",
  "Telecommunication",
  "Architecture",
  "Piping",
  "Instrumentation",
  "Mechanical",
  "Electrical",
  "Process",
  "Welding",
  "HVAC",
  "Civil",
  "Coating",
  "NDT",
  "Structure",
  "Material",
];

export const MWS_DOMAINS: MWSServiceDomain[] = [
  "Load-out",
  "Transportation - Wet Tow",
  "Transportation - Dry Tow / Heavy Lift Vessel",
  "Jacket Installation",
  "Topside Installation",
  "Float-over",
  "Pile Driving",
  "Subsea Installation",
  "Cable / Pipeline Lay",
  "Jack-Up Rig Move",
  "Crane Vessel Operations",
  "Anchor Handling",
  "DP Operations",
];
