// src/features/contract-management/services/TariffService.ts

import { supabase } from "@shared/database/supabase";

export interface TariffLine {
  id: string;
  contract_id: string;
  description: string;
  unit: string;
  rate: number;
  currency: string;
  consumed_quantity: number;
  invoiced: number;
  is_lump_sum?: boolean;
  created_at?: string;
  updated_at?: string;
}

class TariffService {
  async getAll(): Promise<TariffLine[]> {
    const { data, error } = await supabase
      .from("tariff_lines")
      .select(
        `
      id,
      contract_id,
      description,
      unit,
      rate,
      total_quantity,
      consumed_quantity,
      invoiced,
      currency,
      is_lump_sum,
      valid_from,
      valid_to,
      is_archived,
      parent_tariff_id,
      version,
      created_at,
      updated_at
    `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[TariffService] Failed to get tariffs:", error);
      return [];
    }

    console.log("[TariffService] Loaded tariffs:", {
      count: data?.length || 0,
      archived: data?.filter((t) => t.is_archived).length || 0,
      active: data?.filter((t) => !t.is_archived).length || 0,
    });

    return data || [];
  }

  async getByContractId(contractId: string): Promise<TariffLine[]> {
    const { data, error } = await supabase
      .from("tariff_lines")
      .select("*")
      .eq("contract_id", contractId);

    if (error) {
      console.error(
        "[TariffService] Failed to get tariffs by contract:",
        error,
      );
      return [];
    }

    return data || [];
  }

  async create(
    tariff: Omit<TariffLine, "id" | "created_at" | "updated_at">,
  ): Promise<TariffLine> {
    const { data, error } = await supabase
      .from("tariff_lines")
      .insert({
        ...tariff,
        id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(id: string, tariff: Partial<TariffLine>): Promise<TariffLine> {
    const { data, error } = await supabase
      .from("tariff_lines")
      .update({ ...tariff, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[TariffService] Failed to update tariff:", error);
      throw new Error(error.message);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("tariff_lines").delete().eq("id", id);

    if (error) {
      console.error("[TariffService] Failed to delete tariff:", error);
      throw new Error(error.message);
    }
  }
}

export const tariffService = new TariffService();
