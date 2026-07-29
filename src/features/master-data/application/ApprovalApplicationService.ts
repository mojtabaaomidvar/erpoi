// src/features/master-data/application/ApprovalApplicationService.ts

import { approvalRepository } from "../repositories/SupabaseApprovalRepository";
import type { PendingApproval, ApprovalFieldType } from "../domain/types";

class ApprovalApplicationService {
  async requestApproval(
    fieldType: ApprovalFieldType,
    proposedValue: string,
    requestedBy: string,
  ): Promise<PendingApproval> {
    return await approvalRepository.createApproval(
      fieldType,
      proposedValue,
      requestedBy,
    );
  }

  async getAllPending(): Promise<PendingApproval[]> {
    return await approvalRepository.getAllApprovals("PENDING");
  }

  async getAllHistory(): Promise<PendingApproval[]> {
    return await approvalRepository.getAllApprovals("ALL");
  }

  async approve(
    approvalId: string,
    reviewedBy: string,
    finalValue: string,
  ): Promise<void> {
    await approvalRepository.approveApproval(
      approvalId,
      reviewedBy,
      finalValue,
    );
  }

  async reject(
    approvalId: string,
    reviewedBy: string,
    reason: string,
  ): Promise<void> {
    await approvalRepository.rejectApproval(approvalId, reviewedBy, reason);
  }
}

export const approvalAppService = new ApprovalApplicationService();
