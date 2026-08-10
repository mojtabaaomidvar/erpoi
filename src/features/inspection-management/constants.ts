// src/features/inspection-management/constants.ts

import type {
  InspectionStatus,
  InspectionExecutionStatus,
  ReviewStatus,
  Priority,
  InspectionCategory,
} from "./domain/types";

// src/features/inspection-management/constants/checklistConstants.ts

import type { StatusMetadata, MethodMetadata } from "./domain/checklistTypes";

// ✅ متادیتای وضعیت‌ها
export const STATUS_METADATA: Record<string, StatusMetadata> = {
  PENDING: {
    label: "Pending",
    icon: "○",
    color: "#94A3B8",
    gradient: "from-slate-400 to-slate-500",
    softColor: "rgba(148,163,184,0.15)",
    borderColor: "#CBD5E1",
  },
  PASS: {
    label: "Pass",
    icon: "✓",
    color: "#10B981",
    gradient: "from-emerald-400 to-emerald-600",
    softColor: "rgba(16,185,129,0.15)",
    borderColor: "#10B981",
  },
  REJECT: {
    label: "Reject",
    icon: "✗",
    color: "#EF4444",
    gradient: "from-rose-400 to-rose-600",
    softColor: "rgba(239,68,68,0.15)",
    borderColor: "#EF4444",
  },
  NOTE: {
    label: "Note",
    icon: "!",
    color: "#F59E0B",
    gradient: "from-amber-400 to-amber-600",
    softColor: "rgba(245,158,11,0.15)",
    borderColor: "#F59E0B",
  },
  "N/A": {
    label: "N/A",
    icon: "⊘",
    color: "#6B7280",
    gradient: "from-gray-400 to-gray-500",
    softColor: "rgba(107,114,128,0.15)",
    borderColor: "#9CA3AF",
  },
};

// ✅ متادیتای متدهای بازرسی (رنگ‌ها و آیکون‌ها)
export const METHOD_METADATA: Record<string, MethodMetadata> = {
  "Pre-Inspection Meeting": {
    method: "Pre-Inspection Meeting",
    icon: "📋",
    gradient: "from-blue-500 to-indigo-600",
    color: "#3B82F6",
  },
  "Document Review": {
    method: "Document Review",
    icon: "📄",
    gradient: "from-purple-500 to-pink-600",
    color: "#A855F7",
  },
  "Visual Inspection": {
    method: "Visual Inspection",
    icon: "👁️",
    gradient: "from-cyan-500 to-teal-600",
    color: "#06B6D4",
  },
  "Dimensional Inspection": {
    method: "Dimensional Inspection",
    icon: "📏",
    gradient: "from-orange-500 to-red-600",
    color: "#F97316",
  },
  "Marking / ID Verification": {
    method: "Marking / ID Verification",
    icon: "🏷️",
    gradient: "from-green-500 to-emerald-600",
    color: "#22C55E",
  },
  "Functional Verification": {
    method: "Functional Verification",
    icon: "⚙️",
    gradient: "from-yellow-500 to-orange-600",
    color: "#EAB308",
  },
  "Performance Verification": {
    method: "Performance Verification",
    icon: "📊",
    gradient: "from-pink-500 to-rose-600",
    color: "#EC4899",
  },
  Quantity: {
    method: "Quantity",
    icon: "🔢",
    gradient: "from-indigo-500 to-purple-600",
    color: "#6366F1",
  },
  Sampling: {
    method: "Sampling",
    icon: "🎯",
    gradient: "from-teal-500 to-cyan-600",
    color: "#14B8A6",
  },
  "NDT (PT, MT, ...)": {
    method: "NDT (PT, MT, ...)",
    icon: "🔬",
    gradient: "from-violet-500 to-purple-600",
    color: "#8B5CF6",
  },
  PMI: {
    method: "PMI",
    icon: "🧪",
    gradient: "from-lime-500 to-green-600",
    color: "#84CC16",
  },
  "Hydrostatic Test": {
    method: "Hydrostatic Test",
    icon: "💧",
    gradient: "from-sky-500 to-blue-600",
    color: "#0EA5E9",
  },
  "Laboratory Test": {
    method: "Laboratory Test",
    icon: "🧫",
    gradient: "from-fuchsia-500 to-pink-600",
    color: "#D946EF",
  },
};

