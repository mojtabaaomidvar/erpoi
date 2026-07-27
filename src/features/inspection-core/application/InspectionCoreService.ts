// src/features/inspection-core/application/InspectionCoreService.ts
// ═══════════════════════════════════════
// 🎯 Inspection Core Application Service
// ═══════════════════════════════════════

import type {
  InspectionRequest,
  Inspection,
  DocumentReview,
  Checklist,
  NonConformity,
  InspectionReport,
  InspectionRequestStatus,
  InspectionExecutionStatus,
} from "../domain/types";
import { WorkflowService } from "../domain/services/WorkflowService";

/**
 * سرویس مرکزی برای عملیات مشترک بین TPI و MWS
 * این سرویس در آینده با Repository های واقعی جایگزین می‌شود
 */
export class InspectionCoreService {
  // ═══════════════════════════════════════
  // 🔄 Workflow Operations
  // ═══════════════════════════════════════

  /**
   * انتقال وضعیت درخواست بازرسی با اعتبارسنجی
   */
  static transitionRequestStatus(
    request: InspectionRequest,
    newStatus: InspectionRequestStatus
  ): InspectionRequest {
    WorkflowService.transitionRequest(request.status, newStatus);
    return {
      ...request,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * انتقال وضعیت اجرای بازرسی با اعتبارسنجی
   */
  static transitionExecutionStatus(
    inspection: Inspection,
    newStatus: InspectionExecutionStatus
  ): Inspection {
    WorkflowService.transitionExecution(inspection.status, newStatus);
    
    const updates: Partial<Inspection> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "IN_PROGRESS" && !inspection.actual_start_time) {
      updates.actual_start_time = new Date().toISOString();
    }

    if (newStatus === "COMPLETED") {
      updates.actual_end_time = new Date().toISOString();
    }

    return { ...inspection, ...updates };
  }

  // ═══════════════════════════════════════
  // 📊 Status Helpers
  // ═══════════════════════════════════════

  /**
   * دریافت وضعیت‌های مجاز بعدی برای درخواست
   */
  static getNextRequestStates(status: InspectionRequestStatus): InspectionRequestStatus[] {
    return WorkflowService.getNextRequestStates(status);
  }

  /**
   * دریافت وضعیت‌های مجاز بعدی برای اجرا
   */
  static getNextExecutionStates(status: InspectionExecutionStatus): InspectionExecutionStatus[] {
    return WorkflowService.getNextExecutionStates(status);
  }

  /**
   * بررسی نهایی بودن وضعیت درخواست
   */
  static isRequestFinal(status: InspectionRequestStatus): boolean {
    return WorkflowService.isRequestFinal(status);
  }

  /**
   * بررسی نهایی بودن وضعیت اجرا
   */
  static isExecutionFinal(status: InspectionExecutionStatus): boolean {
    return WorkflowService.isExecutionFinal(status);
  }
}