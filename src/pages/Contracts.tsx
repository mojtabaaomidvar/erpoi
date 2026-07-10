// src/pages/Contracts.tsx

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Badge, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { exportToExcel } from "@shared/lib/exportToExcel";
import { formatCurrency } from "@shared/lib/formatters";
import {
  calculateProgressFromTariffs,
  getProgressColor,
  generateContractNo,
  getInvoicedPercentage,
} from "@entities/contract/services/contractCalculations";
import type { Contract, ContractAmendment } from "@entities/contract/types";

import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { tariffService } from "@features/contract-management/services/TariffService";
import { amendmentService } from "@features/contract-management/services/AmendmentService";
import {
  sortContractsByPriority,
  getContractActionPriority,
} from "@features/contract-management/utils/contractPriority";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useContracts } from "@features/contract-management/hooks/useContracts";
import { ContractList } from "@features/contract-management/ui/ContractList";
import { ContractDetails } from "@features/contract-management/ui/ContractDetails";
import { ContractAddForm } from "@features/contract-management/ui/ContractAddForm";
import { ContractEditForm } from "@features/contract-management/ui/ContractEditForm";
import { useEvent, EVENT_TYPES } from "@infra/events";

export function Contracts() {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const {
    contracts,
    setContracts,
    clients,
    tariffs,
    loading,
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
    currentDepartment,
  } = useContracts();

  useEvent(EVENT_TYPES.AMENDMENT_CREATED, () => {
    console.log("[Contracts] Amendment created, refreshing list...");
    refresh();
  });

  useEvent(EVENT_TYPES.AMENDMENT_APPROVED, () => {
    console.log("[Contracts] Amendment approved, refreshing list...");
    refresh();
  });

  useEvent(EVENT_TYPES.AMENDMENT_REJECTED, () => {
    console.log("[Contracts] Amendment rejected, refreshing list...");
    refresh();
  });

  const [amendmentsMap, setAmendmentsMap] = useState<
    Map<string, ContractAmendment[]>
  >(new Map());

  // بارگذاری amendments همه قراردادها
  useEffect(() => {
    const loadAllAmendments = async () => {
      const newMap = new Map<string, ContractAmendment[]>();

      for (const contract of contracts) {
        try {
          const amendments = await amendmentService.getByContractId(
            contract.id,
          );
          newMap.set(contract.id, amendments);
        } catch (error) {
          console.error(
            `[Contracts] Failed to load amendments for ${contract.id}:`,
            error,
          );
          newMap.set(contract.id, []);
        }
      }

      setAmendmentsMap(newMap);
    };

    if (contracts.length > 0) {
      loadAllAmendments();
    }
  }, [contracts]);

  // مرتب‌سازی قراردادها بر اساس اولویت
  const prioritizedContracts = useMemo(() => {
    return sortContractsByPriority(
      filteredContracts,
      amendmentsMap,
      user?.role || "user",
    );
  }, [filteredContracts, amendmentsMap, user?.role]);

  // محاسبه اولویت هر قرارداد (برای نمایش Badge)
  const contractPriorities = useMemo(() => {
    const priorities = new Map<
      string,
      ReturnType<typeof getContractActionPriority>
    >();
    contracts.forEach((contract) => {
      priorities.set(
        contract.id,
        getContractActionPriority(
          contract,
          amendmentsMap.get(contract.id) || [],
          user?.role || "user",
        ),
      );
    });
    return priorities;
  }, [contracts, amendmentsMap, user?.role]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const [isClientContractsOpen, setIsClientContractsOpen] = useState(false);
  const [clientContractsList, setClientContractsList] = useState<Contract[]>(
    [],
  );
  const [selectedClientForView, setSelectedClientForView] = useState<any>(null);
  const [viewFilterType, setViewFilterType] = useState<
    "ALL" | "CONTRACT" | "WORK_ORDER"
  >("ALL");
  const [viewFilterStatus, setViewFilterStatus] = useState<string>("ALL");

  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [contractToComplete, setContractToComplete] = useState<Contract | null>(
    null,
  );
  const [completeReason, setCompleteReason] = useState("");

  useEffect(() => {
    const returnData = localStorage.getItem("returnToContract");
    if (returnData && isAddModalOpen) {
      localStorage.removeItem("returnToContract");
    }
  }, [isAddModalOpen]);

  // ═══════════════════════════════════════
  // 🎯 HANDLERS
  // ═══════════════════════════════════════

  const handleAddClick = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  // 🔧 FIX: handleAddSave با ذخیره تعرفه‌ها در Supabase
  const handleAddSave = useCallback(
    async (formData: any) => {
      try {
        const client = clients.find((c: any) => c.id === formData.client_id);
        const contractId = `ct${Date.now()}`;

        const newContract: Contract = {
          id: contractId,
          contract_no: formData.contract_no,
          external_contract_no: formData.external_contract_no,
          source_type: formData.source_type,
          source_ref: formData.source_ref,
          source_file: formData.source_file,
          source_file_object: formData.source_file_object,
          source_letter_date: formData.source_letter_date,
          source_letter_image: formData.source_letter_image,
          source_letter_image_object: formData.source_letter_image_object,
          source_letter_image_preview: formData.source_letter_image_preview,
          source_email_from: formData.source_email_from,
          source_email_date: formData.source_email_date,
          client_id: formData.client_id,
          client_name: client?.name_en || "N/A",
          contract_title: formData.contract_title,
          start_date: formData.start_date,
          end_date: formData.end_date,
          total_value: formData.total_value,
          invoiced: 0,
          currency: formData.currency,
          status: formData.status,
          type: formData.type,
          tariffs: formData.tariffs.length,
          contract_count: formData.contract_count,
          tariffLines: formData.tariffs,
          department: currentDepartment,
          description: formData.description,
          financial_terms: {
            adjustment: formData.adjustment,
            payment_method: formData.payment_method,
            payment_terms: formData.payment_terms,
            advance_payment: formData.advance_payment,
            retention: formData.retention,
            warranty_period: formData.warranty_period,
            penalty_clause: formData.penalty_clause,
          },
          service_description: formData.service_description,
        };

        // 🔧 NEW: ذخیره قرارداد در Supabase
        await setContracts([newContract, ...contracts]);

        // 🔧 NEW: ذخیره تعرفه‌ها در Supabase
        if (formData.tariffs && formData.tariffs.length > 0) {
          console.log("[Contracts] Saving tariffs:", formData.tariffs.length);
          for (const tariff of formData.tariffs) {
            await tariffService.create({
              contract_id: contractId,
              description: tariff.description,
              unit: tariff.unit,
              rate:
                typeof tariff.rate === "string"
                  ? Number(tariff.rate.replace(/,/g, "")) || 0
                  : tariff.rate || 0,
              consumed_quantity: tariff.consumed_quantity || 0,
              invoiced: tariff.invoiced || 0,
            });
          }
        }

        setSelectedContract(newContract);
        setIsDetailsOpen(true);

        // 🔧 NEW: Refresh tariffs
        refresh();
      } catch (err: any) {
        console.error("[Contracts] Add failed:", err);
        showToast(
          "error",
          "Save Failed",
          err.message || "Failed to create contract",
        );
      }
    },
    [
      clients,
      contracts,
      setContracts,
      setSelectedContract,
      currentDepartment,
      refresh,
    ],
  );

  const handleEditClick = useCallback(() => {
    if (!selectedContract) return;
    setEditingContract(selectedContract);
    setIsEditModalOpen(true);
  }, [selectedContract]);

  // 🔧 FIX: handleEditSave با ذخیره تعرفه‌ها در Supabase
  const handleEditSave = useCallback(
    async (formData: any) => {
      if (!editingContract) return;
      try {
        const updatedContracts = contracts.map((c) =>
          c.id === editingContract.id ? { ...c, ...formData } : c,
        );
        await setContracts(updatedContracts);

        // 🔧 NEW: حذف تعرفه‌های قدیمی و ذخیره تعرفه‌های جدید
        if (formData.tariffs && formData.tariffs.length > 0) {
          console.log("[Contracts] Updating tariffs:", formData.tariffs.length);

          // حذف تعرفه‌های قدیمی
          const oldTariffs = await tariffService.getByContractId(
            editingContract.id,
          );
          for (const oldTariff of oldTariffs) {
            await tariffService.delete(oldTariff.id);
          }

          // ذخیره تعرفه‌های جدید
          for (const tariff of formData.tariffs) {
            await tariffService.create({
              contract_id: editingContract.id,
              description: tariff.description,
              unit: tariff.unit,
              rate:
                typeof tariff.rate === "string"
                  ? Number(tariff.rate.replace(/,/g, "")) || 0
                  : tariff.rate || 0,
              consumed_quantity: tariff.consumed_quantity || 0,
              invoiced: tariff.invoiced || 0,
            });
          }
        }

        setSelectedContract({ ...editingContract, ...formData });
        setIsEditModalOpen(false);
        setEditingContract(null);

        // 🔧 NEW: Refresh tariffs
        refresh();
      } catch (err: any) {
        console.error("[Contracts] Edit failed:", err);
        showToast(
          "error",
          "Save Failed",
          err.message || "Failed to update contract",
        );
      }
    },
    [editingContract, contracts, setContracts, setSelectedContract, refresh],
  );

  const handleExportToExcel = useCallback(async () => {
    const confirmed = await confirmDialog({
      title: "Export Contracts",
      message: `Are you sure you want to export ${filteredContracts.length} contracts to Excel?`,
      confirmText: "Export",
      variant: "info",
    });

    if (!confirmed) return;

    const dataToExport = filteredContracts.map((c) => ({
      "شماره داخلی": c.contract_no,
      نوع: c.type === "CONTRACT" ? "قرارداد" : "سفارش کار",
      مشتری: c.client_name,
      عنوان: c.contract_title,
      وضعیت: c.status,
      "تاریخ شروع": c.start_date,
      "تاریخ پایان": c.end_date,
      "ارزش کل": c.total_value,
    }));
    const filterName =
      typeFilter === "ALL"
        ? "All"
        : typeFilter === "CONTRACT"
          ? "Contracts"
          : "WorkOrders";
    const today = new Date().toISOString().split("T")[0];
    exportToExcel(
      dataToExport,
      `${filterName}_Contracts_${today}`,
      "Contracts",
    );
    showToast(
      "success",
      "Export Successful",
      `${filteredContracts.length} contracts exported`,
    );
  }, [filteredContracts, typeFilter]);

  const handleRequestComplete = useCallback((contract: Contract) => {
    setContractToComplete(contract);
    setCompleteReason("");
    setConfirmCompleteOpen(true);
  }, []);

  const handleConfirmComplete = useCallback(async () => {
    if (!contractToComplete) return;
    try {
      const updatedContracts = contracts.map((c) =>
        c.id === contractToComplete.id
          ? { ...c, status: "COMPLETED" as const }
          : c,
      );
      await setContracts(updatedContracts);
      if (selectedContract?.id === contractToComplete.id) {
        setSelectedContract({ ...contractToComplete, status: "COMPLETED" });
      }
      setConfirmCompleteOpen(false);
      setContractToComplete(null);
      setCompleteReason("");
    } catch (err: any) {
      showToast(
        "error",
        "Update Failed",
        err.message || "Failed to complete contract",
      );
    }
  }, [
    contractToComplete,
    contracts,
    setContracts,
    selectedContract,
    setSelectedContract,
  ]);

  const handleNavigateToClients = useCallback(() => {
    localStorage.setItem(
      "returnToContract",
      JSON.stringify({ returnTo: "contracts" }),
    );
    window.dispatchEvent(
      new CustomEvent("navigateToClients", {
        detail: { returnTo: "contracts" },
      }),
    );
  }, []);

  const handleViewClientContracts = useCallback(
    (clientId: string) => {
      const existingContracts = contracts.filter(
        (c) => c.client_id === clientId && c.department === currentDepartment,
      );
      const client = clients.find((c: any) => c.id === clientId);
      setClientContractsList(existingContracts);
      setSelectedClientForView(client);
      setViewFilterStatus("ALL");
      setViewFilterType("ALL");
      setIsClientContractsOpen(true);
    },
    [contracts, clients, currentDepartment],
  );

  const filteredClientContracts = useMemo(() => {
    let result = clientContractsList;
    if (viewFilterType !== "ALL")
      result = result.filter((c) => c.type === viewFilterType);
    if (viewFilterStatus !== "ALL")
      result = result.filter((c) => c.status === viewFilterStatus);
    return result;
  }, [clientContractsList, viewFilterType, viewFilterStatus]);

  const clientContractCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: clientContractsList.length };
    clientContractsList.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [clientContractsList]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set(clientContractsList.map((c) => c.status));
    return Array.from(statuses);
  }, [clientContractsList]);

  // ═══════════════════════════════════════
  // 🎯 ERROR STATE (فقط error)
  // ═══════════════════════════════════════

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2
            className={`text-xl font-bold mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Failed to Load Contracts
          </h2>
          <p
            className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {error}
          </p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // 🎯 MAIN RENDER - Progressive Loading
  // ═══════════════════════════════════════

  return (
    <>
      {/* Refresh Indicator */}
      {refreshing && (
        <div
          className={`fixed top-20 right-4 z-50 px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium ${
            isDark ? "bg-indigo-600 text-white" : "bg-indigo-500 text-white"
          }`}
        >
          🔄 Refreshing...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 p-3 lg:p-4 h-[calc(100vh-6rem)]">
        {/* LEFT PANEL - ContractList */}
        <ContractList
          contracts={contracts}
          filteredContracts={prioritizedContracts}
          contractPriorities={contractPriorities}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedContract={selectedContract}
          setSelectedContract={(contract: Contract) => {
            setSelectedContract(contract);
            setIsDetailsOpen(true);
          }}
          onAddClick={handleAddClick}
          onExport={handleExportToExcel}
          loading={loading}
        />

        {/* RIGHT PANEL - ContractDetails */}
        <div
          className={`col-span-1 lg:col-span-8 flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
            isDark
              ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl shadow-black/30"
              : "bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 border border-slate-200/70 shadow-xl shadow-slate-200/50"
          }`}
        >
          <ContractDetails
            contract={selectedContract}
            onClose={() => {
              setSelectedContract(null);
              setIsDetailsOpen(false);
            }}
            onEdit={handleEditClick}
            onRequestComplete={handleRequestComplete}
            userRole={user?.role || "user"}
            loading={loading}
            contractTariffs={tariffs}
            clients={clients}
          />
        </div>

        {/* 🔑 ADD CONTRACT MODAL */}
        <ContractAddForm
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddSave}
          typeFilter={typeFilter}
          contracts={contracts}
          generateContractNo={(type, contracts) =>
            generateContractNo(type, contracts, currentDepartment)
          }
          onNavigateToClients={handleNavigateToClients}
        />

        {/* 🔑 EDIT CONTRACT MODAL */}
        {editingContract && (
          <ContractEditForm
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingContract(null);
            }}
            onSave={handleEditSave}
            contract={editingContract}
            onNavigateToClients={handleNavigateToClients}
          />
        )}

        {/* 🔑 MODAL نمایش قراردادهای قبلی مشتری */}
        <Modal
          isOpen={isClientContractsOpen}
          onClose={() => {
            setIsClientContractsOpen(false);
            setClientContractsList([]);
            setSelectedClientForView(null);
            setViewFilterType("ALL");
            setViewFilterStatus("ALL");
          }}
          title={`Previous Contracts — ${selectedClientForView?.name_en || ""}`}
          size="lg"
        >
          {selectedClientForView && (
            <div className="space-y-4">
              <div
                className={`rounded-lg border p-4 ${isDark ? "border-indigo-700 bg-indigo-950/50" : "border-indigo-200 bg-indigo-50/50"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold">
                    {selectedClientForView.name_en
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-primary">
                      {selectedClientForView.name_en}
                    </h3>
                    <p className="text-xs text-secondary" dir="rtl">
                      {selectedClientForView.name_fa}
                    </p>
                    <p className="text-xs font-medium mt-0.5 text-accent-indigo">
                      {clientContractsList.length}{" "}
                      {clientContractsList.length === 1
                        ? "contract"
                        : "contracts"}{" "}
                      in {currentDepartment}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 filter-group p-0.5 text-xs">
                <button
                  onClick={() => setViewFilterStatus("ALL")}
                  className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${
                    viewFilterStatus === "ALL"
                      ? isDark
                        ? "bg-indigo-900/40 text-indigo-300"
                        : "bg-indigo-50 text-indigo-700"
                      : isDark
                        ? "text-secondary hover:text-primary"
                        : "text-secondary hover:text-slate-700"
                  }`}
                >
                  All ({clientContractCounts.ALL || 0})
                </button>
                {availableStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setViewFilterStatus(status)}
                    className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${
                      viewFilterStatus === status
                        ? isDark
                          ? "bg-indigo-900/40 text-indigo-300"
                          : "bg-indigo-50 text-indigo-700"
                        : isDark
                          ? "text-secondary hover:text-primary"
                          : "text-secondary hover:text-slate-700"
                    }`}
                  >
                    {status === "ACTIVE" ? "🟢" : "⚫"} {status} (
                    {clientContractCounts[status] || 0})
                  </button>
                ))}
              </div>

              {filteredClientContracts.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm">
                    No contracts found with current filters
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredClientContracts.map((contract) => {
                    const progress = calculateProgressFromTariffs(contract);
                    return (
                      <div
                        key={contract.id}
                        className={`rounded-lg border p-3 transition-colors ${
                          isDark
                            ? "border-slate-700 hover:border-indigo-500"
                            : "border-slate-200 hover:border-indigo-300"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                tone={
                                  contract.type === "CONTRACT"
                                    ? "indigo"
                                    : "amber"
                                }
                              >
                                {contract.type === "CONTRACT"
                                  ? "Contract"
                                  : "Work Order"}
                              </Badge>
                              <span className="font-mono text-xs text-secondary">
                                {contract.contract_no}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-primary">
                              {contract.contract_title}
                            </h4>
                          </div>
                          <Badge
                            tone={
                              contract.status === "ACTIVE" ? "emerald" : "slate"
                            }
                          >
                            {contract.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-secondary">
                            {contract.start_date} → {contract.end_date}
                          </span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(
                              contract.total_value,
                              contract.currency,
                            )}
                          </span>
                        </div>
                        <div
                          className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                        >
                          <div
                            className={`h-full rounded-full ${getProgressColor(progress)}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-secondary mt-1">
                          {progress.toFixed(0)}% performed
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                className={`flex justify-end pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsClientContractsOpen(false);
                    setClientContractsList([]);
                    setSelectedClientForView(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* 🔑 MODAL تایید تکمیل قرارداد */}
        <Modal
          isOpen={confirmCompleteOpen}
          onClose={() => {
            setConfirmCompleteOpen(false);
            setContractToComplete(null);
            setCompleteReason("");
          }}
          title="Mark Contract as Completed"
          size="md"
        >
          {contractToComplete && (
            <div className="space-y-4">
              <div
                className={`rounded-lg border p-4 ${isDark ? "border-amber-700 bg-amber-900/30" : "border-amber-200 bg-amber-50"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div className="flex-1">
                    <h3
                      className={`text-sm font-semibold mb-1 ${isDark ? "text-amber-200" : "text-amber-900"}`}
                    >
                      Financial Review Required
                    </h3>
                    <p
                      className={`text-xs ${isDark ? "text-amber-300" : "text-amber-800"}`}
                    >
                      This contract has expired but invoiced amount is less than
                      total value. Please review and confirm completion.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg border border-theme bg-muted p-4`}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[10px] uppercase text-secondary font-semibold mb-1">
                      Contract No
                    </div>
                    <div className="font-mono text-xs text-primary">
                      {contractToComplete.contract_no}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-secondary font-semibold mb-1">
                      Client
                    </div>
                    <div className="text-xs text-primary">
                      {contractToComplete.client_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-secondary font-semibold mb-1">
                      Total Value
                    </div>
                    <div className="text-xs font-semibold text-accent-emerald">
                      {formatCurrency(
                        contractToComplete.total_value,
                        contractToComplete.currency,
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-secondary font-semibold mb-1">
                      Invoiced
                    </div>
                    <div className="text-xs font-semibold text-accent-indigo">
                      {formatCurrency(
                        contractToComplete.invoiced,
                        contractToComplete.currency,
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] uppercase text-secondary font-semibold mb-1">
                      Invoiced Percentage
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                      >
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${Math.min(getInvoicedPercentage(contractToComplete), 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-amber-600">
                        {getInvoicedPercentage(contractToComplete).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">
                  Reason for Completion (Optional)
                </label>
                <textarea
                  value={completeReason}
                  onChange={(e) => setCompleteReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                  placeholder="e.g., Final settlement reached, remaining amount waived..."
                />
              </div>

              <div
                className={`flex justify-end gap-3 pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    setConfirmCompleteOpen(false);
                    setContractToComplete(null);
                    setCompleteReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmComplete}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <span>✓</span>
                  <span>Confirm Completion</span>
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
