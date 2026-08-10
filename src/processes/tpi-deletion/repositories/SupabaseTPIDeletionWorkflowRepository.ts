import { supabase } from "@shared/database/supabase";
import type { ITPIDeletionWorkflowRepository } from "./ITPIDeletionWorkflowRepository";
import {
  type RequestTPIPackageDeletionCommand,
  type TPIPackageDeletionApproval,
} from "../domain/types";

function generateApprovalId(): string {
  return `pending_tpi_delete_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class SupabaseTPIDeletionWorkflowRepository implements ITPIDeletionWorkflowRepository {
  async getPendingPackageDeletionIds(): Promise<string[]> {
    const { data, error } = await supabase
      .schema("master_data")
      .from("pending_approvals")
      .select("entity_id")
      .eq("request_type", "ENTITY_DELETION")
      .eq("entity_type", "TPI_PACKAGE")
      .eq("status", "PENDING")
      .not("entity_id", "is", null);

    if (error) throw new Error(error.message);

    return [
      ...new Set(
        (data || [])
          .map((approval) => approval.entity_id)
          .filter((packageId): packageId is string => Boolean(packageId)),
      ),
    ];
  }

  async requestPackageDeletion(
    command: RequestTPIPackageDeletionCommand,
  ): Promise<TPIPackageDeletionApproval> {
    const { data, error } = await supabase
      .schema("master_data")
      .rpc("request_tpi_package_deletion", {
        p_approval_id: generateApprovalId(),
        p_package_id: command.packageId,
        p_requested_by: command.requestedBy,
        p_reason: command.reason,
        p_request_payload: command.packageSnapshot || {},
      });

    if (error) throw new Error(error.message);
    return data as TPIPackageDeletionApproval;
  }

  async approvePackageDeletion(
    approvalId: string,
    reviewedBy: string,
  ): Promise<string> {
    const { data, error } = await supabase
      .schema("master_data")
      .rpc("approve_tpi_package_deletion", {
        p_approval_id: approvalId,
        p_reviewed_by: reviewedBy,
      });
    if (error) throw new Error(error.message);
    return data as string;
  }

  async rejectPackageDeletion(
    approvalId: string,
    reviewedBy: string,
    reason: string,
  ): Promise<string> {
    const { data, error } = await supabase
      .schema("master_data")
      .rpc("reject_tpi_package_deletion", {
        p_approval_id: approvalId,
        p_reviewed_by: reviewedBy,
        p_reason: reason,
      });

    if (error) throw new Error(error.message);
    return data as string;
  }
}

export const tpiDeletionWorkflowRepository =
  new SupabaseTPIDeletionWorkflowRepository();