// ✅ تابع کمکی برای دریافت متادیتای متد
export const getMethodMetadata = (method: string): MethodMetadata => {
  return (
    METHOD_METADATA[method] || {
      method,
      icon: "🔍",
      gradient: "from-slate-500 to-gray-600",
      color: "#64748B",
    }
  );
};

// ✅ تابع کمکی برای دریافت متادیتای وضعیت
export const getStatusMetadata = (status: string): StatusMetadata => {
  return STATUS_METADATA[status] || STATUS_METADATA.PENDING;
};

// ═══════════════════════════════════════
// 🔍 Shared Inspection Configs
// ═══════════════════════════════════════

// کانفیگ وضعیت‌های درخواست اصلی (TPI Request)
const REQUEST_STATUS_CONFIG: Record<
  InspectionStatus,
  { label: string; color: string; icon: string }
> = {
  NEW: { label: "New", color: "slate", icon: "🆕" },
  INSPECTOR_ASSIGNED: {
    label: "Inspector Assigned",
    color: "blue",
    icon: "👷",
  },
  IN_PROGRESS: { label: "In Progress", color: "indigo", icon: "🔄" },
  INSPECTION_COMPLETED: {
    label: "Inspection Completed",
    color: "emerald",
    icon: "✅",
  },
  REPORT_ISSUED: { label: "Report Issued", color: "cyan", icon: "📄" },
  FOLLOW_UP: { label: "Follow Up", color: "amber", icon: "⏳" },
  CLOSED: { label: "Closed", color: "slate", icon: "🔒" },
  REJECTED: { label: "Rejected", color: "rose", icon: "❌" },
  CANCELLED: { label: "Cancelled", color: "rose", icon: "🚫" },
};

export const INSPECTION_STATUS_CONFIG = REQUEST_STATUS_CONFIG;
export const TPI_REQUEST_STATUS_CONFIG = REQUEST_STATUS_CONFIG;

export const INSPECTION_EXECUTION_STATUS_CONFIG: Record<
  InspectionExecutionStatus,
  { label: string; color: string; icon: string }
> = {
  SCHEDULED: { label: "Scheduled", color: "indigo", icon: "📅" },
  ASSIGNED: { label: "Assigned", color: "indigo", icon: "👷" }, // ✅ اضافه شد
  IN_PROGRESS: { label: "In Progress", color: "indigo", icon: "🔄" },
  COMPLETED: { label: "Completed", color: "emerald", icon: "✅" },
  CANCELLED: { label: "Cancelled", color: "rose", icon: "🚫" },
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
// 🎯 TPI-Specific Configs
// ═══════════════════════════════════════

export const TPI_MODE_CONFIG: Record<string, { label: string; icon: string }> =
  {
    SPOT: { label: "Spot Inspection", icon: "📍" },
    RESIDENT: { label: "Resident Inspection", icon: "🏢" },
  };

export const TPI_CANCELLATION_REASON_CONFIG: Record<
  string,
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
  Others: {
    label: "Other reason",
    icon: "❓",
    color: "slate",
    description: "Please provide details in notes",
  },
};

export const TPI_REPORT_TYPE_CONFIG: Record<
  string,
  { label: string; description: string }
> = {
  IR: { label: "IR", description: "Inspection Report" },
  IRN: { label: "IRN", description: "Inspection Release Note" },
  SRN: { label: "SRN", description: "Shipping Release Note" },
};

export const TPI_DOCUMENT_TYPE_CONFIG: Record<
  string,
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
  Others: { label: "Other", icon: "📁" },
};

// ═══════════════════════════════════════
// 🌊 MWS-Specific Configs
// ═══════════════════════════════════════

export const MWS_CANCELLATION_REASON_CONFIG: Record<
  string,
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
  Others: {
    label: "Other reason",
    icon: "❓",
    color: "slate",
    description: "Please provide details in notes",
  },
};

export const MWS_REPORT_TYPE_CONFIG: Record<
  string,
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
  string,
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
  Others: { label: "Other", icon: "📁" },
};

export const REPORT_TYPE_CONFIG = TPI_REPORT_TYPE_CONFIG;
