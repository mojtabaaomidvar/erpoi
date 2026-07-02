// src/pages/Clients.tsx

import { useState, useRef, useCallback } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { exportToExcel } from "@shared/lib/exportToExcel";
import { validateMobile } from "@shared/lib/validators";
import type { Client } from "../types/contract";

// 🔐 RBAC Imports
import { usePermission } from "@shared/authorization/hooks/usePermission";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";

// 🔑 کامپوننت‌های استخراج‌شده
import { useClients } from "@features/client-management/hooks/useClients";
import { ClientList } from "@features/client-management/ui/ClientList";
import { ClientDetails } from "@features/client-management/ui/ClientDetails";
import { ClientForm } from "@features/client-management/ui/ClientForm";
import { ClientEditModal } from "@features/client-management/ui/ClientEditModal";
import { DuplicateWarningModal } from "@features/client-management/ui/DuplicateWarningModal";
import { ContractDetailsModal } from "@features/client-management/ui/ContractDetailsModal";

export function Clients() {
  // ═══════════════════════════════════════
  // 🎯 ALL HOOKS MUST BE AT THE TOP
  // ═══════════════════════════════════════
  
  const { isDark } = useTheme();
  const { can } = usePermission();
  
  const canCreate = can('client:create');
  const canUpdate = can('client:update');
  const canDelete = can('client:delete');
  const canExport = can('client:export');
  const canRead = can('client:read');

  console.log('[Clients] Permissions:', { canCreate, canUpdate, canDelete, canExport, canRead });

  const {
    clients,
    setClients,
    contracts,
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
    contractTariffs,
    currentDepartment,
  } = useClients();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const [duplicateClient, setDuplicateClient] = useState<any>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ field: string; client: any; message: string } | null>(null);
  const [newContactForDuplicate, setNewContactForDuplicate] = useState({ name: "", position: "", mobile: "", email: "" });

  const emailDropdownRef = useRef<HTMLDivElement>(null);
  const contactDropdownRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════
  // 🎯 ALL useCallback HOOKS
  // ═══════════════════════════════════════

  const handleEditClick = useCallback(() => {
    if (!canUpdate) {
      showToast('error', 'Access Denied', 'You do not have permission to edit clients');
      return;
    }
    if (!selectedClient) return;
    setIsEditModalOpen(true);
  }, [selectedClient, canUpdate]);

  const handleDeleteClick = useCallback(async () => {
    if (!canDelete) {
      showToast('error', 'Access Denied', 'You do not have permission to delete clients');
      return;
    }
    if (!selectedClient) return;

    const confirmed = await confirmDialog({
      title: 'Delete Client',
      message: `Are you sure you want to delete "${selectedClient.name_en}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setClients(clients.filter(c => c.id !== selectedClient.id));
      setSelectedClient(null);
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message || 'Failed to delete client');
    }
  }, [selectedClient, clients, setClients, setSelectedClient, canDelete]);

  const handleExportToExcel = useCallback(async () => {
    if (!canExport) {
      showToast('error', 'Access Denied', 'You do not have permission to export clients');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Export Clients',
      message: `Are you sure you want to export ${filteredClients.length} clients to Excel?`,
      confirmText: 'Export',
      variant: 'info',
    });

    if (!confirmed) return;

    const dataToExport = filteredClients.map((client) => ({
      "نام انگلیسی": client.name_en,
      "نام فارسی": client.name_fa,
      "نوع": client.type === "LEGAL" ? "حقوقی" : "حقیقی",
      "شناسه/کد ملی": client.national_id || "-",
      "شماره ثبت": (client as any).registration_no || "-",
      "کد اقتصادی": (client as any).economic_code || "-",
      "تلفن": client.phone || "-",
      "ایمیل": client.email || "-",
      "تعداد قراردادها": client.contracts,
    }));
    const filterName = filter === "ALL" ? "All" : filter === "LEGAL" ? "Legal" : "Individual";
    const today = new Date().toISOString().split("T")[0];
    exportToExcel(dataToExport, `${filterName}_Clients_${today}`, "Clients");
    showToast('success', 'Export Successful', `${filteredClients.length} clients exported to Excel`);
  }, [filteredClients, filter, canExport]);

  const handleAddClick = useCallback(() => {
    if (!canCreate) {
      showToast('error', 'Access Denied', 'You do not have permission to create clients');
      return;
    }
    setIsAddModalOpen(true);
  }, [canCreate]);

  const handleSaveAdd = useCallback(async (newClient: any) => {
    try {
      setClients([newClient, ...clients]);
      setSelectedClient(newClient);
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message || 'Failed to save client');
    }
  }, [clients, setClients, setSelectedClient]);

  const handleSaveEdit = useCallback(async (updatedClient: Client) => {
    try {
      const updatedClients = clients.map((c) =>
        c.id === updatedClient.id ? updatedClient : c
      );
      setClients(updatedClients);
      setSelectedClient(updatedClient);
      setIsEditModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message || 'Failed to update client');
    }
  }, [clients, setClients, setSelectedClient]);

  const handleViewDuplicate = useCallback(() => {
    if (duplicateWarning) {
      setDuplicateClient(duplicateWarning.client);
      setIsDuplicateWarningOpen(true);
      setIsAddModalOpen(false);
    }
  }, [duplicateWarning]);

  const handleAddContactToDuplicate = useCallback(async () => {
    if (!duplicateWarning || !newContactForDuplicate.name.trim() || !validateMobile(newContactForDuplicate.mobile)) {
      showToast('error', 'Validation Error', 'Valid name and mobile required');
      return;
    }
    
    try {
      const updatedClients = clients.map((c) => {
        if (c.id === duplicateWarning.client.id) {
          const updated = { ...c };
          if (!updated.departments) updated.departments = [];
          if (!updated.departments.includes(currentDepartment)) {
            updated.departments.push(currentDepartment);
          }
          if (!updated.contactPersons) updated.contactPersons = [];
          updated.contactPersons.push({ 
            ...newContactForDuplicate, 
            id: String(Date.now()), 
            department: currentDepartment 
          });
          updated.contacts = updated.contactPersons.length;
          return updated;
        }
        return c;
      });
      setClients(updatedClients);
      setSelectedClient(updatedClients.find((c) => c.id === duplicateWarning.client.id) || null);
      setIsAddModalOpen(false);
      setNewContactForDuplicate({ name: "", position: "", mobile: "", email: "" });
      setDuplicateWarning(null);
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message || 'Failed to add contact');
    }
  }, [clients, duplicateWarning, newContactForDuplicate, setClients, setSelectedClient, currentDepartment]);

  // ═══════════════════════════════════════
  // 🎯 CONDITIONAL RETURNS (AFTER ALL HOOKS)
  // ═══════════════════════════════════════
  
  if (!canRead) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Access Denied
          </h2>
          <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            You don't have permission to view clients. Please contact your administrator.
          </p>
          <div className={`text-xs p-3 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
            <strong>Required Permission:</strong> <code>client:read</code>
          </div>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Loading clients from database...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Failed to Load Clients
          </h2>
          <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
  // 🎯 MAIN RENDER
  // ═══════════════════════════════════════

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 p-3 lg:p-6 h-auto lg:h-[calc(100vh-140px)]">
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
        canCreate={canCreate}
        canExport={canExport}
        canRead={canRead}
      />

      {/* RIGHT PANEL - ClientDetails */}
      <div className={`col-span-1 lg:col-span-8 flex flex-col rounded-xl panel-3d overflow-hidden transition-all duration-300 ease-in-out ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200/70'}`}>
        <ClientDetails
          client={selectedClient}
          contracts={contracts}
          clientContracts={clientContracts}
          filteredContracts={filteredContracts}
          contractTab={contractTab}
          setContractTab={setContractTab}
          contractTariffs={contractTariffs}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onClose={() => setSelectedClient(null)}
          currentDepartment={currentDepartment}
          onContractClick={setSelectedContract}
          canUpdate={canUpdate}
          canDelete={canDelete}
          canRead={canRead}
        />
      </div>

      {/* 🔑 ADD CLIENT MODAL */}
      {canCreate && (
        <ClientForm
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setDuplicateWarning(null);
          }}
          onSave={handleSaveAdd}
          clients={clients}
          currentDepartment={currentDepartment}
          onDuplicateWarning={setDuplicateWarning}
        />
      )}

      {/* 🔑 EDIT CLIENT MODAL */}
      {canUpdate && (
        <ClientEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          client={selectedClient}
          currentDepartment={currentDepartment}
        />
      )}

      {/* 🔑 DUPLICATE WARNING MODAL */}
      <DuplicateWarningModal
        isOpen={isDuplicateWarningOpen}
        onClose={() => {
          setIsDuplicateWarningOpen(false);
          setDuplicateClient(null);
          setNewContactForDuplicate({ name: "", position: "", mobile: "", email: "" });
        }}
        onSaveContact={handleAddContactToDuplicate}
        duplicateClient={duplicateClient}
        currentDepartment={currentDepartment}
      />

      {/* 🔑 CONTRACT DETAILS MODAL */}
      <ContractDetailsModal
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        contract={selectedContract}
      />
    </div>
  );
}