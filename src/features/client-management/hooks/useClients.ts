// src/features/client-management/hooks/useClients.ts

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Client, Contract, TariffLine } from "@entities/contract/types";

// 🔧 تغییر ۱: استفاده از usePermissionMapping به جای usePermission برای چک المان‌ها
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { useAuth } from "@features/auth/hooks/useAuth";
import { clientService } from "../services/ClientService";
import { contractService } from "@features/contract-management/services/ContractService";
import { tariffService } from "@features/contract-management/services/TariffService";

export function useClients() {
  const { canAccessElement } = usePermissionMapping();
  const { user } = useAuth();

  const userDepartmentId = user?.department || "";
  const isAdmin = user?.role === "admin"; // بای‌پس امن فقط برای ادمین واقعی

  // 🔐 تغییر ۲: بررسی دسترسی در سطح المان (طبق clientElements.ts)
  const canViewList = canAccessElement("client_list_item_view");

  // 📊 Data State
  const [clients, setClientsState] = useState<Client[]>([]);
  const [contracts, setContractsState] = useState<Contract[]>([]);
  const [tariffs, setTariffsState] = useState<TariffLine[]>([]);

  // 🔧 Progressive Loading State
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🎯 UI State
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

  // ═══════════════════════════════════════
  // 💾 Load Data
  // ═══════════════════════════════════════
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setInitialLoading(true);

    setError(null);

    try {
      const [dbClients, dbContracts, dbTariffs] = await Promise.all([
        clientService.getAll(),
        contractService.getAll(),
        tariffService.getAll(),
      ]);

      setClientsState(dbClients);
      setContractsState(dbContracts);
      setTariffsState(dbTariffs);
    } catch (err: any) {
      console.error("[useClients] Failed:", err);
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

  // ═══════════════════════════════════════
  // 📝 CRUD Operations
  // ═══════════════════════════════════════
  const setClients = useCallback(
    async (action: Client[] | ((prev: Client[]) => Client[])) => {
      try {
        const newClients =
          typeof action === "function" ? action(clients) : action;
        const currentIds = new Set(clients.map((c) => c.id));
        const newIds = new Set(newClients.map((c) => c.id));

        for (const client of newClients.filter((c) => !currentIds.has(c.id))) {
          await clientService.create(client);
        }
        for (const client of clients.filter((c) => !newIds.has(c.id))) {
          try {
            await clientService.delete(client.id);
          } catch (err) {
            console.error("Delete failed:", err);
          }
        }
        for (const client of newClients.filter((c) => {
          const prev = clients.find((pc) => pc.id === c.id);
          return prev && JSON.stringify(prev) !== JSON.stringify(c);
        })) {
          await clientService.update(client.id, client);
        }
        await loadData(true);
      } catch (err: any) {
        console.error("[useClients] Failed to update clients:", err);
        throw err;
      }
    },
    [clients, loadData],
  );

  // ═══════════════════════════════════════
  // 🔐 STRICT RBAC + ABAC Filtering (مهم‌ترین بخش)
  // ═══════════════════════════════════════
  const accessibleClients = useMemo(() => {
    // 🔧 اگر کاربر اصلاً دسترسی دیدن لیست را ندارد (و ادمین هم نیست)، آرایه خالی برگردان
    if (!canViewList && !isAdmin) {
      return [];
    }

    // 🔧 فیلتر سخت‌گیرانه بر اساس دپارتمان
    return clients.filter((client) => {
      if (isAdmin) return true; // ادمین همه را می‌بیند

      const clientDepartments = Array.isArray(client.departments)
        ? client.departments
        : [];
      const hasAccess = clientDepartments.includes(userDepartmentId);

      // 🔍 لاگ دیباگ برای ردیابی دقیق مشکل (فقط در حالت توسعه)
      if (!hasAccess) {
        console.warn(
          `[useClients] 🚫 Blocked client "${client.name_en}" (ID: ${client.id}). User dept: "${userDepartmentId}", Client depts:`,
          clientDepartments,
        );
      }

      return hasAccess;
    });
  }, [clients, canViewList, isAdmin, userDepartmentId]);

  const accessibleContracts = useMemo(() => {
    if (isAdmin) return contracts;

    const accessibleClientIds = new Set(accessibleClients.map((c) => c.id));
    return contracts.filter((c) => accessibleClientIds.has(c.client_id));
  }, [contracts, accessibleClients, isAdmin]);

  const accessibleTariffs = useMemo(() => {
    const accessibleContractIds = new Set(accessibleContracts.map((c) => c.id));
    return tariffs.filter(
      (t) => t.contract_id && accessibleContractIds.has(t.contract_id),
    );
  }, [tariffs, accessibleContracts]);

  // ═══════════════════════════════════════
  // 🎯 Derived State
  // ═══════════════════════════════════════
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

  // ═══════════════════════════════════════
  // 📤 Return
  // ═══════════════════════════════════════
  return {
    clients: accessibleClients, // 🔧 فقط مشتریان مجاز برگردانده می‌شوند
    setClients,
    contracts: accessibleContracts,
    loading: initialLoading,
    refreshing,
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
    contractTariffs: accessibleTariffs,
    currentDepartment: userDepartmentId,
  };
}
