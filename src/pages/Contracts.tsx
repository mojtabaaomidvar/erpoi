// src/views/Contracts.tsx
// Orchestration Component - فقط ترکیب کامپوننت‌های کوچکتر
// 📊 Refactor شده بر اساس تحلیل Graphify - Cohesion Community 0

import { useState, useEffect, useMemo } from"react";
import { Button, Badge, Modal } from"@design-system";
import { useTheme } from"@app/providers/ThemeProvider";
import { clients as initialClients } from"../data/mockData";
import { exportToExcel } from"@shared/lib/exportToExcel";
import { formatCurrency } from"@shared/lib/formatters";
import {
  calculateProgressFromTariffs,
  getProgressColor,
  generateContractNo,
  getInvoicedPercentage,
} from"@entities/contract/services/contractCalculations";
import { ClientSelectorModal } from'@entities/client/ui/ClientSelectorModal';
import { ContractAttachmentsEditor } from'@entities/contract/ui/ContractAttachmentsEditor';
import { JalaaliDatePicker } from'@shared/ui/JalaaliDatePicker';
import { TariffEditor } from'@entities/contract/ui/TariffEditor';
import type { Contract, TariffLine } from"../types/contract";

// 🔑 کامپوننت‌های استخراج‌شده
import { useContracts } from"@features/contract-management/hooks/useContracts";
import { ContractList } from"@features/contract-management/ui/ContractList";
import { ContractDetails } from"@features/contract-management/ui/ContractDetails";
import { ContractForm } from"@features/contract-management/ui/ContractForm";

const CURRENT_DEPARTMENT ="Unit A";

