// src/features/inspection-management/repositories/SupabaseInspectionRequestRepository.ts

import { supabase } from "@shared/database/supabase";
import type { IInspectionRequestRepository } from "./IInspectionRequestRepository";
import type { BaseInspectionRequest } from "../domain/types";

class SupabaseInspectionRequestRepository implements IInspectionRequestRepository {
  async getAll(): Promise<BaseInspectionRequest[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspection_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as BaseInspectionRequest[];
  }

  async getById(id: string): Promise<BaseInspectionRequest | null> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspection_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data as BaseInspectionRequest | null;
  }

  async getByProject(projectId: string): Promise<BaseInspectionRequest[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspection_requests")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data as BaseInspectionRequest[];
  }

  async create(data: any): Promise<BaseInspectionRequest> {
    const { data: newRecord, error } = await supabase
      .schema("inspection")
      .from("inspection_requests")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return newRecord as BaseInspectionRequest;
  }

  async update(id: string, data: any): Promise<BaseInspectionRequest> {
    const { data: updatedRecord, error } = await supabase
      .schema("inspection")
      .from("inspection_requests")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updatedRecord as BaseInspectionRequest;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("inspection")
      .from("inspection_requests")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}

export const inspectionRequestRepository =
  new SupabaseInspectionRequestRepository();
