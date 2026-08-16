// src/pages/Clients.tsx

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { exportToExcel } from "@shared/lib/exportToExcel";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { useClients } from "@/features/client-management/hooks/useClients";

// 🔑 کامپوننت‌های استخراج‌شده
import { ClientList } from "@features/client-management/ui/ClientList";
import { ClientDetails } from "@features/client-management/ui/ClientDetails";
import { ClientForm } from "@features/client-management/ui/ClientForm";
import { ContractDetailsModal } from "@features/client-management/ui/ContractDetailsModal";
import { ClientEditModal } from "@features/client-management/ui/ClientEditModal";

import type { Client } from "@/features/client-management/domain/models/Client";
import type { Contract } from "@/entities/contract/types";

import { departmentAppService } from "@shared/authorization";
import { EmptyState } from "@shared/ui/EmptyState";
import { Button } from "@shared/ui/Button";
import { AlertTriangle } from "lucide-react";

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
    sortedClients,
    filteredClients,
    clientContracts,
    filteredContracts,
    contractTariffs,
    currentDepartment,
  } = useClients();

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const depts = await departmentAppService.getAll();
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
        // ✅ استفاده از as Client برای ارضای کامل تایپ‌اسکریپت در مرحله انتقال
        const newClient: Client = {
          id: `c${Date.now()}`,
          ...formData,
          contracts: 0,
          contacts: formData.contactPersons?.length || 0,
        } as unknown as Client;

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
        const updatedClients = clients.map((c: any) =>
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

    const dataToExport = filteredClients.map((c: any) => ({
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
      <EmptyState
        icon={AlertTriangle}
        title="Failed to Load Clients"
        description={error}
        action={
          <Button variant="primary" size="sm" onClick={refresh}>
            Retry
          </Button>
        }
        className="min-h-[600px]"
      />
    );
  }

  // ═══════════════════════════════════════
  // 🎯 MAIN RENDER - Progressive Loading
  // ═══════════════════════════════════════

  return (
    <>
      {refreshing && (
        <div className="fixed top-20 right-4 z-50 px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium gradient-accent">
          Refreshing...
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 p-3 lg:p-4 h-[calc(100vh-6rem)]">
        {/* LEFT PANEL - ClientList */}
        <ClientList
          sortedClients={sortedClients}
          contracts={contracts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filter={filter}
          setFilter={setFilter}
          clientCounts={clientCounts}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          onAddClick={handleAddClick}
          onExport={handleExportToExcel}
          loading={loading}
        />

        {/* RIGHT PANEL - ClientDetails */}
        <div className="col-span-1 lg:col-span-8 flex flex-col rounded-2xl overflow-hidden h-full transition-all duration-300 bg-[var(--color-card)] border border-[var(--color-border)] shadow-[var(--elevation-card)]">
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
