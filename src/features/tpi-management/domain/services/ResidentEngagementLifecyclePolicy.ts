// src/features/tpi-management/domain/services/ResidentEngagementLifecyclePolicy.ts

import type {
  ResidentEngagement,
  ResidentEngagementStatus,
} from "../models/ResidentEngagement";

/** Pure state-machine rules for the Resident mode of a TPI engagement. */
export class ResidentEngagementLifecyclePolicy {
  private static readonly ALLOWED_TRANSITIONS: Record<
    ResidentEngagementStatus,
    ResidentEngagementStatus[]
  > = {
    DRAFT: ["PLANNED", "CANCELLED"],
    PLANNED: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["SUSPENDED", "COMPLETED"],
    SUSPENDED: ["ACTIVE", "CANCELLED"],
    COMPLETED: ["CLOSED"],
    CLOSED: [],
    CANCELLED: [],
  };

  static canTransition(
    current: ResidentEngagementStatus,
    target: ResidentEngagementStatus,
  ): boolean {
    return this.ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
  }

  static assertTransition(
    current: ResidentEngagementStatus,
    target: ResidentEngagementStatus,
  ): void {
    if (!this.canTransition(current, target)) {
      throw new Error(
        `Invalid engagement status transition: ${current} → ${target}`,
      );
    }
  }

  static isActivatable(engagement: ResidentEngagement): boolean {
    return (
      engagement.status === "PLANNED" &&
      !!engagement.planned_start_date &&
      engagement.planned_start_date.length > 0
    );
  }

  static isSuspendable(engagement: ResidentEngagement): boolean {
    return engagement.status === "ACTIVE";
  }

  static isCompletable(engagement: ResidentEngagement): boolean {
    return engagement.status === "ACTIVE";
  }

  static isClosable(engagement: ResidentEngagement): boolean {
    return engagement.status === "COMPLETED";
  }
}
