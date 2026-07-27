// src/features/inspection-core/domain/services/WorkflowService.ts
// ═══════════════════════════════════════
// 🔄 State Machine برای گردش کار بازرسی
// ═══════════════════════════════════════

import type {
  InspectionRequestStatus,
  InspectionExecutionStatus,
} from "../types";

/**
 * گردش کار مجاز بین وضعیت‌های درخواست بازرسی
 */
const REQUEST_TRANSITIONS: Record<
  InspectionRequestStatus,
  InspectionRequestStatus[]
> = {
  INITIAL: ["DOCUMENT_REVIEW", "APPROVED", "REJECTED"],
  DOCUMENT_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["IN_PROGRESS", "REJECTED"],
  IN_PROGRESS: ["COMPLETED", "REJECTED"],
  COMPLETED: [],
  REJECTED: ["INITIAL"],
};

/**
 * گردش کار مجاز بین وضعیت‌های اجرای بازرسی
 */
const EXECUTION_TRANSITIONS: Record<
  InspectionExecutionStatus,
  InspectionExecutionStatus[]
> = {
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["SCHEDULED"],
};

/**
 * سرویس مدیریت گردش کار بازرسی
 * مسئولیت: اعتبارسنجی انتقال وضعیت‌ها
 */
export class WorkflowService {
  // ═══════════════════════════════════════
  // 📋 Request Workflow
  // ═══════════════════════════════════════

  static canTransitionRequest(
    currentStatus: InspectionRequestStatus,
    newStatus: InspectionRequestStatus,
  ): boolean {
    const allowed = REQUEST_TRANSITIONS[currentStatus] || [];
    return allowed.includes(newStatus);
  }

  static getNextRequestStates(
    currentStatus: InspectionRequestStatus,
  ): InspectionRequestStatus[] {
    return REQUEST_TRANSITIONS[currentStatus] || [];
  }

  static transitionRequest(
    currentStatus: InspectionRequestStatus,
    newStatus: InspectionRequestStatus,
  ): InspectionRequestStatus {
    if (!this.canTransitionRequest(currentStatus, newStatus)) {
      throw new Error(
        "Invalid request transition: " + currentStatus + " -> " + newStatus,
      );
    }
    return newStatus;
  }

  // ═══════════════════════════════════════
  // 🔧 Execution Workflow
  // ═══════════════════════════════════════

  static canTransitionExecution(
    currentStatus: InspectionExecutionStatus,
    newStatus: InspectionExecutionStatus,
  ): boolean {
    const allowed = EXECUTION_TRANSITIONS[currentStatus] || [];
    return allowed.includes(newStatus);
  }

  static getNextExecutionStates(
    currentStatus: InspectionExecutionStatus,
  ): InspectionExecutionStatus[] {
    return EXECUTION_TRANSITIONS[currentStatus] || [];
  }

  static transitionExecution(
    currentStatus: InspectionExecutionStatus,
    newStatus: InspectionExecutionStatus,
  ): InspectionExecutionStatus {
    if (!this.canTransitionExecution(currentStatus, newStatus)) {
      throw new Error(
        "Invalid execution transition: " + currentStatus + " -> " + newStatus,
      );
    }
    return newStatus;
  }

  // ═══════════════════════════════════════
  // 🎯 Helper Methods
  // ═══════════════════════════════════════

  /**
   * بررسی اینکه آیا درخواست در وضعیت نهایی است
   */
  static isRequestFinal(status: InspectionRequestStatus): boolean {
    return status === "COMPLETED" || status === "REJECTED";
  }

  /**
   * بررسی اینکه آیا اجرا در وضعیت نهایی است
   */
  static isExecutionFinal(status: InspectionExecutionStatus): boolean {
    return status === "COMPLETED" || status === "CANCELLED";
  }
}
