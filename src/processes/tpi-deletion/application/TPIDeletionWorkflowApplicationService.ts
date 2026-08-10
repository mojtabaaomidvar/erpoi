import { publishEvent } from "@infra/events";
import type { ITPIDeletionWorkflowRepository } from "../repositories/ITPIDeletionWorkflowRepository";
import { tpiDeletionWorkflowRepository } from "../repositories/SupabaseTPIDeletionWorkflowRepository";
import type {
  RejectTPIPackageDeletionCommand,
  RequestTPIPackageDeletionCommand,
  ReviewTPIPackageDeletionCommand,
} from "../domain/types";

const DELETION_REVIEWER_ROLES = new Set([
  "admin",
  "super_admin",
  "manager",
  "unit_manager",
]);

function assertReviewer(command: ReviewTPIPackageDeletionCommand): void {
  if (!command.reviewedBy.trim()) throw new Error("Reviewer is required");
  if (!DELETION_REVIEWER_ROLES.has(command.reviewerRole)) {
    throw new Error(
      "Only a unit manager or administrator may review deletion requests",
    );
  }
}

export class TPIDeletionWorkflowApplicationService {
  constructor(private readonly repository: ITPIDeletionWorkflowRepository) {}

  async getPendingPackageDeletionIds(): Promise<string[]> {
    return this.repository.getPendingPackageDeletionIds();
  }

  async requestPackageDeletion(command: RequestTPIPackageDeletionCommand) {
    const normalized = {
      ...command,
      packageId: command.packageId.trim(),
      requestedBy: command.requestedBy.trim(),
      reason: command.reason.trim(),
    };
    if (!normalized.packageId) throw new Error("Package id is required");
    if (!normalized.requestedBy) throw new Error("Requesting user is required");
    if (normalized.reason.length < 10) {
      throw new Error("Deletion reason must be at least 10 characters");
    }

    const approval = await this.repository.requestPackageDeletion(normalized);
    publishEvent(
      "tpi.package.deletion.requested",
      {
        id: approval.id,
        entityId: normalized.packageId,
        reason: normalized.reason,
      },
      {
        userId: normalized.requestedBy,
        source: "TPIDeletionWorkflowApplicationService",
      },
    );
    return approval;
  }

  async approvePackageDeletion(command: ReviewTPIPackageDeletionCommand) {
    assertReviewer(command);
    const packageId = await this.repository.approvePackageDeletion(
      command.approvalId,
      command.reviewedBy,
    );
    publishEvent(
      "tpi.package.deletion.approved",
      { id: command.approvalId, entityId: packageId },
      {
        userId: command.reviewedBy,
        source: "TPIDeletionWorkflowApplicationService",
      },
    );
  }

  async rejectPackageDeletion(command: RejectTPIPackageDeletionCommand) {
    assertReviewer(command);
    const reason = command.reason.trim();
    if (reason.length < 5) {
      throw new Error("Rejection reason must be at least 5 characters");
    }
    const packageId = await this.repository.rejectPackageDeletion(
      command.approvalId,
      command.reviewedBy,
      reason,
    );
    publishEvent(
      "tpi.package.deletion.rejected",
      { id: command.approvalId, entityId: packageId, reason },
      {
        userId: command.reviewedBy,
        source: "TPIDeletionWorkflowApplicationService",
      },
    );
  }
}

export const tpiDeletionWorkflowAppService =
  new TPIDeletionWorkflowApplicationService(tpiDeletionWorkflowRepository);
