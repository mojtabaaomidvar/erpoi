// src/pages/Clients.tsx

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { exportToExcel } from "@shared/lib/exportToExcel";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";

// 🔑 کامپوننت‌های استخراج‌شده
import { useClients } from "@features/client-management/hooks/useClients";
import { ClientList } from "@features/client-management/ui/ClientList";
import { ClientDetails } from "@features/client-management/ui/ClientDetails";
import { ClientForm } from "@features/client-management/ui/ClientForm";
import { ContractDetailsModal } from "@features/client-management/ui/ContractDetailsModal";
import { ClientEditModal } from "@features/client-management/ui/ClientEditModal";
import type { Client, Contract } from "@entities/contract/types";
import { departmentService } from "@shared/authorization/services/DepartmentService";

export function Clients() {
  const { isDark } = useTheme();

  const [departments, setDepartments] = useState<any[]>([]);

  const {
    clients,
    setClients,
    contracts,
    loading,
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
    contractTariffs,
    currentDepartment,
  } = useClients();

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await departmentService.getAll();
        setDepartments(depts);
      } catch (error) {
        console.error("Failed to load departments:", error);
      }
    };
    loadDepartments();
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  // ═══════════════════════════════════════
  // 🎯 HANDLERS
  // ═══════════════════════════════════════

  const handleAddClick = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleAddSave = useCallback(
    async (formData: any) => {
      try {
        const newClient = {
          id: `c${Date.now()}`,
          ...formData,
          contracts: 0,
          contacts: formData.contactPersons?.length || 0,
        };
        await setClients([newClient, ...clients]);
        setSelectedClient(newClient);
      } catch (err: any) {
        showToast(
          "error",
          "Save Failed",
          err.message || "Failed to create client",
        );
      }
    },
    [clients, setClients, setSelectedClient],
  );

  const handleEditClick = useCallback(() => {
    if (!selectedClient) return;
    setEditingClient(selectedClient);
    setIsEditModalOpen(true);
  }, [selectedClient]);

  const handleEditSave = useCallback(
    async (updatedClient: Client) => {
      try {
        const updatedClients = clients.map((c) =>
          c.id === updatedClient.id ? updatedClient : c,
        );
        await setClients(updatedClients);
        setSelectedClient(updatedClient);
        setIsEditModalOpen(false);
        setEditingClient(null);
      } catch (err: any) {
        showToast(
          "error",
          "Save Failed",
          err.message || "Failed to update client",
        );
      }
    },
    [clients, setClients, setSelectedClient],
  );

  const handleExportToExcel = useCallback(async () => {
    const confirmed = await confirmDialog({
      title: "Export Clients",
      message: `Are you sure you want to export ${filteredClients.length} clients to Excel?`,
      confirmText: "Export",
      variant: "info",
    });

    if (!confirmed) return;

    const dataToExport = filteredClients.map((c) => ({
      "نام انگلیسی": c.name_en,
      "نام فارسی": c.name_fa,
      نوع: c.type === "LEGAL" ? "حقوقی" : "حقیقی",
      "کد ملی": c.national_id,
      تلفن: c.phone,
      ایمیل: c.email,
    }));
    const filterName =
      filter === "ALL" ? "All" : filter === "LEGAL" ? "Legal" : "Individual";
    const today = new Date().toISOString().split("T")[0];
    exportToExcel(dataToExport, `${filterName}_Clients_${today}`, "Clients");
    showToast(
      "success",
      "Export Successful",
      `${filteredClients.length} clients exported`,
    );
  }, [filteredClients, filter]);

  const handleContractClick = useCallback(
    (contract: Contract) => {
      setSelectedContract(contract);
    },
    [setSelectedContract],
  );

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
            Failed to Load Clients
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
        {/* LEFT PANEL - ClientList */}
        <ClientList
          clients={clients}
          filteredClients={filteredClients}
          contracts={contracts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filter={filter}
          setFilter={setFilter}
          clientCounts={clientCounts}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          onAddClick={handleAddClick}
          onExport={handleExportToExcel}
        />

        {/* RIGHT PANEL - ClientDetails */}
        <div
          className={`col-span-1 lg:col-span-8 flex flex-col rounded-2xl overflow-hidden h-full transition-all duration-300 ${
            isDark
              ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl shadow-black/30"
              : "bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 border border-slate-200/70 shadow-xl shadow-slate-200/50"
          }`}
        >
          <ClientDetails
            client={selectedClient}
            contracts={contracts}
            clientContracts={clientContracts}
            filteredContracts={filteredContracts}
            contractTab={contractTab}
            setContractTab={setContractTab}
            contractTariffs={contractTariffs}
            onEdit={handleEditClick}
            onClose={() => setSelectedClient(null)}
            currentDepartment={currentDepartment}
            onContractClick={handleContractClick}
          />
        </div>

        {/* 🔑 ADD CLIENT MODAL */}
        <ClientForm
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddSave}
          clients={clients}
          currentDepartment={currentDepartment}
          departments={departments}
          mode="add"
        />

        {/* 🔑 EDIT CLIENT MODAL */}
        <ClientEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingClient(null);
          }}
          onSave={handleEditSave}
          client={editingClient}
          currentDepartment={currentDepartment}
        />

        {/* 🔑 CONTRACT DETAILS MODAL */}
        <ContractDetailsModal
          isOpen={!!selectedContract}
          onClose={() => setSelectedContract(null)}
          contract={selectedContract}
          contractTariffs={contractTariffs}
        />
      </div>
    </>
  );
}
