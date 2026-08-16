// src/features/master-data/repositories/SupabaseApprovalRepository.ts

import { supabase } from "@shared/database/supabase";
import type { PendingApproval, ApprovalFieldType } from "../domain/types";
import { getTodayJalali } from "@/shared/utils/dateUtils";

const generateMasterDataId = (category: string, value: string): string => {
  const cleanValue = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `${category.toLowerCase()}_${cleanValue}`;
};

const FIELD_TO_TABLE_MAPPING: Record<
  string,
  { schema: string; table: string; column: string; isArray: boolean }
> = {
  INSPECTOR_SPECIALTY: {
    schema: "inspection",
    table: "inspectors",
    column: "specialties",
    isArray: true,
  },
  TPI_DISCIPLINE: {
    schema: "tpi",
    table: "tpi_requests",
    column: "disciplines",
    isArray: true,
  },
  TPI_INSPECTION_STAGE: {
    schema: "tpi",
    table: "tpi_requests",
    column: "stages",
    isArray: true,
  },
  TPI_INSPECTION_METHOD: {
    schema: "tpi",
    table: "tpi_requests",
    column: "methods",
    isArray: true,
  },
  TPI_INSPECTION_ITEM: {
    schema: "equipment",
    table: "equipment",
    column: "name",
    isArray: false,
  },

  TPI_CANCELLATION_REASON: {
    schema: "inspection",
    table: "inspections",
    column: "cancellation_reason",
    isArray: false,
  },
  TPI_REPORT_TYPE: {
    schema: "tpi",
    table: "release_notes",
    column: "report_type",
    isArray: false,
  },
  TPI_DOCUMENT_TYPE: {
    schema: "tpi",
    table: "tpi_source_files",
    column: "document_type",
    isArray: false,
  },
  // ═══════════════════════════════════════
  // MWS — monitoring of work site; stored in the `mws` schema,
  // NOT the legacy tpi.resident_inspections tables (deprecated).
  // Per DOMAIN.md: master-data sync targets must reference the canonical
  // columns on the owning aggregate.
  // ═══════════════════════════════════════
  MWS_DISCIPLINE: {
    schema: "mws",
    table: "mws_requests",
    column: "disciplines",
    isArray: true,
  },
  MWS_INSPECTION_STAGE: {
    schema: "mws",
    table: "mws_requests",
    column: "stages",
    isArray: true,
  },
  MWS_INSPECTION_METHOD: {
    schema: "mws",
    table: "mws_requests",
    column: "methods",
    isArray: true,
  },
  MWS_CANCELLATION_REASON: {
    schema: "inspection",
    table: "inspections",
    column: "cancellation_reason",
    isArray: false,
  },
  // NOTE: MWS_REPORT_TYPE and MWS_DOCUMENT_TYPE previously pointed at
  // tpi.monthly_reports (a resident-inspection artifact). Monthly reports
  // belong to the Resident bounded context, not MWS; they have no canonical
  // backing table for MWS and are intentionally unmapped here. They remain
  // manageable via `master_data.system_lists` only.
};

interface DbRecord {
  id: string;
  [key: string]: any;
}

