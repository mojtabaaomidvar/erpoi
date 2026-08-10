// src/shared/hooks/useMasterDataOptions.ts

import { useState, useEffect } from "react";
import { supabase } from "@shared/database/supabase";
import { masterDataRepository } from "@shared/repositories/MasterDataRepository";
import { sortSpecialties } from "../utils/formatUtils";

export function useMasterDataOptions(category: string) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        // Prefer repository over direct supabase access from UI hook
        try {
          const data =
            await masterDataRepository.getSystemListByCategory(category);
          let result = data ? data.map((item: any) => item.value) : [];

          if (category === "INSPECTOR_SPECIALTY") {
            result = sortSpecialties(result);
          }

          setOptions(result);
          return;
        } catch (repoErr) {
          console.warn(
            "[useMasterDataOptions] masterDataRepository failed, falling back to supabase:",
            repoErr,
          );
        }

        const { data, error } = await supabase
          .schema("master_data")
          .from("system_lists")
          .select("value")
          .eq("category", category)
          .eq("is_active", true)
          .order("value", { ascending: true });

        if (error) throw error;

        let result = data ? data.map((item: any) => item.value) : [];

        setOptions(result);
      } catch (err) {
        console.error(`Failed to fetch master data for ${category}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [category]);

  return { options, loading };
}
