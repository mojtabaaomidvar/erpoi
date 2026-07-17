// src/features/contract-management/services/ContractService.ts

import { supabase } from "@shared/database/supabase";
import type { Contract } from "@entities/contract/types";

class ContractService {
  async getAll(): Promise<Contract[]> {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ContractService] Failed to get contracts:", error);
      return [];
    }

    return (data || []).map(this.dbToContract);
  }

  async getById(id: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.dbToContract(data);
  }

  async getByClientId(clientId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "[ContractService] Failed to get contracts by client:",
        error,
      );
      return [];
    }

    return (data || []).map(this.dbToContract);
  }

  async create(contract: Partial<Contract>): Promise<Contract> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("[ContractService] User:", user?.id);

    const dbContract = this.contractToDb(contract);

    const { data, error } = await supabase
      .from("contracts")
      .insert({
        ...dbContract,
        id:
          dbContract.id ||
          `ct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })
      .select()
      .single();

    if (error) {
      console.error("[ContractService] Failed to create contract:", error);
      throw new Error(error.message);
    }

    return this.dbToContract(data);
  }

  async update(id: string, contract: Partial<Contract>): Promise<Contract> {
    const dbContract = this.contractToDb(contract);

    const { data, error } = await supabase
      .from("contracts")
      .update({ ...dbContract, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ContractService] Failed to update contract:", error);
      throw new Error(error.message);
    }

    return this.dbToContract(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("contracts").delete().eq("id", id);

    if (error) {
      console.error("[ContractService] Failed to delete contract:", error);
      throw new Error(error.message);
    }
  }

  private dbToContract(dbContract: any): Contract {
    return {
      id: dbContract.id,
      client_id: dbContract.client_id,
      contract_no: dbContract.contract_no || "",
      external_contract_no: dbContract.external_contract_no,
      contract_title: dbContract.contract_title || "",
      type: dbContract.type,
      status: dbContract.status,
      total_value: Number(dbContract.total_value) || 0,
      currency: dbContract.currency || "IRR",
      start_date: dbContract.start_date || "",
      end_date: dbContract.end_date || "",
      tariffs: dbContract.tariffs || 0,
      department: dbContract.department || "",
      description: dbContract.description,
      service_description: dbContract.service_description || [],

      invoiced: Number(dbContract.invoiced) || 0,

      // فیلدهای Work Order
      source_type: dbContract.source_type,
      source_ref: dbContract.source_ref,
      source_file: dbContract.source_file,
      source_letter_date: dbContract.source_letter_date,
      source_letter_image: dbContract.source_letter_image,
      source_letter_image_preview: dbContract.source_letter_image_preview,
      source_email_from: dbContract.source_email_from,
      source_email_date: dbContract.source_email_date,

      // فیلدهای مالی
      financial_terms: dbContract.financial_terms,

      // شناسه سازنده
      created_by: dbContract.created_by,

      created_at: dbContract.created_at,
      updated_at: dbContract.updated_at,
    };
  }

  private contractToDb(contract: Partial<Contract>): any {
    return {
      client_id: contract.client_id,
      contract_no: contract.contract_no,
      external_contract_no: contract.external_contract_no,
      contract_title: contract.contract_title,
      type: contract.type,
      status: contract.status,
      total_value: contract.total_value,
      currency: contract.currency,
      start_date: contract.start_date || null,
      end_date: contract.end_date || null,
      tariffs: contract.tariffs,
      department: contract.department || "",
      description: contract.description,
      service_description: contract.service_description,

      // فیلدهای Work Order
      source_type: contract.source_type,
      source_ref: contract.source_ref,
      source_file: contract.source_file,
      source_letter_date: contract.source_letter_date || null,
      source_letter_image: contract.source_letter_image,
      source_letter_image_preview: contract.source_letter_image_preview,
      source_email_from: contract.source_email_from,
      source_email_date: contract.source_email_date || null,

      // فیلدهای مالی
      financial_terms: contract.financial_terms,

      // شناسه سازنده
      created_by: contract.created_by,
    };
  }
}

export const contractService = new ContractService();
