// src/features/contract-management/ui/ContractDetails.tsx

import { useState, useMemo, useEffect } from "react";
import { Button, Badge, Card } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import type {
  Client,
  Contract,
  TariffLine,
  ContractAmendment,
} from "@/types/contract";
import { formatCurrency } from "@shared/lib/formatters";
import {
  calculateProgressFromTariffs,
  calculateInvoiceProgress,
  calculateDaysLeft,
  calculateDaysProgress,
  getDaysUntilStart,
  getContractFinancialStatus,
  getAdjustmentReminder,
  isExpiringSoon,
  getProgressColor,
  getProgressTextClass,
  jalaaliToGregorianDate,
} from "@entities/contract/services/contractCalculations";
import { amendmentService } from "../services/AmendmentService";
import { ContractAmendmentForm } from "./ContractAmendmentForm";
import { useAuth } from "@features/auth/hooks/useAuth";
import { AnimatedCollapse } from "@shared/ui/AnimatedCollapse";
import { ContractDocumentsModal } from "./ContractDocumentsModal";
import { ApprovalModal } from "./ApprovalModal";
import { useEvent, EVENT_TYPES } from "@infra/events";

interface ContractDocument {
  id: string;
  name: string;
  url: string;
  type: "contract" | "letter" | "amendment";
  amendment_no?: string;
  uploaded_at?: string;
  size?: string;
}

interface ContractDetailsProps {
  contract: Contract | null;
  onClose: () => void;
  onEdit: () => void;
  onRequestComplete: (contract: Contract) => void;
  onViewClientContracts?: (clientId: string) => void;
  loading?: boolean;
  contractTariffs?: TariffLine[];
  clients?: Client[];
}

