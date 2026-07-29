// src/features/mws-management/domain/types.ts

import type {
  BaseInspectionRequest,
  Inspection,
} from "@/features/inspection-management/domain/types";

// ═══════════════════════════════════════
// 🌊 MWS-Specific Classifications
// ═══════════════════════════════════════

export type MWSDiscipline = string;
export type MWSInspectionStage = string;
export type MWSInspectionMethod = string;
export type MWSCancellationReason = string;
export type MWSReportType = string;
export type MWSDocumentType = string;

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
