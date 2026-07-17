// src/features/contract-management/hooks/useContracts.ts

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Contract, Client, TariffLine } from "@entities/contract/types"; // 🔧 FIX: اضافه کردن TariffLine
import { usePermission } from "@shared/authorization/hooks/usePermission";
import { useAuth } from "@features/auth/hooks/useAuth";
import { contractService } from "../services/ContractService";
import { clientService } from "@features/client-management/services/ClientService";
import { tariffService } from "../services/TariffService";

type ContractStatusFilter =
  | "ALL"
  | "ACTIVE"
  | "NOT_STARTED"
  | "NEEDS_REVIEW"
  | "COMPLETED";

export function useContracts() {
  const { can } = usePermission();
  const { user } = useAuth();

  const userDepartmentId = user?.department || "";

  const canRead = can("contract:read");
  const canViewAllContracts = can("contract:view_all");
  const canViewOwnContracts = can("contract:view_own");

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
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }

    setError(null);

    try {
      // 🔧 FIX: اضافه کردن dbTariffs در destructuring
      const [dbContracts, dbClients, dbTariffs] = await Promise.all([
        contractService.getAll(),
        clientService.getAll(),
        tariffService.getAll(),
      ]);

      setContractsState(dbContracts);
      setClientsState(dbClients);
      setTariffsState(dbTariffs);

      console.log("[useContracts] ✅ Loaded:", {
        contracts: dbContracts.length,
        clients: dbClients.length,
        tariffs: dbTariffs.length,
      });
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

  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const setContracts = useCallback(
    async (action: Contract[] | ((prev: Contract[]) => Contract[])) => {
      try {
        const newContracts =
          typeof action === "function" ? action(contracts) : action;
        const currentIds = new Set(contracts.map((c) => c.id));
        const newIds = new Set(newContracts.map((c) => c.id));

        for (const contract of newContracts.filter(
          (c) => !currentIds.has(c.id),
        )) {
          await contractService.create(contract);
        }

        for (const contract of contracts.filter((c) => !newIds.has(c.id))) {
          try {
            await contractService.delete(contract.id);
          } catch (err: any) {
            console.error("[useContracts] Failed to delete contract:", err);
          }
        }

        for (const contract of newContracts.filter((c) => {
          const prev = contracts.find((pc) => pc.id === c.id);
          return prev && JSON.stringify(prev) !== JSON.stringify(c);
        })) {
          await contractService.update(contract.id, contract);
        }

        await loadData(true);
      } catch (err: any) {
        console.error("[useContracts] Failed to update contracts:", err);
        throw err;
      }
    },
    [contracts, loadData],
  );

  const accessibleContracts = useMemo(() => {
    // فیلتر کردن بر اساس دپارتمان کاربر و وضعیت Draft
    return contracts.filter((contract) => {
      // ۱. قرارداد باید متعلق به دپارتمان فعلی کاربر باشد
      if (contract.department !== userDepartmentId) {
        return false;
      }

      // ۲. اگر قرارداد Draft است، فقط سازنده آن (خود کاربر) باید آن را ببیند
      if (contract.status === "DRAFT" && contract.created_by !== user?.id) {
        return false;
      }

      return true;
    });
  }, [contracts, userDepartmentId, user?.id]);

  const accessibleTariffs = useMemo(() => {
    const accessibleContractIds = accessibleContracts.map((c) => c.id);
    return tariffs.filter(
      (t) => t.contract_id && accessibleContractIds.includes(t.contract_id),
    );
  }, [tariffs, accessibleContracts]);

  const baseContracts = accessibleContracts;

  const filterCounts = useMemo(
    () => ({
      ALL: accessibleContracts.length,
      ACTIVE: accessibleContracts.filter((c) => c.status === "ACTIVE").length,
      NOT_STARTED: accessibleContracts.filter(
        (c) => (c.status as string) === "NOT_STARTED",
      ).length,
      NEEDS_REVIEW: accessibleContracts.filter(
        (c) => (c.status as string) === "NEEDS_REVIEW",
      ).length,
      COMPLETED: accessibleContracts.filter((c) => c.status === "COMPLETED")
        .length,
    }),
    [accessibleContracts],
  );

  const filteredContracts = useMemo(() => {
    let result = accessibleContracts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (contract) =>
          (contract.contract_no &&
            contract.contract_no.toLowerCase().includes(query)) ||
          (contract.contract_title &&
            contract.contract_title.toLowerCase().includes(query)) ||
          (contract.client_name &&
            contract.client_name.toLowerCase().includes(query)),
      );
    }

    if (typeFilter !== "ALL") {
      result = result.filter((c) => c.type === typeFilter);
    }

    if (statusFilter !== "ALL") {
      result = result.filter((c) => (c.status as string) === statusFilter);
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.start_date || 0).getTime() -
          new Date(a.start_date || 0).getTime()
        );
      }
      if (sortBy === "value") {
        return (b.total_value || 0) - (a.total_value || 0);
      }
      if (sortBy === "status") {
        return (a.status || "").localeCompare(b.status || "");
      }
      return 0;
    });

    return result;
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
    isDetailsOpen,
    setIsDetailsOpen,
    baseContracts,
    filterCounts,
    filteredContracts,
    currentDepartment: userDepartmentId,
  };
}