export function Contracts() {
  const { isDark } = useTheme();

  // 🔑 استفاده از hook سفارشی برای state management
  const {
    contracts,
    setContracts,
    clients,
    setClients,
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
  } = useContracts();

  // 🔑 Local state برای مودال‌ها
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [userRole, setUserRole] = useState<"admin"|"user">("admin");
  
  // مودال قراردادهای قبلی مشتری
  const [isClientContractsOpen, setIsClientContractsOpen] = useState(false);
  const [clientContractsList, setClientContractsList] = useState<Contract[]>([]);
  const [selectedClientForView, setSelectedClientForView] = useState<any>(null);
  const [viewFilterType, setViewFilterType] = useState<"ALL"|"CONTRACT"|"WORK_ORDER">("ALL");
  const [viewFilterStatus, setViewFilterStatus] = useState<string>("ALL");
  
  // مودال تایید تکمیل
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [contractToComplete, setContractToComplete] = useState<Contract | null>(null);
  const [completeReason, setCompleteReason] = useState("");

  // 🔑 بازیابی داده‌ها از localStorage وقتی از Clients برمی‌گردیم
  useEffect(() => {
    const returnData = localStorage.getItem("returnToContract");
    if (returnData && isAddModalOpen) {
      const data = JSON.parse(returnData);
      // داده‌ها در ContractForm مدیریت می‌شن
      localStorage.removeItem("returnToContract");
    }
  }, [isAddModalOpen]);

  // 🔑 Handlers
  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleAddSave = (formData: any) => {
    const client = clients.find((c) => c.id === formData.client_id);
    const newContract: Contract = {
      id: `ct${Date.now()}`,
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
      client_name: client?.name_en ||"N/A",
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
      department: CURRENT_DEPARTMENT,
      description: formData.description,
      financial_terms: {
        adjustment: formData.adjustment,
        contract_modification: formData.contract_modification,
        guarantee: formData.guarantee,
        good_performance_percentage: formData.good_performance_percentage,
        insurance_deduction_percentage: formData.insurance_deduction_percentage,
        attachments: formData.attachments.map((att: any) => ({
          ...att,
          file_object: undefined,
        })),
      },
      service_description: formData.service_description,
    };

    setContracts([newContract, ...contracts]);
    setSelectedContract(newContract);
    setIsDetailsOpen(true);

    // اضافه کردن ایمیل به لیست ایمیل‌های مشتری
    if (formData.source_type ==="EMAIL"&& formData.source_email_from && formData.client_id) {
      setClients((prevClients: any[]) =>
        prevClients.map((client: any) => {
          if (client.id === formData.client_id) {
            const existingEmails = client.emails || [];
            if (!existingEmails.includes(formData.source_email_from)) {
              return { ...client, emails: [...existingEmails, formData.source_email_from] };
            }
          }
          return client;
        })
      );
    }
  };

  const handleEditClick = () => {
    if (!selectedContract) return;
    setEditingContract(selectedContract);
    setIsEditModalOpen(true);
  };

  const handleEditSave = (formData: any) => {
    if (!editingContract) return;
    const updatedContracts = contracts.map((c) =>
      c.id === editingContract.id ? { ...c, ...formData } : c
    );
    setContracts(updatedContracts);
    setSelectedContract({ ...editingContract, ...formData });
    setIsEditModalOpen(false);
    setEditingContract(null);
  };

  const handleExportToExcel = () => {
    const dataToExport = filteredContracts.map((c) => ({"شماره داخلی": c.contract_no,"نوع": c.type ==="CONTRACT"?"قرارداد":"سفارش کار","مشتری": c.client_name,"عنوان": c.contract_title,"وضعیت": c.status,"تاریخ شروع": c.start_date,"تاریخ پایان": c.end_date,"ارزش کل": c.total_value,
    }));
    const filterName = typeFilter ==="ALL"?"All": typeFilter ==="CONTRACT"?"Contracts":"WorkOrders";
    const today = new Date().toISOString().split("T")[0];
    exportToExcel(dataToExport, `${filterName}_Contracts_${today}`,"Contracts");
  };

  const handleRequestComplete = (contract: Contract) => {
    setContractToComplete(contract);
    setCompleteReason("");
    setConfirmCompleteOpen(true);
  };

  const handleConfirmComplete = () => {
    if (!contractToComplete) return;
    const updatedContracts = contracts.map((c) =>
      c.id === contractToComplete.id ? { ...c, status:"COMPLETED"as const } : c
    );
    setContracts(updatedContracts);
    if (selectedContract?.id === contractToComplete.id) {
      setSelectedContract({ ...contractToComplete, status:"COMPLETED"});
    }
    setConfirmCompleteOpen(false);
    setContractToComplete(null);
    setCompleteReason("");
  };

  const handleNavigateToClients = () => {
    localStorage.setItem("returnToContract",
      JSON.stringify({ returnTo:"contracts"})
    );
    window.dispatchEvent(new CustomEvent("navigateToClients", { detail: { returnTo:"contracts"} }));
  };

  const handleViewClientContracts = (clientId: string) => {
    const existingContracts = contracts.filter(
      (c) => c.client_id === clientId && c.department === CURRENT_DEPARTMENT
    );
    const client = clients.find((c) => c.id === clientId);
    setClientContractsList(existingContracts);
    setSelectedClientForView(client);
    setViewFilterStatus("ALL");
    setViewFilterType("ALL");
    setIsClientContractsOpen(true);
  };

  const filteredClientContracts = useMemo(() => {
    let result = clientContractsList;
    if (viewFilterType !=="ALL") result = result.filter((c) => c.type === viewFilterType);
    if (viewFilterStatus !=="ALL") result = result.filter((c) => c.status === viewFilterStatus);
    return result;
  }, [clientContractsList, viewFilterType, viewFilterStatus]);

  const clientContractCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: clientContractsList.length };
    clientContractsList.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [clientContractsList]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set(clientContractsList.map((c) => c.status));
    return Array.from(statuses);
  }, [clientContractsList]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 p-3 lg:p-6 h-auto lg:h-[calc(100vh-140px)]">
      {/* LEFT PANEL - ContractList */}
      <ContractList
        contracts={contracts}
        filteredContracts={filteredContracts}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        selectedContract={selectedContract}
        setSelectedContract={(contract) => {
          setSelectedContract(contract);
          setIsDetailsOpen(true);
        }}
        onAddClick={handleAddClick}
        onExport={handleExportToExcel}
      />

      {/* RIGHT PANEL - ContractDetails */}
	  <div className={`col-span-1 lg:col-span-8 flex flex-col rounded-xl panel-3d overflow-hidden transition-all duration-300 ease-in-out ${
		  isDark ?'bg-slate-900 border-slate-700':'bg-white border-slate-200/70'}`}>
		  <ContractDetails
			contract={selectedContract}
			onClose={() => {
			  setSelectedContract(null);
			  setIsDetailsOpen(false);
			}}
			onEdit={handleEditClick}
			onRequestComplete={handleRequestComplete}
			userRole={userRole}
		  />
	  </div>

      {/* 🔑 ADD CONTRACT MODAL */}
      <ContractForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddSave}
        mode="add"typeFilter={typeFilter}
        contracts={contracts}
        generateContractNo={(type, contracts) => generateContractNo(type, contracts, CURRENT_DEPARTMENT)}
        onNavigateToClients={handleNavigateToClients}
      />

      {/* 🔑 EDIT CONTRACT MODAL */}
      <ContractForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingContract(null);
        }}
        onSave={handleEditSave}
        initialData={editingContract || undefined}
        mode="edit"typeFilter={typeFilter}
        contracts={contracts}
        generateContractNo={(type, contracts) => generateContractNo(type, contracts, CURRENT_DEPARTMENT)}
        onNavigateToClients={handleNavigateToClients}
      />

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
        title={`Previous Contracts — ${selectedClientForView?.name_en ||""}`}
        size="lg">
        {selectedClientForView && (
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${isDark ?"border-indigo-700 bg-indigo-950/50":"border-indigo-200 bg-indigo-50/50"}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold">
                  {selectedClientForView.name_en.split(/\s+/).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-primary">{selectedClientForView.name_en}</h3>
                  <p className="text-xs text-secondary"dir="rtl">{selectedClientForView.name_fa}</p>
                  <p className="text-xs font-medium mt-0.5 text-accent-indigo">
                    {clientContractsList.length} {clientContractsList.length === 1 ?"contract":"contracts"} in {CURRENT_DEPARTMENT}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-1 filter-group p-0.5 text-xs">
              <button
                onClick={() => setViewFilterStatus("ALL")}
                className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${
                  viewFilterStatus ==="ALL"? (isDark ?"bg-indigo-900/40 text-indigo-300":"bg-indigo-50 text-indigo-700")
                    : (isDark ?"text-secondary hover:text-primary":"text-secondary hover:text-slate-700")
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
                      ? (isDark ?"bg-indigo-900/40 text-indigo-300":"bg-indigo-50 text-indigo-700")
                      : (isDark ?"text-secondary hover:text-primary":"text-secondary hover:text-slate-700")
                  }`}
                >
                  {status ==="ACTIVE"?"🟢":"⚫"} {status} ({clientContractCounts[status] || 0})
                </button>
              ))}
            </div>

            {filteredClientContracts.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm">No contracts found with current filters</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredClientContracts.map((contract) => {
                  const progress = calculateProgressFromTariffs(contract);
                  return (
                    <div
                      key={contract.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        isDark ?"border-slate-700 hover:border-indigo-500":"border-slate-200 hover:border-indigo-300"}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge tone={contract.type ==="CONTRACT"?"indigo":"amber"}>
                              {contract.type ==="CONTRACT"?"Contract":"Work Order"}
                            </Badge>
                            <span className="font-mono text-xs text-secondary">{contract.contract_no}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-primary">{contract.contract_title}</h4>
                        </div>
                        <Badge tone={contract.status ==="ACTIVE"?"emerald":"slate"}>{contract.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-secondary">{contract.start_date} → {contract.end_date}</span>
                        <span className="font-semibold text-primary">{formatCurrency(contract.total_value, contract.currency)}</span>
                      </div>
                      <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ?"bg-slate-700":"bg-slate-100"}`}>
                        <div
                          className={`h-full rounded-full ${getProgressColor(progress)}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-secondary mt-1">{progress.toFixed(0)}% performed</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={`flex justify-end pt-4 border-t ${isDark ?"border-slate-700":"border-slate-100"}`}>
              <Button
                variant="ghost"onClick={() => {
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
        title="Mark Contract as Completed"size="md">
        {contractToComplete && (
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${isDark ?"border-amber-700 bg-amber-900/30":"border-amber-200 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ?"text-amber-200":"text-amber-900"}`}>
                    Financial Review Required
                  </h3>
                  <p className={`text-xs ${isDark ?"text-amber-300":"text-amber-800"}`}>
                    This contract has expired but invoiced amount is less than total value.
                    Please review and confirm completion.
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg border border-theme bg-muted p-4`}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Contract No</div>
                  <div className="font-mono text-xs text-primary">{contractToComplete.contract_no}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Client</div>
                  <div className="text-xs text-primary">{contractToComplete.client_name}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Total Value</div>
                  <div className="text-xs font-semibold text-accent-emerald">
                    {formatCurrency(contractToComplete.total_value, contractToComplete.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Invoiced</div>
                  <div className="text-xs font-semibold text-accent-indigo">
                    {formatCurrency(contractToComplete.invoiced, contractToComplete.currency)}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Invoiced Percentage</div>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ?"bg-slate-700":"bg-slate-200"}`}>
                      <div
                        className="h-full bg-amber-500 rounded-full"style={{ width: `${Math.min(getInvoicedPercentage(contractToComplete), 100)}%` }}
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
                className="w-full rounded-lg px-3 py-2 text-sm input-themed"placeholder="e.g., Final settlement reached, remaining amount waived..."/>
            </div>

            <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ?"border-slate-700":"border-slate-100"}`}>
              <Button
                variant="ghost"onClick={() => {
                  setConfirmCompleteOpen(false);
                  setContractToComplete(null);
                  setCompleteReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmComplete}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <span>✓</span>
                <span>Confirm Completion</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}




