// src/features/inspection-management/constants.ts

import type {
  InspectionStatus,
  InspectionExecutionStatus,
  ReviewStatus,
  Priority,
  InspectionCategory,
} from "./domain/types";

import type {
  TPIMode,
  TPICancellationReason,
  TPIReportType,
  TPIDocumentType,
} from "../tpi-management/domain/types";

import type {
  MWSCancellationReason,
  MWSReportType,
  MWSDocumentType,
} from "../mws-management/domain/types";

// ═══════════════════════════════════════
// 🔍 Shared Inspection Configs
// ═══════════════════════════════════════

export const INSPECTION_STATUS_CONFIG: Record<
  InspectionStatus,
  { label: string; color: string; icon: string }
> = {
  NEW: { label: "New", color: "slate", icon: "🆕" },
  INSPECTOR_ASSIGNED: {
    label: "Inspector Assigned",
    color: "blue",
    icon: "👷",
  },
  INSPECTION_COMPLETED: {
    label: "Inspection Completed",
    color: "indigo",
    icon: "✅",
  },
  REPORT_ISSUED: {
    label: "Report Issued",
    color: "emerald",
    icon: "📄",
  },
  FOLLOW_UP: {
    label: "Follow Up",
    color: "amber",
    icon: "⏳",
  },
  CLOSED: { label: "Closed", color: "slate", icon: "🔒" },
  REJECTED: { label: "Rejected", color: "rose", icon: "❌" },
};

export const INSPECTION_EXECUTION_STATUS_CONFIG: Record<
  InspectionExecutionStatus,
  { label: string; color: string; icon: string }
> = {
  SCHEDULED: { label: "Scheduled", color: "blue", icon: "📅" },
  IN_PROGRESS: { label: "In Progress", color: "indigo", icon: "🔄" },
  COMPLETED: { label: "Completed", color: "emerald", icon: "✓" },
  CANCELLED: { label: "Cancelled", color: "slate", icon: "⊘" },
};

export const TPI_REQUEST_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  NEW: {
    label: "New",
    color: "slate",
    icon: "🆕",
  },
  INSPECTOR_ASSIGNED: {
    label: "Inspector Assigned",
    color: "blue",
    icon: "👷",
  },
  INSPECTION_COMPLETED: {
    label: "Inspection Completed",
    color: "indigo",
    icon: "✅",
  },
  REPORT_ISSUED: {
    label: "Report Issued",
    color: "emerald",
    icon: "📄",
  },
  FOLLOW_UP: {
    label: "Follow Up",
    color: "amber",
    icon: "⏳",
  },
  COMPLETED: {
    label: "Completed",
    color: "indigo",
    icon: "✅",
  },
};

export const REVIEW_STATUS_CONFIG: Record<
  ReviewStatus,
  { label: string; color: string; icon: string }
> = {
  INITIAL: { label: "Initial", color: "slate", icon: "📝" },
  APPROVED: { label: "Approved", color: "emerald", icon: "✅" },
  COMMENTED: { label: "Commented", color: "blue", icon: "💬" },
  REJECTED: { label: "Rejected", color: "rose", icon: "❌" },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; icon: string }
> = {
  LOW: { label: "Low", color: "slate", icon: "🔽" },
  NORMAL: { label: "Normal", color: "blue", icon: "➡️" },
  HIGH: { label: "High", color: "orange", icon: "⚠️" },
  URGENT: { label: "Urgent", color: "rose", icon: "🚨" },
};

export const INSPECTION_CATEGORY_CONFIG: Record<
  InspectionCategory,
  { label: string; icon: string; color: string }
> = {
  TPI: { label: "Third Party Inspection (TPI)", icon: "🏭", color: "indigo" },
  MWS: { label: "Marine Warranty Survey (MWS)", icon: "🚢", color: "emerald" },
};

// ═══════════════════════════════════════
// 🎯 TPI-Specific Configs & Options
// ═══════════════════════════════════════

export const TPI_MODE_CONFIG: Record<TPIMode, { label: string; icon: string }> =
  {
    SPOT: { label: "Spot Inspection", icon: "📍" },
    RESIDENT: { label: "Resident Inspection", icon: "🏢" },
  };

export const TPI_CANCELLATION_REASON_CONFIG: Record<
  TPICancellationReason,
  { label: string; icon: string; color: string; description: string }
