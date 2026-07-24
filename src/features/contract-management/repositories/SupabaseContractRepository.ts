// src/features/contract-management/repositories/SupabaseContractRepository.ts

import { supabase } from "@shared/database/supabase";
import {
  applyDepartmentFilter,
  getDepartmentFilter,
} from "@/shared/data-access/withDepartmentFilter";
import type { Contract, IContractRepository } from "../domain";

export class SupabaseContractRepository implements IContractRepository {
  async getAll(): Promise<Contract[]> {
    let query = supabase
      .schema("contracts")
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query;

    if (error) {
      console.error(
        "[SupabaseContractRepository] Failed to get contracts:",
        error,
      );
      return [];
    }
    return (data || []).map(this.mapToDomain);
  }

  async getById(id: string): Promise<Contract | null> {
    let query = supabase
      .schema("contracts")
      .from("contracts")
      .select("*")
      .eq("id", id);

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query.single();
    if (error || !data) return null;

    return this.mapToDomain(data);
  }

  async getByClientId(clientId: string): Promise<Contract[]> {
    let query = supabase
      .schema("contracts")
      .from("contracts")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query;
    if (error) return [];

    return (data || []).map(this.mapToDomain);
  }

  async create(contract: Partial<Contract>): Promise<Contract> {
    const dbContract = this.mapToDb(contract);

    const currentDept = getDepartmentFilter();

    const { data, error } = await supabase
      .schema("contracts")
      .from("contracts")
      .insert({
        ...dbContract,
        id:
          dbContract.id ||
          `ct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        department: currentDept !== null ? currentDept : dbContract.department,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapToDomain(data);
  }

  async update(id: string, contract: Partial<Contract>): Promise<Contract> {
    const dbContract = this.mapToDb(contract);

    let query = supabase
      .schema("contracts")
      .from("contracts")
      .update({ ...dbContract, updated_at: new Date().toISOString() })
      .eq("id", id);

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query.select().single();
    if (error) throw new Error(error.message);

    return this.mapToDomain(data);
  }

  async delete(id: string): Promise<void> {
    let query = supabase
      .schema("contracts")
      .from("contracts")
      .delete()
      .eq("id", id);

    query = applyDepartmentFilter(query, "department");

    const { error } = await query;
    if (error) throw new Error(error.message);
  }

  private mapToDomain(db: any): Contract {
    return {
      id: db.id,
      client_id: db.client_id,
      contract_no: db.contract_no || "",
      external_contract_no: db.external_contract_no,
      contract_title: db.contract_title || "",
      type: db.type,
      status: db.status,
      total_value: Number(db.total_value) || 0,
      currency: db.currency || "IRR",
      start_date: db.start_date || "",
      end_date: db.end_date || "",
      tariffs: db.tariffs || 0,
      department: db.department || "",
      description: db.description,
      service_description: db.service_description || [],
      invoiced: Number(db.invoiced) || 0,
      source_type: db.source_type,
      source_ref: db.source_ref,
      source_file: db.source_file,
      source_letter_date: db.source_letter_date,
      source_letter_image: db.source_letter_image,
      source_email_from: db.source_email_from,
      source_email_date: db.source_email_date,
      financial_terms: db.financial_terms,
      created_by: db.created_by,
      created_at: db.created_at,
      updated_at: db.updated_at,
    };
  }

  private mapToDb(contract: Partial<Contract>): any {
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
      source_type: contract.source_type,
      source_ref: contract.source_ref,
      source_file: contract.source_file,
      source_letter_date: contract.source_letter_date || null,
      source_letter_image: contract.source_letter_image,
      source_email_from: contract.source_email_from,
      source_email_date: contract.source_email_date || null,
      financial_terms: contract.financial_terms,
      created_by: contract.created_by,
    };
  }
}
