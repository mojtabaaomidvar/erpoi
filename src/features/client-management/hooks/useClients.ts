// src/features/client-management/hooks/useClients.ts

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Client, Contract, TariffLine } from "@entities/contract/types";

import { usePermission } from "@shared/authorization/hooks/usePermission";
import { useAuth } from "@features/auth/hooks/useAuth";
import { clientService } from "../services/ClientService";
import { contractService } from "@features/contract-management/services/ContractService";
import { tariffService } from "@features/contract-management/services/TariffService";

export function useClients() {
  const { can } = usePermission();
  const { user } = useAuth();

  const userDepartmentId = user?.department || "";

  // 🔐 RBAC
  const canViewAllClients = can("client:view_all");
  const canViewOwnClients = can("client:view_own");
  const canRead = can("client:read");
  const canViewAllContracts = can("contract:view_all");
  const canViewOwnContracts = can("contract:view_own");

  const [clients, setClientsState] = useState<Client[]>([]);
  const [contracts, setContractsState] = useState<Contract[]>([]);
  const [tariffs, setTariffsState] = useState<TariffLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filter, setFilter] = useState<"ALL" | "LEGAL" | "INDIVIDUAL">("ALL");
  const [contractTab, setContractTab] = useState<
    "ALL" | "CONTRACT" | "WORK_ORDER"
  >("ALL");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );
  const [sortBy, setSortBy] = useState<
    "name" | "contracts" | "value" | "recent"
  >("contracts");

  // 🔧 NEW: Load data از Supabase
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dbClients, dbContracts, dbTariffs] = await Promise.all([
        clientService.getAll(),
        contractService.getAll(),
        tariffService.getAll(),
      ]);

      setClientsState(dbClients);
      setContractsState(dbContracts);
      setTariffsState(dbTariffs);

      console.log("[useClients] ✅ Loaded from Supabase:", {
        clients: dbClients.length,
        contracts: dbContracts.length,
        tariffs: dbTariffs.length,
      });
    } catch (err: any) {
      console.error("[useClients] Failed to load data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 🔧 NEW: Refresh function برای manual refresh
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // 🔧 NEW: setClients با Supabase
  const setClients = useCallback(
    async (action: Client[] | ((prev: Client[]) => Client[])) => {
      try {
        const newClients =
          typeof action === "function" ? action(clients) : action;
        const currentIds = new Set(clients.map((c) => c.id));
        const newIds = new Set(newClients.map((c) => c.id));

        // Create new clients
        for (const client of newClients.filter((c) => !currentIds.has(c.id))) {
          await clientService.create(client);
        }

        // Delete removed clients
        for (const client of clients.filter((c) => !newIds.has(c.id))) {
          try {
            await clientService.delete(client.id);
          } catch (err: any) {
            console.error("[useClients] Failed to delete client:", err);
          }
        }

        // Update changed clients
        for (const client of newClients.filter((c) => {
          const prev = clients.find((pc) => pc.id === c.id);
          return prev && JSON.stringify(prev) !== JSON.stringify(c);
        })) {
          await clientService.update(client.id, client);
        }

        // Reload data
        await loadData();
      } catch (err: any) {
        console.error("[useClients] Failed to update clients:", err);
        throw err;
      }
    },
    [clients, loadData],
  );

  // ═══════════════════════════════════════
  // 🔐 RBAC: فیلتر مشتری‌ها بر اساس دپارتمان
  // ═══════════════════════════════════════

  const accessibleClients = useMemo(() => {
    if (canViewAllClients) {
      return clients;
    }

    if (canViewOwnClients || canRead) {
      if (!userDepartmentId) {
        return [];
      }

      return clients.filter((client) => {
        const clientDepartments = client.departments || [];
        return clientDepartments.includes(userDepartmentId);
      });
    }

    return [];
  }, [
    clients,
    canViewAllClients,
    canViewOwnClients,
    canRead,
    userDepartmentId,
  ]);

  // ═══════════════════════════════════════
  // 🔐 RBAC: فیلتر قراردادها
  // ═══════════════════════════════════════

  const accessibleContracts = useMemo(() => {
    if (canViewAllContracts) {
      return contracts;
    }
    if (canViewOwnContracts || canRead) {
      const accessibleClientIds = accessibleClients.map((c) => c.id);
      return contracts.filter((c) => accessibleClientIds.includes(c.client_id));
    }
    return [];
  }, [
    contracts,
    canViewAllContracts,
    canViewOwnContracts,
    canRead,
    accessibleClients,
  ]);

  // 🔧 NEW: فیلتر تعرفه‌ها بر اساس قراردادهای قابل دسترسی
  const accessibleTariffs = useMemo(() => {
    const accessibleContractIds = accessibleContracts.map((c) => c.id);
    return tariffs.filter(
      (t) => t.contract_id && accessibleContractIds.includes(t.contract_id),
    );
  }, [tariffs, accessibleContracts]);

  useEffect(() => {
    setContractTab("ALL");
  }, [selectedClient]);

  const clientCounts = useMemo(
    () => ({
      total: accessibleClients.length,
      legal: accessibleClients.filter((c) => c.type === "LEGAL").length,
      individual: accessibleClients.filter((c) => c.type === "INDIVIDUAL")
        .length,
    }),
    [accessibleClients],
  );

  const filteredClients = useMemo(() => {
    let result = accessibleClients.filter((client) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        client.name_en.toLowerCase().includes(query) ||
        client.name_fa.includes(query) ||
        (client.national_id && client.national_id.includes(query));
      const matchesFilter = filter === "ALL" || client.type === filter;
      return matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => {
      if (sortBy === "contracts") {
        const countA = accessibleContracts.filter(
          (c) => c.client_id === a.id,
        ).length;
        const countB = accessibleContracts.filter(
          (c) => c.client_id === b.id,
        ).length;
        if (countB !== countA) return countB - countA;
        return a.name_en.localeCompare(b.name_en);
      }
      if (sortBy === "name") return a.name_en.localeCompare(b.name_en);
      if (sortBy === "value") {
        const valA = accessibleContracts
          .filter((c) => c.client_id === a.id)
          .reduce((sum, c) => sum + c.total_value, 0);
        const valB = accessibleContracts
          .filter((c) => c.client_id === b.id)
          .reduce((sum, c) => sum + c.total_value, 0);
        if (valB !== valA) return valB - valA;
        return a.name_en.localeCompare(b.name_en);
      }
      if (sortBy === "recent") {
        const dateA = (a as any).createdAt
          ? new Date((a as any).createdAt).getTime()
          : 0;
        const dateB = (b as any).createdAt
          ? new Date((b as any).createdAt).getTime()
          : 0;
        if (dateB !== dateA) return dateB - dateA;
        return a.name_en.localeCompare(b.name_en);
      }
      return 0;
    });
  }, [searchQuery, filter, accessibleClients, sortBy, accessibleContracts]);

  useEffect(() => {
    if (
      selectedClient &&
      !filteredClients.find((c) => c.id === selectedClient.id)
    ) {
      setSelectedClient(filteredClients[0] || null);
    }
  }, [filter, filteredClients, selectedClient]);

  const clientContracts = selectedClient
    ? accessibleContracts.filter((c) => c.client_id === selectedClient.id)
    : [];

  const filteredContracts =
    contractTab === "ALL"
      ? clientContracts
      : clientContracts.filter((c) => c.type === contractTab);

  return {
    clients: accessibleClients,
    setClients,
    contracts: accessibleContracts,
    loading,
    error,
    refresh,
    searchQuery,
    setSearchQuery,
    selectedClient,
    setSelectedClient,
    filter,
    setFilter,
    contractTab,
    setContractTab,
    selectedContract,
    setSelectedContract,
    sortBy,
    setSortBy,
    clientCounts,
    filteredClients,
    clientContracts,
    filteredContracts,
    contractTariffs: accessibleTariffs, // 🔧 NEW: از Supabase
    currentDepartment: userDepartmentId,
  };
}