export function ContractDetails({
  contract,
  onClose,
  onEdit,
  onRequestComplete,
  onViewClientContracts,
  loading = false,
  contractTariffs = [],
  clients = [],
}: ContractDetailsProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  const isUnitManager = user?.role === "unit_manager" || user?.role === "admin";

  // 🔐 تعریف دسترسی‌ها دقیقاً بر اساس contractElements
  const canBtnEdit = canAccessElement("contract_btn_edit");
  const canBtnAmend = canAccessElement("contract_btn_amend");
  const canBtnApprove = canAccessElement("contract_btn_approve");
  const canBtnDoc = canAccessElement("contract_btn_doc");

  const canInfoSection = canAccessElement("contract_list_item_click");
  const canInfoStartDate = canAccessElement("contract_info_start_date");
  const canInfoEndDate = canAccessElement("contract_info_end_date");

  const canStatTotalValue = canAccessElement("contract_stat_total_value");
  const canStatPerformedWork = canAccessElement("contract_stat_performed_work");
  const canStatInvoiced = canAccessElement("contract_stat_invoiced");
  const canStatNotInvoiced = canAccessElement("contract_stat_not_invoiced");

  const canProgressWork = canAccessElement("contract_progress_work");
  const canProgressInvoice = canAccessElement("contract_progress_invoice");
  const canProgressTime = canAccessElement("contract_progress_time");

  const canReminderSection = canAccessElement("contract_reminder_section");
  const canTableTariffs = canAccessElement("contract_table_tariffs");

  // 🔧 دسترسی مالی کلی (اگر کاربر به یکی از آمارهای مالی دسترسی داشته باشد)
  const canViewFinancial = canStatTotalValue;

  const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
  const [amendments, setAmendments] = useState<ContractAmendment[]>([]);
  const [isLoadingAmendments, setIsLoadingAmendments] = useState(false);
  const [isArchivedCollapsed, setIsArchivedCollapsed] = useState(true);
  const [isFutureCollapsed, setIsFutureCollapsed] = useState(true);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [pendingAmendment, setPendingAmendment] =
    useState<ContractAmendment | null>(null);

  const pendingAmendments = useMemo(() => {
    return amendments.filter((a) => a.approval_status === "PENDING");
  }, [amendments]);

  // 🔧 Derived Data
  const getClientName = useMemo(() => {
    if (!contract) return "";
    if (contract.client_name) return contract.client_name;
    const client = clients.find((c) => c.id === contract.client_id);
    return client?.name_en || client?.name_fa || "—";
  }, [contract, clients]);

  const selectedTariffs = useMemo(() => {
    if (!contract) return [];
    const allTariffs =
      contract.tariffLines && contract.tariffLines.length > 0
        ? contract.tariffLines
        : contractTariffs.filter((t) => t.contract_id === contract.id);
    return allTariffs;
  }, [contract, contractTariffs]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const activeTariffs = useMemo(() => {
    return selectedTariffs.filter((t) => {
      const validFrom = jalaaliToGregorianDate(t.valid_from);
      const validTo = jalaaliToGregorianDate(t.valid_to);
      if (validFrom && validFrom > today) return false;
      if (validTo && validTo < today) return false;
      return true;
    });
  }, [selectedTariffs, today]);

  const futureTariffs = useMemo(() => {
    return selectedTariffs.filter((t) => {
      const validFrom = jalaaliToGregorianDate(t.valid_from);
      if (validFrom && validFrom > today) return true;
      return false;
    });
  }, [selectedTariffs, today]);

  const archivedTariffs = useMemo(() => {
    return selectedTariffs.filter((t) => {
      const validTo = jalaaliToGregorianDate(t.valid_to);
      if (validTo && validTo < today) return true;
      return false;
    });
  }, [selectedTariffs, today]);

  const archivedTariffsByVersion = useMemo(() => {
    const grouped = new Map<number, TariffLine[]>();
    archivedTariffs.forEach((tariff) => {
      const version = tariff.version || 1;
      if (!grouped.has(version)) grouped.set(version, []);
      grouped.get(version)!.push(tariff);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([version, tariffs]) => ({ version, tariffs }));
  }, [archivedTariffs]);

  const futureTariffsByVersion = useMemo(() => {
    const grouped = new Map<number, TariffLine[]>();
    futureTariffs.forEach((tariff) => {
      const version = tariff.version || 1;
      if (!grouped.has(version)) grouped.set(version, []);
      grouped.get(version)!.push(tariff);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([version, tariffs]) => ({ version, tariffs }));
  }, [futureTariffs]);

  const totalPerformedWork = useMemo(() => {
    if (!contract) return 0;
    return selectedTariffs.reduce((sum, t) => {
      const rate =
        typeof t.rate === "string"
          ? Number(t.rate.replace(/,/g, "")) || 0
          : t.rate || 0;
      const consumed = t.consumed_quantity || 0;
      return sum + rate * consumed;
    }, 0);
  }, [contract, selectedTariffs]);

  const totalInvoiced = useMemo(() => {
    return selectedTariffs.reduce(
      (sum, t) => sum + ((t as any).invoiced || 0),
      0,
    );
  }, [selectedTariffs]);

  const totalNotInvoiced = useMemo(() => {
    return Math.max(0, totalPerformedWork - totalInvoiced);
  }, [totalPerformedWork, totalInvoiced]);

  // Load amendments
  const loadAmendments = async () => {
    if (!contract) return;
    setIsLoadingAmendments(true);
    try {
      const data = await amendmentService.getByContractId(contract.id);
      setAmendments(data);
    } catch (error) {
      console.error("[ContractDetails] Failed to load amendments:", error);
      setAmendments([]);
    } finally {
      setIsLoadingAmendments(false);
    }
  };

  useEvent<{ contractId: string; amendmentId: string }>(
    EVENT_TYPES.AMENDMENT_CREATED,
    (event) => {
      if (event.payload.contractId === contract?.id) loadAmendments();
    },
  );
  useEvent<{ contractId: string; amendmentId: string }>(
    EVENT_TYPES.AMENDMENT_APPROVED,
    (event) => {
      if (event.payload.contractId === contract?.id) loadAmendments();
    },
  );
  useEvent<{ contractId: string; amendmentId: string }>(
    EVENT_TYPES.AMENDMENT_REJECTED,
    (event) => {
      if (event.payload.contractId === contract?.id) loadAmendments();
    },
  );

  useEffect(() => {
    if (contract) loadAmendments();
    else setAmendments([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract?.id]);

  const handleAmendmentSuccess = () => {
    loadAmendments();
  };

  // استخراج مدارک
  const documents = useMemo((): ContractDocument[] => {
    if (!contract) return [];
    const docs: ContractDocument[] = [];
    if (contract.source_file) {
      const files = Array.isArray(contract.source_file)
        ? contract.source_file
        : [contract.source_file];
      files.forEach((file, index) => {
        docs.push({
          id: `doc_contract_${contract.id}_${index}`,
          name:
            typeof file === "string"
              ? file.split("/").pop() || `Contract Document ${index + 1}`
              : `Contract Document ${index + 1}`,
          url: typeof file === "string" ? file : "",
          type: "contract",
          uploaded_at: contract.created_at,
        });
      });
    }
    if (contract.source_letter_image) {
      const files = Array.isArray(contract.source_letter_image)
        ? contract.source_letter_image
        : [contract.source_letter_image];
      files.forEach((file, index) => {
        docs.push({
          id: `doc_letter_${contract.id}_${index}`,
          name:
            typeof file === "string"
              ? file.split("/").pop() || `Reference Letter ${index + 1}`
              : `Reference Letter ${index + 1}`,
          url: typeof file === "string" ? file : "",
          type: "letter",
          uploaded_at: contract.source_letter_date || contract.created_at,
        });
      });
    }
    const approvedAmendments = amendments.filter(
      (a) => a.approval_status === "APPROVED",
    );
    approvedAmendments.forEach((amendment) => {
      if (amendment.attachment_urls && amendment.attachment_urls.length > 0) {
        amendment.attachment_urls.forEach((url, index) => {
          docs.push({
            id: `doc_amendment_${amendment.id}_${index}`,
            name:
              amendment.attachment_names?.[index] ||
              `Amendment ${amendment.amendment_no || amendment.id} - File ${index + 1}`,
            url: url,
            type: "amendment",
            amendment_no: amendment.amendment_no,
            uploaded_at: amendment.created_at,
          });
        });
      }
    });
    return docs;
  }, [contract, amendments]);

  // Empty State
  if (!contract) {
    if (loading)
      return (
        <div className="flex-1 flex items-center justify-center">
          Loading...
        </div>
      );
    return (
      <div
        className={`flex-1 flex items-center justify-center relative overflow-hidden min-h-[600px] ${isDark ? "bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950/30" : "bg-gradient-to-br from-slate-50 via-white to-indigo-50/30"}`}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${isDark ? "%23ffffff" : "%23000000"}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="text-center z-10 relative">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 blur-2xl opacity-40 animate-pulse" />
            <div
              className={`relative inline-flex items-center justify-center w-44 h-44 rounded-full shadow-2xl shadow-indigo-500/30 border-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-white"}`}
            >
              <img
                src="/images/logo.png"
                alt="ICS Logo"
                className="w-36 h-36 object-contain"
              />
            </div>
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-bold mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}
          >
            OFFSHORE & ENERGY DEPARTMENT
          </h2>
          <p
            className={`text-sm sm:text-base max-w-md mx-auto leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            Select a contract from the list to view details, tariffs, and
            progress information
          </p>
        </div>
      </div>
    );
  }

  // Computed Values
  const financialStatus = getContractFinancialStatus(contract);
  const expiringInfo = isExpiringSoon(contract);
  const reminder = getAdjustmentReminder(contract);
  const daysUntilStart = getDaysUntilStart(contract.start_date);
  const daysLeft = calculateDaysLeft(contract.end_date);
  const isExpired = daysLeft < 0;
  const isFullyInvoiced = contract.invoiced >= contract.total_value;
  const needsFinancialReview =
    (isExpired || totalPerformedWork >= contract.total_value) &&
    !isFullyInvoiced;
  const notStarted = daysUntilStart > 0;
  const daysProgress = calculateDaysProgress(contract);
  const workProgress = calculateProgressFromTariffs(contract);
  const invoiceProgress = calculateInvoiceProgress(contract);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      {/* ═══════════════════════════════════════ */}
      {/* 🔹 HEADER */}
      {/* ═══════════════════════════════════════ */}
      <div
        className={`relative px-6 py-4 border-b ${isDark ? "border-slate-700/50 bg-gradient-to-r from-indigo-900/30 via-slate-900 to-violet-900/30" : "border-slate-200/70 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/50"}`}
      >
        <div className="relative flex items-center justify-between gap-4 mb-3">
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Contract Details
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`transition-colors ${isDark ? "text-slate-400 hover:text-rose-400 hover:bg-rose-900/30" : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"}`}
          >
            ✕ Close Panel
          </Button>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg flex-shrink-0 ${isDark ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/30" : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/20"}`}
            >
              📄
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className={`text-xl font-bold truncate max-w-full ${isDark ? "text-slate-100" : "text-slate-900"}`}
                title={contract.contract_title}
              >
                {contract.contract_title}
              </h3>
              <p
                className={`text-sm font-mono truncate max-w-full ${isDark ? "text-slate-400" : "text-slate-600"}`}
                title={contract.contract_no}
              >
                {contract.contract_no}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge
                  tone={contract.type === "CONTRACT" ? "indigo" : "amber"}
                  className="text-[10px]"
                >
                  {contract.type === "CONTRACT"
                    ? "📄 Contract"
                    : "📦 Work Order"}
                </Badge>
                {contract.status === "COMPLETED" ? (
                  <Badge tone="slate" className="text-[10px]">
                    ✓ Completed
                  </Badge>
                ) : financialStatus === "needs_review" ? (
                  <Badge tone="amber" className="text-[10px] gap-1">
                    <span>⚠️</span>
                    <span>Needs Review</span>
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge tone="emerald" className="text-[10px]">
                      🟢 Active
                    </Badge>
                    {expiringInfo.expiring && (
                      <Badge
                        tone="danger"
                        className="text-[10px] gap-1 animate-pulse"
                      >
                        <span>⚠️</span>
                        <span>Expiring in {expiringInfo.daysLeft} days</span>
                      </Badge>
                    )}
                  </div>
                )}
                {pendingAmendments.length > 0 && (
                  <button
                    onClick={() => {
                      setPendingAmendment(pendingAmendments[0]);
                      setIsApprovalModalOpen(true);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-105 ${isDark ? "bg-amber-900/50 text-amber-300 border border-amber-700" : "bg-amber-100 text-amber-700 border border-amber-300"}`}
                  >
                    <span>⏳</span>
                    <span className="text-[10px] font-semibold">
                      {pendingAmendments.length} Pending Approval
                    </span>
                  </button>
                )}
                {(() => {
                  const approvedCount = amendments.filter(
                    (a) => a.approval_status === "APPROVED",
                  ).length;
                  return approvedCount > 0 ? (
                    <Badge tone="indigo" className="text-[10px]">
                      🔄 {approvedCount} Amendment{approvedCount > 1 ? "s" : ""}
                    </Badge>
                  ) : null;
                })()}
              </div>
            </div>
          </div>

          {/* 🔧 ستون راست: دکمه‌ها با دسترسی شرطی */}
          <div className="flex gap-2 flex-shrink-0">
            {canBtnAmend && contract.status !== "COMPLETED" && (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  loadAmendments();
                  setIsAmendmentModalOpen(true);
                }}
                className="gap-2 shadow-sm transition-all hover:scale-105 whitespace-nowrap"
              >
                <span>🔄</span> Amend
              </Button>
            )}

            {canBtnDoc && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsDocumentsModalOpen(true)}
                className="gap-2 shadow-sm transition-all hover:scale-105 whitespace-nowrap"
              >
                <span>📎</span> Documents
                {(() => {
                  const approvedAmendmentsCount = amendments.filter(
                    (a) => a.approval_status === "APPROVED",
                  ).length;
                  const totalCount = documents.length + approvedAmendmentsCount;
                  return totalCount > 0 ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700"}`}
                    >
                      {totalCount}
                    </span>
                  ) : null;
                })()}
              </Button>
            )}

            {canBtnEdit && (
              <Button
                variant="outline"
                size="md"
                onClick={onEdit}
                disabled={
                  contract.status === "COMPLETED" ||
                  financialStatus === "completed"
                }
                className="gap-2 shadow-sm transition-all hover:scale-105 whitespace-nowrap"
              >
                <span>✏️</span> Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* 🔹 SCROLLABLE CONTENT */}
      {/* ═══════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="space-y-6">
          {/* Reminder Section */}
          {canReminderSection && reminder.show && (
            <div
              className={`rounded-xl border-2 p-4 ${reminder.mode === "TBD" ? (isDark ? "border-amber-600 bg-amber-950/40" : "border-amber-400 bg-amber-50") : isDark ? "border-indigo-600 bg-indigo-950/40" : "border-indigo-400 bg-indigo-50"}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {reminder.mode === "TBD" ? "⏳" : "📊"}
                </div>
                <div className="flex-1">
                  <h4
                    className={`text-sm font-bold mb-1 ${reminder.mode === "TBD" ? (isDark ? "text-amber-200" : "text-amber-900") : isDark ? "text-indigo-200" : "text-indigo-900"}`}
                  >
                    Price Adjustment Reminder
                  </h4>
                  <p
                    className={`text-xs mb-2 ${reminder.mode === "TBD" ? (isDark ? "text-amber-300" : "text-amber-800") : isDark ? "text-indigo-300" : "text-indigo-800"}`}
                  >
                    {reminder.mode === "TBD"
                      ? `Adjustment percentage needs to be determined. Effective date: ${reminder.effectiveDate}`
                      : `Adjustment will be applied. Effective date: ${reminder.effectiveDate}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contract Information */}
          {canInfoSection && (
            <div
              className={`rounded-xl border p-4 ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/70 bg-slate-50/50"}`}
            >
              <h3
                className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                📋 Contract Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Client
                  </div>
                  <div
                    className={`font-mono text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {getClientName}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Internal Contract No.
                  </div>
                  <div
                    className={`font-mono text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {contract.contract_no}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    External Contract No.
                  </div>
                  <div
                    className={`font-mono text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {contract.external_contract_no || "—"}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Currency
                  </div>
                  <div
                    className={`text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {contract.currency}
                  </div>
                </div>
                {canInfoStartDate && (
                  <div>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Start Date
                    </div>
                    <div
                      className={`text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {contract.start_date}
                    </div>
                  </div>
                )}
                {canInfoEndDate && (
                  <div>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      End Date
                    </div>
                    <div
                      className={`text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {contract.end_date}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          {canViewFinancial && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {canStatTotalValue && (
                <div
                  className={`rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? "border-emerald-700/50 bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 hover:border-emerald-600" : "border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-emerald-50/50 hover:border-emerald-300"}`}
                >
                  <div
                    className={`text-[10px] uppercase font-semibold mb-2 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
                  >
                    Total Value
                  </div>
                  <div
                    className={`text-lg font-bold truncate ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                  >
                    {formatCurrency(contract.total_value, contract.currency)}
                  </div>
                </div>
              )}
              {canStatPerformedWork && (
                <div
                  className={`rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? "border-indigo-700/50 bg-gradient-to-br from-indigo-900/20 to-indigo-900/10 hover:border-indigo-600" : "border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-indigo-50/50 hover:border-indigo-300"}`}
                >
                  <div
                    className={`text-[10px] uppercase font-semibold mb-2 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}
                  >
                    Performed Work
                  </div>
                  <div
                    className={`text-lg font-bold truncate ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                  >
                    {formatCurrency(totalPerformedWork, contract.currency)}
                  </div>
                </div>
              )}
              {canStatInvoiced && (
                <div
                  className={`rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? "border-violet-700/50 bg-gradient-to-br from-violet-900/20 to-violet-900/10 hover:border-violet-600" : "border-violet-200/70 bg-gradient-to-br from-violet-50 to-violet-50/50 hover:border-violet-300"}`}
                >
                  <div
                    className={`text-[10px] uppercase font-semibold mb-2 ${isDark ? "text-violet-400" : "text-violet-700"}`}
                  >
                    Invoiced
                  </div>
                  <div
                    className={`text-lg font-bold truncate ${isDark ? "text-violet-300" : "text-violet-700"}`}
                  >
                    {formatCurrency(totalInvoiced)}
                  </div>
                </div>
              )}
              {canStatNotInvoiced && (
                <div
                  className={`rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? "border-rose-700/50 bg-gradient-to-br from-rose-900/20 to-rose-900/10 hover:border-rose-600" : "border-rose-200/70 bg-gradient-to-br from-rose-50 to-rose-50/50 hover:border-rose-300"}`}
                >
                  <div
                    className={`text-[10px] uppercase font-semibold mb-2 ${isDark ? "text-rose-400" : "text-rose-700"}`}
                  >
                    Not Invoiced
                  </div>
                  <div
                    className={`text-lg font-bold truncate ${isDark ? "text-rose-300" : "text-rose-700"}`}
                  >
                    {formatCurrency(totalNotInvoiced, contract.currency)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {canProgressWork && canViewFinancial && (
              <Card
                className={`rounded-xl border p-4 ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/70 bg-white"}`}
              >
                <div
                  className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Work Progress
                </div>
                <div
                  className={`text-lg font-bold ${getProgressTextClass(workProgress)}`}
                >
                  {workProgress.toFixed(2)}%
                </div>
                <div
                  className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                >
                  <div
                    className={`h-full rounded-full ${getProgressColor(workProgress)}`}
                    style={{ width: `${Math.min(workProgress, 100)}%` }}
                  />
                </div>
              </Card>
            )}
            {canProgressInvoice && canViewFinancial && (
              <Card
                className={`rounded-xl border p-4 ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/70 bg-white"}`}
              >
                <div
                  className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Invoice Progress
                </div>
                <div
                  className={`text-lg font-bold ${getProgressTextClass(invoiceProgress)}`}
                >
                  {invoiceProgress.toFixed(1)}%
                  {invoiceProgress > 100 && (
                    <span className="text-xs ml-1">(Over)</span>
                  )}
                </div>
                <div
                  className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                >
                  <div
                    className={`h-full rounded-full ${getProgressColor(invoiceProgress)}`}
                    style={{ width: `${Math.min(invoiceProgress, 100)}%` }}
                  />
                </div>
              </Card>
            )}
            {canProgressTime && (
              <Card
                className={`rounded-xl border p-4 ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/70 bg-white"}`}
              >
                {notStarted ? (
                  <>
                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Status
                    </div>
                    <div className="text-lg font-bold text-amber-600">
                      ⏳ Not Started
                    </div>
                    <div className="text-[10px] text-amber-500 mt-0.5">
                      Starts in {daysUntilStart} days
                    </div>
                  </>
                ) : contract.status === "COMPLETED" ? (
                  <>
                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Status
                    </div>
                    <div className="text-lg font-bold text-slate-600">
                      ✓ Completed
                    </div>
                  </>
                ) : needsFinancialReview ? (
                  <>
                    <div
                      className={`text-xs mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Financial Status
                    </div>
                    <div className="text-lg font-bold text-amber-600 mb-2">
                      ⚠️ Needs Review
                    </div>
                    {canBtnApprove && isUnitManager ? (
                      <button
                        onClick={() => onRequestComplete(contract)}
                        className="w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all bg-amber-500 text-white hover:bg-amber-600 shadow-sm cursor-pointer"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <span>✓</span>
                          <span>Mark as Completed</span>
                        </span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all ${isDark ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60" : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"}`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <span>🔒</span>
                          <span>Manager Approval Required</span>
                        </span>
                      </button>
                    )}
                  </>
                ) : daysProgress !== null ? (
                  <>
                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Time Progress
                    </div>
                    <div
                      className={`text-lg font-bold ${getProgressTextClass(daysProgress)}`}
                    >
                      {daysProgress.toFixed(0)}%
                    </div>
                    <div
                      className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                    >
                      <div
                        className={`h-full rounded-full ${getProgressColor(daysProgress)}`}
                        style={{ width: `${Math.min(daysProgress, 100)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Status
                    </div>
                    <div className="text-lg font-bold text-slate-500">
                      — No Data
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>

          {/* Tariffs Table */}
          {canTableTariffs && canViewFinancial && (
            <div>
              <h3
                className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Tariff Lines & Consumption
              </h3>
              {activeTariffs.length > 0 && (
                <div className="mb-6">
                  <h4
                    className={`text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
                  >
                    <span>✓</span>
                    <span>Active Tariffs</span>
                  </h4>
                  <div
                    className={`overflow-x-auto rounded-xl border-2 ${isDark ? "border-emerald-700/50" : "border-emerald-200"}`}
                  >
                    <table className="w-full text-left text-xs">
                      <thead
                        className={`${isDark ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-50 text-emerald-700"} text-[10px] uppercase tracking-wide`}
                      >
                        <tr>
                          <th className="px-3 py-2 font-semibold">
                            Description
                          </th>
                          <th className="px-3 py-2 font-semibold">Unit</th>
                          <th className="px-3 py-2 font-semibold text-right">
                            Rate
                          </th>
                          <th className="px-3 py-2 font-semibold text-center">
                            Performed
                          </th>
                          <th className="px-3 py-2 font-semibold text-right">
                            Total Value
                          </th>
                          <th className="px-3 py-2 font-semibold text-right">
                            Invoiced
                          </th>
                          <th className="px-3 py-2 font-semibold">
                            Valid From
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={
                          isDark
                            ? "divide-y divide-slate-700/50"
                            : "divide-y divide-slate-200/70"
                        }
                      >
                        {activeTariffs.map((tariff) => {
                          const rate =
                            typeof tariff.rate === "string"
                              ? Number(tariff.rate.replace(/,/g, "")) || 0
                              : tariff.rate || 0;
                          const value = (tariff.consumed_quantity || 0) * rate;
                          const invoiced = (tariff as any).invoiced || 0;
                          return (
                            <tr
                              key={tariff.id}
                              className={
                                isDark
                                  ? "hover:bg-slate-800/30"
                                  : "hover:bg-slate-50/50"
                              }
                            >
                              <td
                                className={`px-3 py-2 font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{tariff.description}</span>
                                  {tariff.version && tariff.version > 1 && (
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
                                    >
                                      v{tariff.version}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <Badge tone="indigo" className="text-[9px]">
                                  {tariff.unit.replace("_", " ")}
                                </Badge>
                              </td>
                              <td
                                className={`px-3 py-2 text-right font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                              >
                                {formatCurrency(tariff.rate, contract.currency)}
                              </td>
                              <td
                                className={`px-3 py-2 text-center font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                              >
                                {tariff.consumed_quantity || 0}
                              </td>
                              <td
                                className={`px-3 py-2 text-right font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                              >
                                {formatCurrency(value, contract.currency)}
                              </td>
                              <td
                                className={`px-3 py-2 text-right font-mono font-bold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                              >
                                {formatCurrency(invoiced)}
                              </td>
                              <td
                                className={`px-3 py-2 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                              >
                                {tariff.valid_from ? (
                                  <span className="flex items-center gap-1">
                                    <span>📅</span>
                                    <span>{tariff.valid_from}</span>
                                  </span>
                                ) : (
                                  <span
                                    className={
                                      isDark
                                        ? "text-slate-500"
                                        : "text-slate-400"
                                    }
                                  >
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Future & Archived Tariffs (با همان منطق قبلی و دسترسی شرطی) */}
              {futureTariffsByVersion.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setIsFutureCollapsed(!isFutureCollapsed)}
                    className={`w-full flex items-center justify-between mb-2 px-3 py-2 rounded-lg transition-all ${isDark ? "bg-amber-900/20 hover:bg-amber-900/30 text-amber-300" : "bg-amber-50 hover:bg-amber-100 text-amber-700"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>⏳</span>
                      <span className="text-xs font-semibold">
                        Future Tariffs (Scheduled)
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? "bg-amber-900/50 text-amber-400" : "bg-amber-200 text-amber-800"}`}
                      >
                        {futureTariffs.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}
                      >
                        {isFutureCollapsed ? "Show" : "Hide"}
                      </span>
                      <span
                        className={`transition-transform ${isFutureCollapsed ? "" : "rotate-180"}`}
                      >
                        ▼
                      </span>
                    </div>
                  </button>
                  <AnimatedCollapse isOpen={!isFutureCollapsed}>
                    {futureTariffsByVersion.map(({ version, tariffs }) => (
                      <div key={version} className="mb-4">
                        <h5
                          className={`text-[10px] font-bold mb-1 px-2 ${isDark ? "text-amber-400" : "text-amber-700"}`}
                        >
                          Version {version}
                        </h5>
                        <div
                          className={`overflow-x-auto rounded-xl border ${isDark ? "border-amber-700/50" : "border-amber-200"}`}
                        >
                          <table className="w-full text-left text-xs">
                            <thead
                              className={`${isDark ? "bg-amber-900/20 text-amber-400" : "bg-amber-50 text-amber-700"} text-[10px] uppercase tracking-wide`}
                            >
                              <tr>
                                <th className="px-3 py-2 font-semibold">
                                  Description
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                  Unit
                                </th>
                                <th className="px-3 py-2 font-semibold text-right">
                                  Rate
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                  Valid From
                                </th>
                              </tr>
                            </thead>
                            <tbody
                              className={
                                isDark
                                  ? "divide-y divide-slate-700/50"
                                  : "divide-y divide-slate-200/70"
                              }
                            >
                              {tariffs.map((tariff) => (
                                <tr
                                  key={tariff.id}
                                  className={
                                    isDark
                                      ? "hover:bg-slate-800/30"
                                      : "hover:bg-slate-50/50"
                                  }
                                >
                                  <td
                                    className={`px-3 py-2 font-medium ${isDark ? "text-amber-200" : "text-amber-900"}`}
                                  >
                                    {tariff.description}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge tone="amber" className="text-[9px]">
                                      {tariff.unit.replace("_", " ")}
                                    </Badge>
                                  </td>
                                  <td
                                    className={`px-3 py-2 text-right font-mono ${isDark ? "text-amber-300" : "text-amber-700"}`}
                                  >
                                    {formatCurrency(
                                      tariff.rate,
                                      contract.currency,
                                    )}
                                  </td>
                                  <td
                                    className={`px-3 py-2 text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}
                                  >
                                    <span className="flex items-center gap-1">
                                      <span>📅</span>
                                      <span>{tariff.valid_from}</span>
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </AnimatedCollapse>
                </div>
              )}

              {archivedTariffsByVersion.length > 0 && (
                <div>
                  <button
                    onClick={() => setIsArchivedCollapsed(!isArchivedCollapsed)}
                    className={`w-full flex items-center justify-between mb-2 px-3 py-2 rounded-lg transition-all ${isDark ? "bg-slate-800/50 hover:bg-slate-800 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>📦</span>
                      <span className="text-xs font-semibold">
                        Archived Tariffs - Previous Versions
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-600"}`}
                      >
                        {archivedTariffs.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {isArchivedCollapsed ? "Show" : "Hide"}
                      </span>
                      <span
                        className={`transition-transform ${isArchivedCollapsed ? "" : "rotate-180"}`}
                      >
                        ▼
                      </span>
                    </div>
                  </button>
                  <AnimatedCollapse isOpen={!isArchivedCollapsed}>
                    {archivedTariffsByVersion.map(({ version, tariffs }) => (
                      <div key={version} className="mb-4">
                        <h5
                          className={`text-[10px] font-bold mb-1 px-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          Version {version}
                        </h5>
                        <div
                          className={`overflow-x-auto rounded-xl border opacity-75 ${isDark ? "border-slate-700/50" : "border-slate-200/70"}`}
                        >
                          <table className="w-full text-left text-xs">
                            <thead
                              className={`${isDark ? "bg-slate-800/50 text-slate-400" : "bg-slate-50/70 text-slate-500"} text-[10px] uppercase tracking-wide`}
                            >
                              <tr>
                                <th className="px-3 py-2 font-semibold">
                                  Description
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                  Unit
                                </th>
                                <th className="px-3 py-2 font-semibold text-right">
                                  Rate
                                </th>
                                <th className="px-3 py-2 font-semibold text-center">
                                  Performed
                                </th>
                                <th className="px-3 py-2 font-semibold text-right">
                                  Total Value
                                </th>
                                <th className="px-3 py-2 font-semibold text-right">
                                  Invoiced
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                  Valid Period
                                </th>
                              </tr>
                            </thead>
                            <tbody
                              className={
                                isDark
                                  ? "divide-y divide-slate-700/50"
                                  : "divide-y divide-slate-200/70"
                              }
                            >
                              {tariffs.map((tariff) => {
                                const rate =
                                  typeof tariff.rate === "string"
                                    ? Number(tariff.rate.replace(/,/g, "")) || 0
                                    : tariff.rate || 0;
                                const value =
                                  (tariff.consumed_quantity || 0) * rate;
                                const invoiced = (tariff as any).invoiced || 0;
                                return (
                                  <tr
                                    key={tariff.id}
                                    className={
                                      isDark
                                        ? "hover:bg-slate-800/30"
                                        : "hover:bg-slate-50/50"
                                    }
                                  >
                                    <td
                                      className={`px-3 py-2 font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{tariff.description}</span>
                                        <span
                                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-600"}`}
                                        >
                                          v{tariff.version}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2">
                                      <Badge
                                        tone="slate"
                                        className="text-[9px]"
                                      >
                                        {tariff.unit.replace("_", " ")}
                                      </Badge>
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-right font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                    >
                                      {formatCurrency(
                                        tariff.rate,
                                        contract.currency,
                                      )}
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-center font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                    >
                                      {tariff.consumed_quantity || 0}
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-right font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                    >
                                      {formatCurrency(value, contract.currency)}
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-right font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                    >
                                      {formatCurrency(invoiced)}
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        <span>📅</span>
                                        <span>
                                          {tariff.valid_from || "—"} →{" "}
                                          {tariff.valid_to || "—"}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </AnimatedCollapse>
                </div>
              )}
              {selectedTariffs.length === 0 && (
                <div
                  className={`text-center py-8 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  <div className="text-4xl mb-2">📭</div>
                  <p>No tariff lines found for this contract</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isAmendmentModalOpen && (
        <ContractAmendmentForm
          isOpen={isAmendmentModalOpen}
          onClose={() => setIsAmendmentModalOpen(false)}
          contract={contract}
          contractTariffs={contractTariffs}
          onSuccess={handleAmendmentSuccess}
        />
      )}
      {isDocumentsModalOpen && (
        <ContractDocumentsModal
          isOpen={isDocumentsModalOpen}
          onClose={() => setIsDocumentsModalOpen(false)}
          contract={contract}
          amendments={amendments}
        />
      )}
      {isApprovalModalOpen && pendingAmendment && (
        <ApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => {
            setIsApprovalModalOpen(false);
            setPendingAmendment(null);
          }}
          contract={contract}
          amendment={pendingAmendment}
          onSuccess={() => {
            loadAmendments();
          }}
        />
      )}
    </div>
  );
}
