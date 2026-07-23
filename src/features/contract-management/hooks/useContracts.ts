import { useState, useMemo, useEffect, useCallback } from "react";
import type { Contract, TariffLine } from "../domain";
import type { Client } from "@/features/client-management/domain/models/Client";
import { useAuth } from "@features/auth/hooks/useAuth";
import { contractAppService, tariffAppService } from "../application";
import { clientAppService } from "@/features/client-management/application";

type ContractStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "NOT_STARTED"
  | "NEEDS_REVIEW"
  | "COMPLETED";

export function useContracts() {
  const { user } = useAuth();
  const userDepartmentId = user?.department || "";

  const [contracts, setContractsState] = useState<Contract[]>([]);
  const [clients, setClientsState] = useState<Client[]>([]);
  const [tariffs, setTariffsState] = useState<TariffLine[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "CONTRACT" | "WORK_ORDER"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<ContractStatusFilter>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "value" | "status">("date");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setInitialLoading(true);
    setError(null);

    try {
      const [dbContracts, dbClients, dbTariffs] = await Promise.all([
        contractAppService.getAll(),
        clientAppService.getAll(),
        tariffAppService.getAll(),
      ]);

      setContractsState(dbContracts);
      setClientsState(dbClients);
      setTariffsState(dbTariffs);
    } catch (err: any) {
      console.error("[useContracts] Failed to load data:", err);
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

  const setContracts = useCallback(
    async (action: Contract[] | ((prev: Contract[]) => Contract[])) => {
      try {
        const newContracts =
          typeof action === "function" ? action(contracts) : action;
        await contractAppService.syncContracts(contracts, newContracts);
        await loadData(true);
      } catch (err: any) {
        console.error("[useContracts] Failed to sync contracts:", err);
        throw err;
      }
    },
    [contracts, loadData],
  );

  const accessibleContracts = useMemo(() => {
    return contracts.filter((contract) => {
      if (contract.department !== userDepartmentId) return false;
      if (contract.status === "DRAFT" && contract.created_by !== user?.id)
        return false;
      return true;
    });
  }, [contracts, userDepartmentId, user?.id]);

  const accessibleTariffs = useMemo(() => {
    const accessibleContractIds = new Set(accessibleContracts.map((c) => c.id));
    return tariffs.filter(
      (t) => t.contract_id && accessibleContractIds.has(t.contract_id),
    );
  }, [tariffs, accessibleContracts]);

  const filterCounts = useMemo(
    () => ({
      ALL: accessibleContracts.length,
      ACTIVE: accessibleContracts.filter((c) => c.status === "ACTIVE").length,
      NOT_STARTED: accessibleContracts.filter((c) => c.status === "NOT_STARTED")
        .length,
      NEEDS_REVIEW: accessibleContracts.filter(
        (c) => c.status === "NEEDS_REVIEW",
      ).length,
      COMPLETED: accessibleContracts.filter((c) => c.status === "COMPLETED")
        .length,
    }),
    [accessibleContracts],
  );

  const sortedContracts = useMemo(() => {
    let result = accessibleContracts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (contract) =>
          contract.contract_no?.toLowerCase().includes(query) ||
          contract.contract_title?.toLowerCase().includes(query) ||
          contract.client_name?.toLowerCase().includes(query),
      );
    }

    if (typeFilter !== "ALL")
      result = result.filter((c) => c.type === typeFilter);
    if (statusFilter !== "ALL")
      result = result.filter((c) => c.status === statusFilter);

    return [...result].sort((a, b) => {
      if (sortBy === "date")
        return (
          new Date(b.start_date || 0).getTime() -
          new Date(a.start_date || 0).getTime()
        );
      if (sortBy === "value")
        return (b.total_value || 0) - (a.total_value || 0);
      if (sortBy === "status")
        return (a.status || "").localeCompare(b.status || "");
      return 0;
    });
  }, [accessibleContracts, searchQuery, typeFilter, statusFilter, sortBy]);

  return {
    contracts: accessibleContracts,
    setContracts,
    clients,
    tariffs: accessibleTariffs,
    loading: initialLoading,
    refreshing,
    error,
    refresh,
    searchQuery,
    setSearchQuery,
    selectedContract,
    setSelectedContract,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    filterCounts,
    sortedContracts,
    currentDepartment: userDepartmentId,
    isDetailsOpen,
    setIsDetailsOpen,
  };
}
