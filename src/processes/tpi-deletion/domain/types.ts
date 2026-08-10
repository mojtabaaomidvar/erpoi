export const TPI_PACKAGE_DELETION_FIELD_TYPE = "TPI_PACKAGE_DELETION" as const;

export interface RequestTPIPackageDeletionCommand {
  packageId: string;
  requestedBy: string;
  reason: string;
  packageSnapshot?: Record<string, unknown>;
}

export interface ReviewTPIPackageDeletionCommand {
  approvalId: string;
  reviewedBy: string;
  reviewerRole: string;
}

export interface RejectTPIPackageDeletionCommand extends ReviewTPIPackageDeletionCommand {
  reason: string;
}

export interface TPIPackageDeletionApproval {
  id: string;
  entity_id: string;
  proposed_value: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}
