// src/features/tpi-management/repositories/SupabaseResidentInspectionRepository.ts
import { supabase } from "@shared/database/supabase";
import { applyDepartmentFilter } from "@/shared/data-access/withDepartmentFilter";
import type { ResidentInspection } from "../domain/types";
import type { IResidentInspectionRepository } from "./IResidentInspectionRepository";

export class SupabaseResidentInspectionRepository implements IResidentInspectionRepository {
  async getAll(): Promise<ResidentInspection[]> {
    let query = supabase
      .schema("tpi")
      .from("resident_inspections")
      .select("*")
      .order("created_at", { ascending: false });

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<ResidentInspection | null> {
    let query = supabase
      .schema("tpi")
      .from("resident_inspections")
      .select("*")
      .eq("id", id);

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query.single();
    if (error || !data) return null;
    return data as ResidentInspection;
  }

  async getByTPIRequest(requestId: string): Promise<ResidentInspection[]> {
    let query = supabase
      .schema("tpi")
      .from("resident_inspections")
      .select("*")
      .eq("tpi_request_id", requestId)
      .order("created_at", { ascending: false });

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(data: Omit<ResidentInspection, "id" | "created_at" | "updated_at">): Promise<ResidentInspection> {
    const id = `res_insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .schema("tpi")
      .from("resident_inspections")
      .insert({
        id,
        ...data,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return newRecord as ResidentInspection;
  }

  async update(id: string, data: Partial<ResidentInspection>): Promise<ResidentInspection> {
    const { data: updatedRecord, error } = await supabase
      .schema("tpi")
      .from("resident_inspections")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updatedRecord as ResidentInspection;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("tpi")
      .from("resident_inspections")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}

export const residentInspectionRepository = new SupabaseResidentInspectionRepository();