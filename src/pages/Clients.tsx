// src/pages/Clients.tsx

import { useState, useMemo, useRef, useCallback } from "react";
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
  const { isDark } = useTheme();
  const { can } = usePermission();
  const canCreate = can('client:create');
  const canUpdate = can('client:update');
  const canDelete = can('client:delete');
  const canExport = can('client:export');
  const canRead = can('client:read');

  const {
    clients,
    setClients,
    contracts,
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

    setClients(clients.filter(c => c.id !== selectedClient.id));
    setSelectedClient(null);
    showToast('success', 'Client Deleted', `${selectedClient.name_en} has been removed`);
  }, [selectedClient, clients, setClients, setSelectedClient, canDelete]);

  // 🔐 RBAC: چک کردن permission + confirm dialog قبل از export
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

  // 🔐 RBAC: چک کردن permission قبل از ایجاد
  const handleAddClick = useCallback(() => {
    if (!canCreate) {
      showToast('error', 'Access Denied', 'You do not have permission to create clients');
      return;
    }
    setIsAddModalOpen(true);
  }, [canCreate]);

  const handleSaveAdd = useCallback((newClient: any) => {
    setClients([newClient, ...clients]);
    setSelectedClient(newClient);
    setIsAddModalOpen(false);
    showToast('success', 'Client Created', `${newClient.name_en} has been added successfully`);
  }, [clients, setClients, setSelectedClient]);

  const handleSaveEdit = useCallback((updatedClient: Client) => {
    const updatedClients = clients.map((c) =>
      c.id === updatedClient.id ? updatedClient : c
    );
    setClients(updatedClients);
    setSelectedClient(updatedClient);
    setIsEditModalOpen(false);
    showToast('success', 'Client Updated', `${updatedClient.name_en} has been updated successfully`);
  }, [clients, setClients, setSelectedClient]);

  const handleViewDuplicate = useCallback(() => {
    if (duplicateWarning) {
      setDuplicateClient(duplicateWarning.client);
      setIsDuplicateWarningOpen(true);
      setIsAddModalOpen(false);
    }
  }, [duplicateWarning]);

  const handleAddContactToDuplicate = useCallback(() => {
    if (!duplicateWarning || !newContactForDuplicate.name.trim() || !validateMobile(newContactForDuplicate.mobile)) {
      showToast('error', 'Validation Error', 'Valid name and mobile required');
      return;
    }
    const updatedClients = clients.map((c) => {
      if (c.id === duplicateWarning.client.id) {
        const updated = { ...c };
        if (!updated.departments) updated.departments = [];
        if (!updated.departments.includes(currentDepartment)) {
          updated.departments.push(currentDepartment);
        }
        if (!updated.contactPersons) updated.contactPersons = [];
        updated.contactPersons.push({ ...newContactForDuplicate, id: Date.now().toString(), department: currentDepartment });
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
    showToast('success', 'Contact Added', `New contact added to ${duplicateWarning.client.name_en}`);
  }, [clients, duplicateWarning, newContactForDuplicate, setClients, setSelectedClient, currentDepartment]);

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

      {/* 🔑 ADD CLIENT MODAL - فقط در صورت دسترسی رندر میشه */}
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

      {/* 🔑 EDIT CLIENT MODAL - فقط در صورت دسترسی رندر میشه */}
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