// src/shared/hooks/usePendingAmendmentsCount.ts

import { useState, useEffect } from "react";
import { amendmentAppService } from "@/features/contract-management/application";

/**
 * Hook for retrieving the count of pending contract amendments.
 * Adheres to architecture rules by using Application Service instead of direct DB access.
 */
export function usePendingAmendmentsCount(intervalMs: number = 10000) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCount = async () => {
      try {
        const pending = await amendmentAppService.getPending();
        if (isMounted) {
          setCount(pending.length);
        }
      } catch (error) {
        console.error("[usePendingAmendmentsCount] Failed to fetch:", error);
        // Safe default on error - do NOT fallback to direct DB access
        if (isMounted) {
          setCount(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCount();
    const interval = setInterval(loadCount, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return { count, loading };
}
