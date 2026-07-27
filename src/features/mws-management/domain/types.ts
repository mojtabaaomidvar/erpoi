// src/features/mws-management/domain/types.ts

import type {
  BaseInspectionRequest,
  Inspection,
} from "@/features/inspection-management/domain/types";

// ═══════════════════════════════════════
// 🌊 MWS-Specific Classifications
// ═══════════════════════════════════════

export type MWSDiscipline =
  | "Marine Operations"
  | "Naval Architecture"
  | "Structural / Rigging"
  | "Mooring & Anchoring"
  | "Dynamic Positioning (DP)"
  | "Subsea Operations"
  | "Lifting & Heavy Transport";

export type MWSInspectionStage =
  | "Pre-Mobilization"
  | "Load-out"
  | "Sea-Fastening"
  | "Transit / Tow"
  | "Installation / Hook-up"
  | "Decommissioning"
  | "Other";

export type MWSInspectionMethod =
  | "Marine Document Review"
  | "Visual Inspection (Marine)"
  | "Dimensional Check"
  | "Tension / Load Monitoring"
  | "DP Trial / FMEA Review"
  | "Sea-Fastening Check"
  | "Mooring Pattern Verification"
  | "Weather Window Analysis"
  | "Other";

export type MWSCancellationReason =
  | "WEATHER_DELAY"
  | "VESSEL_UNAVAILABLE"
  | "CLIENT_REQUEST"
  | "SCOPE_CHANGED"
  | "OTHER";

// ✅ انواع مختص MWS
export type MWSReportType =
  | "COA"
  | "AOC"
  | "MWS Report"
  | "Daily Log"
  | "Weather Report";

export type MWSDocumentType =
  | "MWS Plan"
  | "Vessel Certificate"
  | "Rigging Certificate"
  | "Load-out Procedure"
  | "Sea-fastening Calculation"
  | "Mooring Plan"
  | "FMEA"
  | "Other";

// ═══════════════════════════════════════
// 📋 MWS Request Entity
// ═══════════════════════════════════════

export interface MWSRequest extends BaseInspectionRequest {
  category: "MWS";
  vessel_name?: string;
  operation_type: string;

  disciplines: MWSDiscipline[];
  stages: MWSInspectionStage[];
  methods: MWSInspectionMethod[];
  cancellation_reason?: MWSCancellationReason;
}
