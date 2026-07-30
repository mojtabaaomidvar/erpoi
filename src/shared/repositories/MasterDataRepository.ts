//src/shared/repositories/MasterDataRepository.ts

import { supabase } from "@shared/database/supabase";

export interface SystemListItem {
  id: string;
  category: string;
  value: string;
  is_active: boolean;
  created_at: string;
}

class MasterDataRepository {
  async getSystemListByCategory(category: string): Promise<SystemListItem[]> {
    const { data, error } = await supabase
      .schema("master_data")
      .from("system_lists")
      .select("id, category, value, is_active, created_at")
      .eq("category", category)
      .eq("is_active", true)
      .order("value", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch system list: ${error.message}`);
    }
    return (data || []) as SystemListItem[];
  }
}

export const masterDataRepository = new MasterDataRepository();
