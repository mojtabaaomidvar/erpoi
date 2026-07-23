//src/features/contract-management/repositories/SupabaseTariffRepository.ts

import { supabase } from "@shared/database/supabase";
import type { TariffLine, ITariffRepository } from "../domain";

export class SupabaseTariffRepository implements ITariffRepository {
  async getAll(): Promise<TariffLine[]> {
    const { data, error } = await supabase
      .schema("contracts")
      .from("tariff_lines")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SupabaseTariffRepository] Failed to get tariffs:", error);
      return [];
    }
    return data || [];
  }

  async getById(id: string): Promise<TariffLine | null> {
    const { data, error } = await supabase
      .schema("contracts")
      .from("tariff_lines")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as TariffLine;
  }

  async getByContractId(contractId: string): Promise<TariffLine[]> {
    const { data, error } = await supabase
      .schema("contracts")
      .from("tariff_lines")
      .select("*")
      .eq("contract_id", contractId);

    if (error) return [];
    return data || [];
  }

  async create(
    tariff: Omit<TariffLine, "id" | "created_at" | "updated_at">,
  ): Promise<TariffLine> {
    const { data, error } = await supabase
      .schema("contracts")
      .from("tariff_lines")
      .insert({
        ...tariff,
        id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, tariff: Partial<TariffLine>): Promise<TariffLine> {
    const { data, error } = await supabase
      .schema("contracts")
      .from("tariff_lines")
      .update({ ...tariff, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("contracts")
      .from("tariff_lines")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
