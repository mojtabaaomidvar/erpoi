import type {
  RequestTPIPackageDeletionCommand,
  TPIPackageDeletionApproval,
} from "../domain/types";

export interface ITPIDeletionWorkflowRepository {
  getPendingPackageDeletionIds(): Promise<string[]>;
  requestPackageDeletion(
    command: RequestTPIPackageDeletionCommand,
  ): Promise<TPIPackageDeletionApproval>;
  approvePackageDeletion(
    approvalId: string,
    reviewedBy: string,
  ): Promise<string>;
  rejectPackageDeletion(
    approvalId: string,
    reviewedBy: string,
    reason: string,
  ): Promise<string>;
}