class SupabaseApprovalRepository {
  async createApproval(
    fieldType: ApprovalFieldType,
    proposedValue: string,
    requestedBy: string,
  ): Promise<PendingApproval> {
    const today = getTodayJalali();
    const random = Math.random().toString(36).substr(2, 6);
    const id = `pending_${fieldType.toLowerCase()}_${today.replace(/\//g, "")}_${random}`;

    const { data, error } = await supabase
      .schema("master_data")
      .from("pending_approvals")
      .insert({
        id,
        field_type: fieldType,
        proposed_value: proposedValue,
        requested_by: requestedBy,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as PendingApproval;
  }

  async getAllApprovals(
    statusFilter?: "PENDING" | "APPROVED" | "REJECTED" | "ALL",
  ): Promise<PendingApproval[]> {
    let query = supabase
      .schema("master_data")
      .from("pending_approvals")
      .select("*")
      .order("requested_at", { ascending: false });

    if (statusFilter && statusFilter !== "ALL") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async approveApproval(
    approvalId: string,
    reviewedBy: string,
    finalValue: string,
  ): Promise<void> {
    const safeValue = String(finalValue || "").trim();
    if (!safeValue) throw new Error("Approved value cannot be empty or null");

    const { data: approval, error: fetchError } = await supabase
      .schema("master_data")
      .from("pending_approvals")
      .select("*")
      .eq("id", approvalId)
      .single();

    if (fetchError || !approval) throw new Error("Approval record not found");
    if ((approval as any).request_type === "ENTITY_DELETION") {
      throw new Error(
        "Entity deletion approvals must be reviewed through their workflow",
      );
    }

    const { error: updateError } = await supabase
      .schema("master_data")
      .from("pending_approvals")
      .update({
        status: "APPROVED",
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        final_value: safeValue,
      })
      .eq("id", approvalId);

    if (updateError) throw new Error(updateError.message);

    const id = generateMasterDataId(approval.field_type, safeValue);
    const { error: upsertError } = await supabase
      .schema("master_data")
      .from("system_lists")
      .upsert(
        {
          id,
          category: approval.field_type,
          value: safeValue,
          is_active: true,
        },
        { onConflict: "id" },
      );

    if (upsertError) throw new Error(upsertError.message);

    await this.updateExistingRecordsWithApprovedValue(
      approval.field_type,
      approval.proposed_value,
      safeValue,
    );
  }

  private async updateExistingRecordsWithApprovedValue(
    fieldType: string,
    proposedValue: string,
    finalValue: string,
  ) {
    const mapping = FIELD_TO_TABLE_MAPPING[fieldType];
    if (!mapping) {
      return;
    }

    const { schema, table, column, isArray } = mapping;
    const cleanProposed = proposedValue
      .replace(/^(OTHER:|Others:\s*)/i, "")
      .trim();
    const possibleOldStrings = [
      proposedValue,
      `OTHER:${cleanProposed}`,
      `Others: ${cleanProposed}`,
      `Others:${cleanProposed}`,
    ];

    try {
      if (isArray) {
        // ✅ استفاده از .schema() برای مشخص کردن اسکیما
        const { data: records, error: fetchErr } = await supabase
          .schema(schema)
          .from(table)
          .select(`id, ${column}`);

        if (fetchErr) {
          return;
        }

        if (records && records.length > 0) {
          let updateCount = 0;
          for (const record of records) {
            const dbRecord = record as unknown as DbRecord;
            const currentArray = dbRecord[column] as string[];

            if (!Array.isArray(currentArray)) continue;

            const hasOldValue = currentArray.some((item) =>
              possibleOldStrings.includes(item),
            );

            if (hasOldValue) {
              const newArray = currentArray.map((item) => {
                if (possibleOldStrings.includes(item)) {
                  return finalValue;
                }
                return item;
              });

              const { error: updateErr } = await supabase
                .schema(schema)
                .from(table)
                .update({
                  [column]: newArray,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", dbRecord.id);

              if (updateErr) {
              } else {
                updateCount++;
              }
            }
          }
        } else {
        }
      } else {
        const { data: records, error: fetchErr } = await supabase
          .schema(schema)
          .from(table)
          .select(`id, ${column}`)
          .in(column, possibleOldStrings);

        if (!fetchErr && records && records.length > 0) {
          for (const record of records) {
            const dbRecord = record as unknown as DbRecord;
            const { error: updateErr } = await supabase
              .schema(schema)
              .from(table)
              .update({
                [column]: finalValue,
                updated_at: new Date().toISOString(),
              })
              .eq("id", dbRecord.id);

            if (!updateErr) {
            }
          }
        }
      }
    } catch (err) {}
  }

  async rejectApproval(
    approvalId: string,
    reviewedBy: string,
    reason: string,
  ): Promise<void> {
    await supabase
      .schema("master_data")
      .from("pending_approvals")
      .update({
        status: "REJECTED",
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq("id", approvalId);
  }
}

export const approvalRepository = new SupabaseApprovalRepository();
