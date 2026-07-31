// src/features/tpi-management/repositories/SupabaseTPIRequestRepository.ts

import { supabase } from "@shared/database/supabase";
import { applyDepartmentFilter } from "@/shared/data-access/withDepartmentFilter";

import type { TPIRequest } from "../domain/types";

export class SupabaseTPIRequestRepository implements SupabaseTPIRequestRepository {
  async getAll(): Promise<TPIRequest[]> {
    let query = supabase
      .schema("tpi")
      .from("tpi_requests")
      .select("*")
      .order("created_at", { ascending: false });

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<TPIRequest | null> {
    let query = supabase
      .schema("tpi")
      .from("tpi_requests")
      .select("*")
      .eq("id", id);

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query.single();
    if (error || !data) return null;
    return data as TPIRequest;
  }

  async getByProject(projectId: string): Promise<TPIRequest[]> {
    let query = supabase
      .schema("tpi")
      .from("tpi_requests")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: Omit<TPIRequest, "id" | "created_at" | "updated_at">,
  ): Promise<TPIRequest> {
    const id = `tpi_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .schema("tpi")
      .from("tpi_requests")
      .insert({
        id,
        ...data,
        status: "NEW",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return newRecord as TPIRequest;
  }

  async update(id: string, data: Partial<TPIRequest>): Promise<TPIRequest> {
    const { data: updatedRecord, error } = await supabase
      .schema("tpi")
      .from("tpi_requests")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updatedRecord as TPIRequest;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("tpi")
      .from("tpi_requests")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async uploadFile(file: File, requestId: string): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const filePath = `tpi-documents/${requestId}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("documents")
      .upload(filePath, file);
    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async createInspectionItems(requestId: string, items: any[]): Promise<void> {
    if (items.length === 0) return;
    const { error } = await supabase
      .schema("tpi")
      .from("tpi_inspection_items")
      .insert(items);
    if (error) throw new Error(`Failed to save items: ${error.message}`);
  }

  async createSourceFiles(requestId: string, files: any[]): Promise<void> {
    if (files.length === 0) return;
    const { error } = await supabase
      .schema("tpi")
      .from("tpi_source_files")
      .insert(files);
    if (error) throw new Error(`Failed to save source files: ${error.message}`);
  }

  async deleteInspectionItems(requestId: string): Promise<void> {
    const { error } = await supabase
      .schema("tpi")
      .from("tpi_inspection_items")
      .delete()
      .eq("tpi_request_id", requestId);

    if (error) throw new Error(`Failed to delete old items: ${error.message}`);
  }

  async getInspectionItems(requestId: string): Promise<any[]> {
    const { data, error } = await supabase
      .schema("tpi")
      .from("tpi_inspection_items")
      .select("*")
      .eq("tpi_request_id", requestId)
      .order("row_index", { ascending: true });

    if (error) throw new Error(`Failed to fetch items: ${error.message}`);
    return data || [];
  }

  async getSourceFiles(requestId: string): Promise<any[]> {
    const { data, error } = await supabase
      .schema("tpi")
      .from("tpi_source_files")
      .select("*")
      .eq("tpi_request_id", requestId)
      .order("uploaded_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch files: ${error.message}`);
    return data || [];
  }
}

export const tpiRequestRepository = new SupabaseTPIRequestRepository();
