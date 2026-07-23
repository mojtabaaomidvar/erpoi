//src/features/contract-management/repositories/SupabaseAmendmentRepository.ts

import { supabase } from "@shared/database/supabase";
import type {
  ContractAmendment,
  CreateAmendmentData,
  IAmendmentRepository,
} from "../domain";

export class SupabaseAmendmentRepository implements IAmendmentRepository {
  private mapToDomain(data: any): ContractAmendment {
    return {
      id: data.id,
      contract_id: data.contract_id,
      amendment_no: data.amendment_no,
      amendment_types: data.amendment_types || [],
      effective_date: data.effective_date,
      previous_end_date: data.previous_end_date,
      new_end_date: data.new_end_date,
      previous_value: data.previous_value,
      new_value: data.new_value,
      description: data.description,
      attachment_urls: data.attachment_urls || [],
      attachment_names: data.attachment_names || [],
      approval_status: data.approval_status,
      created_by: data.created_by,
      approved_by: data.approved_by,
      approved_at: data.approved_at,
      rejected_by: data.rejected_by,
      rejection_reason: data.rejection_reason,
      created_at: data.created_at,
      updated_at: data.updated_at,
      tariff_adjustments: data.tariff_adjustments || [],
    };
  }

  async getByContractId(contractId: string): Promise<ContractAmendment[]> {
    const { data, error } = await supabase
      .schema("contracts")
      .from("contract_amendments")
      .select("*, tariff_adjustments:amendment_tariff_adjustments(*)")
      .eq("contract_id", contractId)
      .order("effective_date", { ascending: false });
    if (error) return [];
    return (data || []).map(this.mapToDomain);
  }

  async getById(amendmentId: string): Promise<ContractAmendment | null> {
    const { data, error } = await supabase
      .schema("contracts")
      .from("contract_amendments")
      .select("*, tariff_adjustments:amendment_tariff_adjustments(*)")
      .eq("id", amendmentId)
      .single();
    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async create(amendmentData: CreateAmendmentData): Promise<ContractAmendment> {
    const amendmentId = `am_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const createdBy = amendmentData.created_by || user?.id || undefined;

    const { data, error } = await supabase
      .schema("contracts")
      .from("contract_amendments")
      .insert({
        id: amendmentId,
        contract_id: amendmentData.contract_id,
        amendment_no: amendmentData.amendment_no,
        amendment_types: amendmentData.amendment_types,
        effective_date: amendmentData.effective_date,
        previous_end_date: amendmentData.previous_end_date,
        new_end_date: amendmentData.new_end_date,
        previous_value: amendmentData.previous_value,
        new_value: amendmentData.new_value,
        description: amendmentData.description,
        attachment_urls: amendmentData.attachment_urls || [],
        attachment_names: amendmentData.attachment_names || [],
        approval_status: "PENDING",
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (
      amendmentData.tariff_adjustments &&
      amendmentData.tariff_adjustments.length > 0
    ) {
      for (const adj of amendmentData.tariff_adjustments) {
        const adjId = `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await supabase
          .schema("contracts")
          .from("amendment_tariff_adjustments")
          .insert({
            id: adjId,
            amendment_id: amendmentId,
            tariff_line_id: adj.tariff_line_id,
            adjustment_mode: adj.adjustment_mode,
            adjustment_percentage: adj.adjustment_percentage,
            previous_rate: adj.previous_rate,
            new_rate: adj.new_rate,
          });
      }
    }
    return this.mapToDomain(data);
  }

  async updateAttachments(
    amendmentId: string,
    urls: string[],
    names: string[],
  ): Promise<void> {
    const { error } = await supabase
      .schema("contracts")
      .from("contract_amendments")
      .update({ attachment_urls: urls, attachment_names: names })
      .eq("id", amendmentId);
    if (error) throw new Error(error.message);
  }

  async updateStatus(
    amendmentId: string,
    status: "APPROVED" | "REJECTED",
    userId: string,
    reason?: string,
  ): Promise<void> {
    const updateData: any = {
      approval_status: status,
      [status === "APPROVED" ? "approved_by" : "rejected_by"]: userId,
      [status === "APPROVED" ? "approved_at" : "rejection_reason"]:
        status === "APPROVED" ? new Date().toISOString() : reason,
    };
    const { error } = await supabase
      .schema("contracts")
      .from("contract_amendments")
      .update(updateData)
      .eq("id", amendmentId);
    if (error) throw new Error(error.message);
  }

  async getPending(): Promise<ContractAmendment[]> {
    const { data, error } = await supabase
      .schema("contracts")
      .from("contract_amendments")
      .select("*, tariff_adjustments:amendment_tariff_adjustments(*)")
      .eq("approval_status", "PENDING")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data || []).map(this.mapToDomain);
  }

  async getLatestByContractId(
    contractId: string,
  ): Promise<ContractAmendment | null> {
    const { data, error } = await supabase
      .schema("contracts")
      .from("contract_amendments")
      .select("*, tariff_adjustments:amendment_tariff_adjustments(*)")
      .eq("contract_id", contractId)
      .order("effective_date", { ascending: false })
      .limit(1)
      .single();
    if (error) return null;
    return this.mapToDomain(data);
  }

  async hasAmendments(contractId: string): Promise<boolean> {
    const { count, error } = await supabase
      .schema("contracts")
      .from("contract_amendments")
      .select("*", { count: "exact", head: true })
      .eq("contract_id", contractId);
    return error ? false : (count || 0) > 0;
  }

  async delete(amendmentId: string): Promise<void> {
    const { error } = await supabase
      .schema("contracts")
      .from("contract_amendments")
      .delete()
      .eq("id", amendmentId);
    if (error) throw new Error(error.message);
  }
}
