// src/features/inspection-management/repositories/SupabaseCertificateRepository.ts

import { supabase } from "@shared/database/supabase";
import type { Certificate } from "../domain/types";
import type { ICertificateRepository } from "./ICertificateRepository";

export class SupabaseCertificateRepository implements ICertificateRepository {
  async getAll(): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from("inspection.certificates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<Certificate | null> {
    const { data, error } = await supabase
      .from("inspection.certificates")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as Certificate;
  }

  async getByInspection(inspectionId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from("inspection.certificates")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: Omit<Certificate, "id" | "created_at">,
  ): Promise<Certificate> {
    const id = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .from("inspection.certificates")
      .insert({
        id,
        ...data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return newRecord as Certificate;
  }

  async update(id: string, data: Partial<Certificate>): Promise<Certificate> {
    const { data: updatedRecord, error } = await supabase
      .from("inspection.certificates")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updatedRecord as Certificate;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("inspection.certificates")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const certificateRepository = new SupabaseCertificateRepository();