> = {
  REASSIGNED: {
    label: "Reassigned to another inspection",
    icon: "🔀",
    color: "indigo",
    description: "Inspector was reassigned to a different inspection",
  },
  CLIENT_REQUEST: {
    label: "Client request",
    icon: "👤",
    color: "blue",
    description: "Client requested cancellation or rescheduling",
  },
  VENDOR_UNAVAILABLE: {
    label: "Vendor unavailable",
    icon: "🏭",
    color: "amber",
    description: "Vendor site or facility was not available",
  },
  SCOPE_CHANGED: {
    label: "Scope changed",
    icon: "📝",
    color: "purple",
    description: "Inspection scope was modified",
  },
  OTHER: {
    label: "Other reason",
    icon: "❓",
    color: "slate",
    description: "Please provide details in notes",
  },
};

export const TPI_REPORT_TYPE_CONFIG: Record<
  TPIReportType,
  { label: string; description: string }
> = {
  IR: { label: "IR", description: "Inspection Report" },
  IRN: { label: "IRN", description: "Inspection Release Note" },
  SRN: { label: "SRN", description: "Shipping Release Note" },
};

export const TPI_DOCUMENT_TYPE_CONFIG: Record<
  TPIDocumentType,
  { label: string; icon: string }
> = {
  ITP: { label: "ITP", icon: "📋" },
  QCP: { label: "QCP", icon: "✅" },
  Procedure: { label: "Procedure", icon: "📄" },
  Drawing: { label: "Drawing", icon: "📐" },
  MTC: { label: "MTC", icon: "📜" },
  Calibration: { label: "Calibration", icon: "⚖️" },
  "WPS/PQR": { label: "WPS/PQR", icon: "🔥" },
  "NDT Report": { label: "NDT Report", icon: "🔍" },
  Other: { label: "Other", icon: "📁" },
};

// ═══════════════════════════════════════
// 🌊 MWS-Specific Configs & Options
// ═══════════════════════════════════════

export const MWS_CANCELLATION_REASON_CONFIG: Record<
  MWSCancellationReason,
  { label: string; icon: string; color: string; description: string }
> = {
  WEATHER_DELAY: {
    label: "Weather Delay",
    icon: "🌧️",
    color: "blue",
    description: "Operation cancelled due to adverse weather conditions",
  },
  VESSEL_UNAVAILABLE: {
    label: "Vessel Unavailable",
    icon: "🚢",
    color: "amber",
    description: "Assigned vessel is not available or delayed",
  },
  CLIENT_REQUEST: {
    label: "Client request",
    icon: "👤",
    color: "blue",
    description: "Client requested cancellation or rescheduling",
  },
  SCOPE_CHANGED: {
    label: "Scope changed",
    icon: "📝",
    color: "purple",
    description: "Marine operation scope was modified",
  },
  OTHER: {
    label: "Other reason",
    icon: "❓",
    color: "slate",
    description: "Please provide details in notes",
  },
};

export const MWS_REPORT_TYPE_CONFIG: Record<
  MWSReportType,
  { label: string; description: string }
> = {
  COA: { label: "COA", description: "Certificate of Approval" },
  AOC: { label: "AOC", description: "Approval of Condition" },
  "MWS Report": {
    label: "MWS Report",
    description: "Marine Warranty Survey Report",
  },
  "Daily Log": {
    label: "Daily Log",
    description: "Daily Marine Operations Log",
  },
  "Weather Report": {
    label: "Weather Report",
    description: "Meteorological Conditions Report",
  },
};

export const MWS_DOCUMENT_TYPE_CONFIG: Record<
  MWSDocumentType,
  { label: string; icon: string }
> = {
  "MWS Plan": { label: "MWS Plan", icon: "📋" },
  "Vessel Certificate": { label: "Vessel Certificate", icon: "🚢" },
  "Rigging Certificate": { label: "Rigging Certificate", icon: "⚓" },
  "Load-out Procedure": { label: "Load-out Procedure", icon: "📄" },
  "Sea-fastening Calculation": {
    label: "Sea-fastening Calculation",
    icon: "📐",
  },
  "Mooring Plan": { label: "Mooring Plan", icon: "🗺️" },
  FMEA: { label: "FMEA", icon: "⚠️" },
  Other: { label: "Other", icon: "📁" },
};

export const REPORT_TYPE_CONFIG = TPI_REPORT_TYPE_CONFIG;
