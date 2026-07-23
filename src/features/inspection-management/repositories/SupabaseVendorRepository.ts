// src/features/inspection-management/repositories/SupabaseVendorRepository.ts

import { supabase } from "@shared/database/supabase";
import type { Vendor } from "../domain/types";
import type { IVendorRepository } from "./IVendorRepository";

export class SupabaseVendorRepository implements IVendorRepository {
  async getAll(): Promise<Vendor[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("vendors")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<Vendor | null> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("vendors")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as Vendor;
  }

  async search(query: string): Promise<Vendor[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("vendors")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true })
      .limit(10);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: Omit<Vendor, "id" | "created_at" | "updated_at">,
  ): Promise<Vendor> {
    const id = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .schema("inspection")
      .from("vendors")
      .insert({
        id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return newRecord as Vendor;
  }

  async update(id: string, data: Partial<Vendor>): Promise<Vendor> {
    const { data: updatedRecord, error } = await supabase
      .schema("inspection")
      .from("vendors")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updatedRecord as Vendor;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("inspection")
      .from("vendors")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const vendorRepository = new SupabaseVendorRepository();
