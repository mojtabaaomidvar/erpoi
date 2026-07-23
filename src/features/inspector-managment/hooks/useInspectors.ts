//src/features/inspector-managment/hooks/useInspectors.ts

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Inspector, InspectorType, InspectorStatus } from "../domain";
import { inspectorAppService } from "../application";

export function useInspectors() {
  const [inspectors, setInspectorsState] = useState<Inspector[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(
    null,
  );
  const [filterType, setFilterType] = useState<InspectorType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<InspectorStatus | "ALL">(
    "ALL",
  );

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setInitialLoading(true);
    setError(null);
    try {
      const data = await inspectorAppService.getAll();
      setInspectorsState(data);
    } catch (err: any) {
      console.error("[useInspectors] Failed to load data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  const refresh = useCallback(() => loadData(true), [loadData]);

  const setInspectors = useCallback(
    async (action: Inspector[] | ((prev: Inspector[]) => Inspector[])) => {
      try {
        const newInspectors =
          typeof action === "function" ? action(inspectors) : action;
        await inspectorAppService.syncInspectors(inspectors, newInspectors);
        await loadData(true);
      } catch (err: any) {
        console.error("[useInspectors] Failed to sync inspectors:", err);
        throw err;
      }
    },
    [inspectors, loadData],
  );

  const filteredInspectors = useMemo(() => {
    return inspectors.filter((insp) => {
      const matchType =
        filterType === "ALL" || insp.inspector_type === filterType;
      const matchStatus =
        filterStatus === "ALL" || insp.status === filterStatus;
      const matchSearch =
        insp.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (insp.name_fa && insp.name_fa.includes(searchQuery)) ||
        insp.specialties.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      return matchType && matchStatus && matchSearch;
    });
  }, [inspectors, filterType, filterStatus, searchQuery]);

  const stats = useMemo(
    () => ({
      total: inspectors.length,
      ics_member: inspectors.filter((i) => i.inspector_type === "ICS_MEMBER")
        .length,
      freelance: inspectors.filter((i) => i.inspector_type === "FREELANCE")
        .length,
      available: inspectors.filter((i) => i.status === "AVAILABLE").length,
    }),
    [inspectors],
  );

  return {
    inspectors,
    setInspectors,
    loading: initialLoading,
    refreshing,
    error,
    refresh,
    searchQuery,
    setSearchQuery,
    selectedInspector,
    setSelectedInspector,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredInspectors,
    stats,
  };
}
