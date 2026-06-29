// src/views/Clients.tsx
// Orchestration Component - فقط ترکیب کامپوننت‌های کوچکتر
// 📊 Refactor شده بر اساس تحلیل Graphify - Cohesion Community 4
// 🚀 Performance optimized با React.memo و useCallback

import { useState, useMemo, useEffect, useRef, useCallback } from"react";
import { useTheme } from"@app/providers/ThemeProvider";
import { clients as initialClients, contracts as initialContracts, contractTariffs } from"../data/mockData";
import { formatCurrency } from"@shared/lib/formatters";
import { exportToExcel } from"@shared/lib/exportToExcel";
import { usePersistedState } from"@shared/hooks/usePersistedState";
import { useClickOutside } from"@shared/hooks/useClickOutside";
import { validateNationalCode, validateNationalId, validateMobile } from"@shared/lib/validators";
import {
  calculateProgressFromTariffs,
  calculateInvoiceProgress,
  calculateUninvoicedWork,
} from"@entities/contract/services/contractCalculations";
import type { Client, Contract } from"../types/contract";

// 🔑 کامپوننت‌های استخراج‌شده
import { useClients } from"@features/client-management/hooks/useClients";
import { ClientList } from"@features/client-management/ui/ClientList";
import { ClientDetails } from"@features/client-management/ui/ClientDetails";
import { ClientForm } from"@features/client-management/ui/ClientForm";
import { ClientEditModal } from"@features/client-management/ui/ClientEditModal";
import { DuplicateWarningModal } from"@features/client-management/ui/DuplicateWarningModal";
import { ContractDetailsModal } from"@features/client-management/ui/ContractDetailsModal";

const CURRENT_DEPARTMENT ="Unit A";

