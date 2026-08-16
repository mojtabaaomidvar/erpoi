// src/features/tpi-management/domain/models/TPIEngagement.ts

/**
 * Canonical TPI Engagement domain model.
 *
 * This is the unified root aggregate for the TPI bounded context.
 * It uses a discriminated union to represent SPOT and RESIDENT modes
 * while preserving mode-specific business richness.
 *
 * SPOT mode  → short-term / one-off inspections (wraps TPIRequest + sessions)
 * RESIDENT mode → continuous/ongoing TPI work (wraps ResidentEngagement + sub-entities)
 */

import type { TPIRequest } from "../types";
import type { ResidentEngagement } from "./ResidentEngagement";

// ---------------------------------------------------------------------------
// TPI Engagement Mode
// ---------------------------------------------------------------------------

export type TPIEngagementMode = "SPOT" | "RESIDENT";

// ---------------------------------------------------------------------------
// Common TPI Engagement Summary
// ---------------------------------------------------------------------------

/**
 * Common fields shared across all TPI engagement modes.
 * Used for list views and cross-mode queries.
 */
export interface TPIEngagementSummary {
  readonly id: string;
  readonly mode: TPIEngagementMode;
  readonly projectId: string;
  readonly clientId: string;
  readonly contractId: string;
  /** Display label — for SPOT derived from category + disciplines; for RESIDENT from title. */
  readonly displayLabel: string;
  readonly status: string;
  readonly priority: string;
  readonly plannedStartDate?: string;
  readonly plannedEndDate?: string;
  readonly actualStartDate?: string;
  readonly actualEndDate?: string;
  readonly leadInspectorId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ---------------------------------------------------------------------------
// SPOT Engagement
// ---------------------------------------------------------------------------

/**
 * SPOT mode engagement — wraps the existing TPIRequest aggregate.
 *
 * A SPOT engagement represents a short-term or one-off inspection request
 * with associated sessions, inspectors, documents, checklists, NCRs, and reports.
 */
export interface TPIEngagementSpot {
  readonly mode: "SPOT";
  readonly request: TPIRequest;
}

// ---------------------------------------------------------------------------
// RESIDENT Engagement
// ---------------------------------------------------------------------------

/**
 * RESIDENT mode engagement — wraps the existing ResidentEngagement aggregate.
 *
 * A RESIDENT engagement represents continuous/ongoing TPI work with
 * assignments, daily activities, man-days, quality issues, corrective actions,
 * ITP monitoring, lookahead activities, periodic reports, closeout, and evidence.
 */
export interface TPIEngagementResident {
  readonly mode: "RESIDENT";
  readonly engagement: ResidentEngagement;
}

// ---------------------------------------------------------------------------
// Canonical TPI Engagement (Discriminated Union)
// ---------------------------------------------------------------------------

/**
 * The canonical TPI engagement type.
 *
 * Use the `mode` discriminant to narrow:
 *   if (engagement.mode === "SPOT")    → engagement.request
 *   if (engagement.mode === "RESIDENT") → engagement.engagement
 */
export type TPIEngagement = TPIEngagementSpot | TPIEngagementResident;

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

export function createSpotEngagement(request: TPIRequest): TPIEngagementSpot {
  return { mode: "SPOT", request };
}

export function createResidentEngagement(
  engagement: ResidentEngagement,
): TPIEngagementResident {
  return { mode: "RESIDENT", engagement };
}

// ---------------------------------------------------------------------------
// Projection helpers
// ---------------------------------------------------------------------------

/**
 * Extract a common summary from any TPI engagement, regardless of mode.
 * Useful for list views, dashboards, and cross-mode operations.
 */
function buildSpotDisplayLabel(request: TPIRequest): string {
  const disciplines = request.disciplines?.length
    ? request.disciplines.join(", ")
    : "TPI";
  return `${request.category} — ${disciplines}`;
}

export function toEngagementSummary(
  engagement: TPIEngagement,
): TPIEngagementSummary {
  if (engagement.mode === "SPOT") {
    const r = engagement.request;
    return {
      id: r.id,
      mode: "SPOT",
      projectId: r.project_id,
      clientId: r.client_id,
      contractId: r.contract_id,
      displayLabel: buildSpotDisplayLabel(r),
      status: r.status,
      priority: r.priority,
      plannedStartDate: r.inspection_date,
      plannedEndDate: undefined,
      actualStartDate: undefined,
      actualEndDate: undefined,
      leadInspectorId: undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  const e = engagement.engagement;
  return {
    id: e.id,
    mode: "RESIDENT",
    projectId: e.project_id,
    clientId: e.client_id ?? "",
    contractId: e.contract_id ?? "",
    displayLabel: e.title ?? "",
    status: e.status,
    priority: "NORMAL",
    plannedStartDate: e.planned_start_date,
    plannedEndDate: e.planned_end_date,
    actualStartDate: e.actual_start_date,
    actualEndDate: e.actual_end_date,
    leadInspectorId: e.lead_inspector_id,
    createdAt: e.created_at ?? "",
    updatedAt: e.updated_at ?? "",
  };
}

/**
 * Get the display status for any TPI engagement.
 */
export function getEngagementStatus(engagement: TPIEngagement): string {
  return engagement.mode === "SPOT"
    ? engagement.request.status
    : engagement.engagement.status;
}

/**
 * Get the mode discriminator from an engagement ID convention.
 * Returns undefined if the ID doesn't follow known conventions.
 */
export function inferModeFromId(id: string): TPIEngagementMode | undefined {
  if (id.startsWith("tpi_req_")) return "SPOT";
  if (id.startsWith("res_eng_")) return "RESIDENT";
  return undefined;
}
