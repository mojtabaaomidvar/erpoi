// src/features/inspection-management/repositories/SupabaseInspectionRequestRepository.ts

import { supabase } from "@shared/database/supabase";
import type { InspectionRequest } from "../domain/types";
import type { CreateInspectionRequestCommand } from "../application/dto/CreateInspectionRequestCommand";
import type { IInspectionRequestRepository } from "./IInspectionRequestRepository";

export class SupabaseInspectionRequestRepository implements IInspectionRequestRepository {
  async getAll(): Promise<InspectionRequest[]> {
    const { data, error } = await supabase
      .from("inspection.inspection_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<InspectionRequest | null> {
    const { data, error } = await supabase
      .from("inspection.inspection_requests")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as InspectionRequest;
  }

  async getByProject(projectId: string): Promise<InspectionRequest[]> {
    const { data, error } = await supabase
      .from("inspection.inspection_requests")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: CreateInspectionRequestCommand & { requested_by: string },
  ): Promise<InspectionRequest> {
    const id = `insp_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .from("inspection.inspection_requests")
      .insert({
        id,
        ...data,
        status: "PENDING", // Default business rule
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return newRecord as InspectionRequest;
  }

  async update(
    id: string,
    data: Partial<InspectionRequest>,
  ): Promise<InspectionRequest> {
    const { data: updatedRecord, error } = await supabase
      .from("inspection.inspection_requests")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updatedRecord as InspectionRequest;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("inspection.inspection_requests")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

// Singleton Export
export const inspectionRequestRepository =
  new SupabaseInspectionRequestRepository();
