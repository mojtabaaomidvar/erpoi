// src/features/tpi-management/domain/services/TPIEngagementLifecyclePolicy.ts

import type { TPIEngagement } from "../models/TPIEngagement";
import type { InspectionStatus } from "@/features/inspection-management/domain/types";
import type { ResidentEngagementStatus } from "../models/ResidentEngagement";
import { ResidentEngagementLifecyclePolicy } from "./ResidentEngagementLifecyclePolicy";

// ---------------------------------------------------------------------------
// SPOT lifecycle (mirrors InspectionStatus state machine)
// ---------------------------------------------------------------------------

const SPOT_ALLOWED_TRANSITIONS: Record<InspectionStatus, InspectionStatus[]> = {
  NEW: ["INSPECTOR_ASSIGNED", "CANCELLED"],
  INSPECTOR_ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["INSPECTION_COMPLETED", "CANCELLED"],
  INSPECTION_COMPLETED: ["REPORT_ISSUED"],
  REPORT_ISSUED: ["FOLLOW_UP", "CLOSED"],
  FOLLOW_UP: ["CLOSED"],
  CLOSED: [],
  REJECTED: [],
  CANCELLED: [],
};

// ---------------------------------------------------------------------------
// Unified status type
// ---------------------------------------------------------------------------

/** Union of all possible TPI engagement statuses across modes. */
export type TPIEngagementStatus = InspectionStatus | ResidentEngagementStatus;

// ---------------------------------------------------------------------------
// TPIEngagementLifecyclePolicy
// ---------------------------------------------------------------------------

/**
 * Unified lifecycle policy for the canonical TPIEngagement.
 *
 * Routes transition validation to the appropriate mode-specific policy:
 * - SPOT   → local SPOT_ALLOWED_TRANSITIONS (based on InspectionStatus)
 * - RESIDENT → ResidentEngagementLifecyclePolicy (delegated)
 *
 * Pure functions, no side effects — deterministic domain logic.
 */
export class TPIEngagementLifecyclePolicy {
  // ── Queries ──────────────────────────────────────────────────────────────

  static canTransition(
    engagement: TPIEngagement,
    targetStatus: TPIEngagementStatus,
  ): boolean {
    if (engagement.mode === "SPOT") {
      const current = engagement.request.status as InspectionStatus;
      return (
        SPOT_ALLOWED_TRANSITIONS[current]?.includes(
          targetStatus as InspectionStatus,
        ) ?? false
      );
    }

    // RESIDENT — delegate to existing policy
    const current = engagement.engagement.status as ResidentEngagementStatus;
    return ResidentEngagementLifecyclePolicy.canTransition(
      current,
      targetStatus as ResidentEngagementStatus,
    );
  }

  static assertTransition(
    engagement: TPIEngagement,
    targetStatus: TPIEngagementStatus,
  ): void {
    if (!this.canTransition(engagement, targetStatus)) {
      const current = this.getCurrentStatus(engagement);
      throw new Error(
        `Invalid TPI engagement status transition: ${current} → ${targetStatus} (mode: ${engagement.mode})`,
      );
    }
  }

  // ── Status extraction ────────────────────────────────────────────────────

  static getCurrentStatus(engagement: TPIEngagement): string {
    return engagement.mode === "SPOT"
      ? engagement.request.status
      : engagement.engagement.status;
  }

  // ── Mode-specific guards ─────────────────────────────────────────────────

  /** RESIDENT: can only become ACTIVE once it has a planned window. */
  static isActivatable(engagement: TPIEngagement): boolean {
    if (engagement.mode !== "RESIDENT") return false;
    return ResidentEngagementLifecyclePolicy.isActivatable(
      engagement.engagement,
    );
  }

  /** RESIDENT: suspension is only meaningful from ACTIVE. */
  static isSuspendable(engagement: TPIEngagement): boolean {
    if (engagement.mode !== "RESIDENT") return false;
    return ResidentEngagementLifecyclePolicy.isSuspendable(
      engagement.engagement,
    );
  }

  /** RESIDENT: completion requires an active engagement. */
  static isCompletable(engagement: TPIEngagement): boolean {
    if (engagement.mode !== "RESIDENT") return false;
    return ResidentEngagementLifecyclePolicy.isCompletable(
      engagement.engagement,
    );
  }

  /** RESIDENT: closure is the terminal step after completion. */
  static isClosable(engagement: TPIEngagement): boolean {
    if (engagement.mode !== "RESIDENT") return false;
    return ResidentEngagementLifecyclePolicy.isClosable(engagement.engagement);
  }

  // ── Introspection ────────────────────────────────────────────────────────

  /** Returns the list of valid next statuses for a given engagement. */
  static getAllowedNextStatuses(
    engagement: TPIEngagement,
  ): TPIEngagementStatus[] {
    if (engagement.mode === "SPOT") {
      const current = engagement.request.status as InspectionStatus;
      return [...(SPOT_ALLOWED_TRANSITIONS[current] ?? [])];
    }

    const current = engagement.engagement.status as ResidentEngagementStatus;
    // Reflect over the resident policy's allowed transitions
    const residentTransitions: Record<string, ResidentEngagementStatus[]> = {
      DRAFT: ["PLANNED", "CANCELLED"],
      PLANNED: ["ACTIVE", "CANCELLED"],
      ACTIVE: ["SUSPENDED", "COMPLETED"],
      SUSPENDED: ["ACTIVE", "CANCELLED"],
      COMPLETED: ["CLOSED"],
      CLOSED: [],
      CANCELLED: [],
    };
    return [...(residentTransitions[current] ?? [])];
  }
}
