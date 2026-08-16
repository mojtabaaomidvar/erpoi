// src/shared/hooks/useMasterDataOptions.ts

import { useState, useEffect } from "react";
import { masterDataAppService } from "@shared/application/MasterDataApplicationService";
import { sortSpecialties } from "../utils/formatUtils";

export function useMasterDataOptions(category: string) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await masterDataAppService.getSystemList(category);
        let result = data ? data.map((item: any) => item.value) : [];

        if (category === "INSPECTOR_SPECIALTY") {
          result = sortSpecialties(result);
        }

        if (!cancelled) setOptions(result);
      } catch (err) {
        console.error(
          `[useMasterDataOptions] Failed to fetch ${category}:`,
          err,
        );
        if (!cancelled) {
          setOptions([]);
          setError(
            err instanceof Error
              ? err.message
              : `Could not load ${category} options`,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchOptions();
    return () => {
      cancelled = true;
    };
  }, [category]);

  return { options, loading, error };
}
