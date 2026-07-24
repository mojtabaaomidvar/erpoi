// src/features/contract-management/ui/ContractDetails.tsx

import { useState } from "react";
import { Button, Badge, Card } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Contract, TariffLine, ContractAmendment } from "../domain";
import type { Client } from "@/features/client-management/domain/models/Client";
import { formatCurrency } from "@shared/lib/formatters";
import {
  getProgressColor,
  getProgressTextClass,
} from "@entities/contract/services/contractCalculations";
import { ContractAmendmentForm } from "./ContractAmendmentForm";
import { ContractDocumentsModal } from "./ContractDocumentsModal";
import { ApprovalModal } from "./ApprovalModal";
import { useContractDetails } from "../hooks/useContractDetails";
import { AnimatedCollapse } from "@shared/ui/AnimatedCollapse";

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
  loading = false,
  contractTariffs = [],
  clients = [],
}: ContractDetailsProps) {
  const { isDark } = useTheme();

  const details = useContractDetails(contract, contractTariffs, clients);

  const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
  const [isArchivedCollapsed, setIsArchivedCollapsed] = useState(true);
  const [isFutureCollapsed, setIsFutureCollapsed] = useState(true);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [pendingAmendment, setPendingAmendment] =
    useState<ContractAmendment | null>(null);

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

  const {
    clientName,
    activeTariffs,
    futureTariffsByVersion,
    archivedTariffsByVersion,
    totalPerformedWork,
    totalInvoiced,
    totalNotInvoiced,
    amendments,
    isLoadingAmendments,
    pendingAmendments,
    documents,
    financialStatus,
    expiringInfo,
    reminder,
    daysUntilStart,
    daysLeft,
    isExpired,
    isFullyInvoiced,
    needsFinancialReview,
    notStarted,
    daysProgress,
    workProgress,
    invoiceProgress,
    permissions,
    isUnitManager,
    loadAmendments,
  } = details;

  const handleAmendmentSuccess = () => {
    loadAmendments();
  };

  console.log("🔍 [ContractDetails] Permissions Check:", {
    canInfoSection: permissions.canInfoSection,
    canTableTariffs: permissions.canTableTariffs,
    canProgressWork: permissions.canProgressWork,
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      {/* 🔹 HEADER */}
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
            {permissions.canBtnAmend && contract.status !== "COMPLETED" && (
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
            {permissions.canBtnDoc && (
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
            {permissions.canBtnEdit && (
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

      {/* 🔹 SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="space-y-6">
          {/* Reminder Section */}
          {permissions.canReminderSection && reminder.show && (
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
          {permissions.canInfoSection && (
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
                    {clientName}
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
                {permissions.canInfoStartDate && (
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
                {permissions.canInfoEndDate && (
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {permissions.canStatTotalValue && (
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
            {permissions.canStatPerformedWork && (
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
            {permissions.canStatInvoiced && (
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
            {permissions.canStatNotInvoiced && (
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

          {/* Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {permissions.canProgressWork && permissions.canStatTotalValue && (
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
            {permissions.canProgressInvoice &&
              permissions.canStatTotalValue && (
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
            {permissions.canProgressTime && (
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
                    {permissions.canBtnApprove && isUnitManager ? (
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
          {permissions.canTableTariffs && permissions.canStatTotalValue && (
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
                        {activeTariffs.map((tariff: TariffLine) => {
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

              {/* Future Tariffs */}
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
                        {futureTariffsByVersion.reduce(
                          (acc, curr) => acc + curr.tariffs.length,
                          0,
                        )}
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

              {/* Archived Tariffs */}
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
                        {archivedTariffsByVersion.reduce(
                          (acc, curr) => acc + curr.tariffs.length,
                          0,
                        )}
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

              {activeTariffs.length === 0 &&
                futureTariffsByVersion.length === 0 &&
                archivedTariffsByVersion.length === 0 && (
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
          onSuccess={() => loadAmendments()}
        />
      )}
    </div>
  );
}