export function Clients() {
  const { isDark } = useTheme();

  // 🔑 استفاده از hook سفارشی برای state management
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
  } = useClients();

  // 🔑 Local state برای مودال‌ها
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const [duplicateClient, setDuplicateClient] = useState<any>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{ field: string; client: any; message: string } | null>(null);
  const [newContactForDuplicate, setNewContactForDuplicate] = useState({ name:"", position:"", mobile:"", email:""});
  const [toastMessage, setToastMessage] = useState("");

  // 🔑 Refs برای useClickOutside
  const emailDropdownRef = useRef<HTMLDivElement>(null);
  const contactDropdownRef = useRef<HTMLDivElement>(null);

  // 🔑 بستن خودکار dropdown ها با کلیک بیرون
  useClickOutside(emailDropdownRef, () => {
    // این فقط برای dropdown های داخلی Clients.tsx هست
    // ولی چون dropdown ها در ClientDetails هستن، این خط فقط placeholder هست
  });

  // 🔑 Computed values - بهینه‌سازی شده با useMemo
  const totalValue = useMemo(() => {
    return filteredContracts.reduce((sum, c) => sum + c.total_value, 0);
  }, [filteredContracts]);

  const totalInvoiced = useMemo(() => {
    const contractIds = filteredContracts.map(c => c.id).filter((id): id is string => id !== undefined);
    return contractTariffs
      .filter(t => t.contract_id !== undefined && contractIds.includes(t.contract_id))
      .reduce((sum, t) => sum + (t.invoiced || 0), 0);
  }, [filteredContracts]);

  const totalUninvoicedWork = useMemo(() => {
    return filteredContracts.reduce((sum, contract) => {
      const tariffs = contractTariffs.filter(t => t.contract_id === contract.id);
      return sum + calculateUninvoicedWork(tariffs);
    }, 0);
  }, [filteredContracts]);

  // 🔑 Handlers - بهینه‌سازی شده با useCallback
  const handleCopyEmail = useCallback(async (email: string) => {
    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(email);
        success = true;
      } catch (err) {
        console.log("Clipboard API failed, trying fallback");
      }
    }
    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = email;
        textArea.style.position ="fixed";
        textArea.style.left ="-999999px";
        textArea.style.top ="-999999px";
        textArea.style.opacity ="0";
        textArea.setAttribute("readonly","");
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, email.length);
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
    }
    if (success) {
      setToastMessage("✅ Email address copied!");
    } else {
      setToastMessage("❌ Failed to copy email");
    }
    setTimeout(() => setToastMessage(""), 2500);
  }, []);

  const handleEditClick = useCallback(() => {
    if (!selectedClient) return;
    setIsEditModalOpen(true);
  }, [selectedClient]);

  const handleExportToExcel = useCallback(() => {
    const dataToExport = filteredClients.map((client) => ({"نام انگلیسی": client.name_en,"نام فارسی": client.name_fa,"نوع": client.type ==="LEGAL"?"حقوقی":"حقیقی","شناسه/کد ملی": client.national_id ||"-","شماره ثبت": (client as any).registration_no ||"-","کد اقتصادی": (client as any).economic_code ||"-","تلفن": client.phone ||"-","ایمیل": client.email ||"-","تعداد قراردادها": client.contracts,
    }));
    const filterName = filter ==="ALL"?"All": filter ==="LEGAL"?"Legal":"Individual";
    const today = new Date().toISOString().split("T")[0];
    exportToExcel(dataToExport, `${filterName}_Clients_${today}`,"Clients");
  }, [filteredClients, filter]);

  const handleAddClick = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleSaveAdd = useCallback((newClient: any) => {
    setClients([newClient, ...clients]);
    setSelectedClient(newClient);
    setIsAddModalOpen(false);
  }, [clients, setClients, setSelectedClient]);

  const handleSaveEdit = useCallback((updatedClient: Client) => {
    const updatedClients = clients.map((c) =>
      c.id === updatedClient.id ? updatedClient : c
    );
    setClients(updatedClients);
    setSelectedClient(updatedClient);
    setIsEditModalOpen(false);
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
      alert("Valid name and mobile required");
      return;
    }
    const updatedClients = clients.map((c) => {
      if (c.id === duplicateWarning.client.id) {
        const updated = { ...c };
        if (!updated.departments) updated.departments = [];
        if (!updated.departments.includes(CURRENT_DEPARTMENT)) {
          updated.departments.push(CURRENT_DEPARTMENT);
        }
        if (!updated.contactPersons) updated.contactPersons = [];
        updated.contactPersons.push({ ...newContactForDuplicate, id: Date.now().toString(), department: CURRENT_DEPARTMENT });
        updated.contacts = updated.contactPersons.length;
        return updated;
      }
      return c;
    });
    setClients(updatedClients);
    setSelectedClient(updatedClients.find((c) => c.id === duplicateWarning.client.id) || null);
    setIsAddModalOpen(false);
    setNewContactForDuplicate({ name:"", position:"", mobile:"", email:""});
    setDuplicateWarning(null);
  }, [clients, duplicateWarning, newContactForDuplicate, setClients, setSelectedClient]);

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
      />

      {/* RIGHT PANEL - ClientDetails */}
      <div className={`col-span-1 lg:col-span-8 flex flex-col rounded-xl panel-3d overflow-hidden transition-all duration-300 ease-in-out ${
        isDark ?'bg-slate-900 border-slate-700':'bg-white border-slate-200/70'}`}>
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
          currentDepartment={CURRENT_DEPARTMENT}
          onContractClick={setSelectedContract}
        />
      </div>

      {/* 🔑 ADD CLIENT MODAL */}
      <ClientForm
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setDuplicateWarning(null);
        }}
        onSave={handleSaveAdd}
        clients={clients}
        currentDepartment={CURRENT_DEPARTMENT}
        onDuplicateWarning={setDuplicateWarning}
      />

      {/* 🔑 EDIT CLIENT MODAL */}
      <ClientEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        client={selectedClient}
        currentDepartment={CURRENT_DEPARTMENT}
      />

      {/* 🔑 DUPLICATE WARNING MODAL */}
      <DuplicateWarningModal
        isOpen={isDuplicateWarningOpen}
        onClose={() => {
          setIsDuplicateWarningOpen(false);
          setDuplicateClient(null);
          setNewContactForDuplicate({ name:"", position:"", mobile:"", email:""});
        }}
        onSaveContact={handleAddContactToDuplicate}
        duplicateClient={duplicateClient}
        currentDepartment={CURRENT_DEPARTMENT}
      />

      {/* 🔑 CONTRACT DETAILS MODAL */}
      <ContractDetailsModal
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        contract={selectedContract}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}




