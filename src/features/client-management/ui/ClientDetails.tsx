// src/features/client-management/ui/ClientDetails.tsx

import { useState, useRef, useMemo } from "react";
import { Button, Badge, Avatar } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useClickOutside } from "@shared/hooks/useClickOutside";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import type { Client, Contract, TariffLine } from "@entities/contract/types";
import { formatCurrency } from "@shared/lib/formatters";
import {
  calculateProgressFromTariffs,
  calculateInvoiceProgress,
  getProgressTextClass,
  getProgressBgClass,
  isExpiringSoon,
} from "@entities/contract/services/contractCalculations";

interface ClientDetailsProps {
  client: Client | null;
  contracts: Contract[];
  clientContracts: Contract[];
  filteredContracts: Contract[];
  contractTab: "ALL" | "CONTRACT" | "WORK_ORDER";
  setContractTab: (tab: "ALL" | "CONTRACT" | "WORK_ORDER") => void;
  contractTariffs: TariffLine[];
  onEdit: () => void;
  onClose: () => void;
  currentDepartment: string;
  onContractClick?: (contract: Contract) => void;
  onDelete?: () => void; // 🔧 حذف canUpdate, canDelete, canRead و اتکا به usePermissionMapping
}

export function ClientDetails({
  client,
  contracts,
  clientContracts,
  filteredContracts,
  contractTab,
  setContractTab,
  contractTariffs,
  onEdit,
  onClose,
  currentDepartment,
  onContractClick,
  onDelete,
}: ClientDetailsProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const emailDropdownRef = useRef<HTMLDivElement>(null);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const contactDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(emailDropdownRef, () => setShowEmailDropdown(false));
  useClickOutside(contactDropdownRef, () => setShowContactDropdown(false));

  const filteredContactPersons = useMemo(() => {
    if (!client || !client.contactPersons) return [];
    return client.contactPersons.filter(
      (cp: any) => cp.department === currentDepartment,
    );
  }, [client, currentDepartment]);

  // 🔐 چک کردن دسترسی‌ها دقیقاً منطبق بر clientElements
  const canEditBtn = canAccessElement("client_btn_edit");
  const canDeleteBtn = canAccessElement("client_btn_delete");
  const canEmails = canAccessElement("client_emails_dropdown");
  const canContacts = canAccessElement("client_contacts_dropdown");
  const canStatAgreements = canAccessElement("client_stat_agreements");
  const canStatValue = canAccessElement("client_stat_value_agreements");
  const canStatInvoiced = canAccessElement("client_stat_invoiced");
  const canStatUninvoiced = canAccessElement("client_stat_uninvoiced");
  const canAgreements = canAccessElement("client_agreements_section");

  // 🔧 اصلاح: استفاده از client_list_item_click برای کلیک روی آیتم‌های قرارداد در لیست
  const canClickContractItem = canAccessElement("client_list_item_click");

  const canAgreementValue = canAccessElement("client_agreement_value");
  const canAgreementProgressWork = canAccessElement(
    "client_agreement_progress_work",
  );
  const canAgreementProgressInvoice = canAccessElement(
    "client_agreement_progress_invoice",
  );
  const canContractDates = canAccessElement("client_contract_dates");

  // Empty state
  if (!client) {
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
            className={`text-3xl font-bold mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}
          >
            OFFSHORE & ENERGY DEPARTMENT INSPECTION PLATFORM
          </h2>
          <p
            className={`text-base max-w-md mx-auto leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            Select a client from the list to view details and contracts
          </p>
        </div>
      </div>
    );
  }

  // Computed values
  const totalValue = clientContracts.reduce((sum, c) => sum + c.total_value, 0);
  const totalInvoiced = (() => {
    const contractIds = clientContracts.map((c) => c.id);
    return contractTariffs
      .filter((t) => contractIds.includes(t.contract_id || ""))
      .reduce((sum, t) => sum + (t.invoiced || 0), 0);
  })();
  const totalUninvoicedWork = (() => {
    const contractIds = clientContracts.map((c) => c.id);
    const tariffs = contractTariffs.filter((t) =>
      contractIds.includes(t.contract_id || ""),
    );
    const performedWork = tariffs.reduce((sum, t) => {
      const rate =
        typeof t.rate === "string"
          ? Number(t.rate.replace(/,/g, "")) || 0
          : t.rate || 0;
      const consumed = t.consumed_quantity || 0;
      return sum + rate * consumed;
    }, 0);
    return Math.max(0, performedWork - totalInvoiced);
  })();

  const summaryTitle =
    contractTab === "ALL"
      ? "Total Agreements"
      : contractTab === "CONTRACT"
        ? "Total Contracts"
        : "Total Work Orders";
  const dynamicContractCount = filteredContracts.length;

  const handleCopyEmail = async (email: string) => {
    let success = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(email);
        success = true;
      } catch (err) {
        /* fallback */
      }
    }
    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = email;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (err) {
        /* error */
      }
    }
    if (success) setToastMessage("✅ Email address copied!");
    setTimeout(() => setToastMessage(""), 2500);
  };

  const handleContractClick = (contract: Contract) => {
    if (!canClickContractItem) return; // 🔐 محافظت از کلیک
    onContractClick?.(contract);
  };

  return (
    <div
      className={`col-span-1 lg:col-span-8 flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl shadow-black/30" : "bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 border border-slate-200/70 shadow-xl shadow-slate-200/50"}`}
    >
      {/* Header */}
      <div
        className={`relative px-6 py-4 border-b ${isDark ? "border-slate-700/50 bg-gradient-to-r from-indigo-900/30 via-slate-900 to-violet-900/30" : "border-slate-200/70 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/50"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Client Details
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shadow-lg ${isDark ? "border-slate-600 bg-slate-800 shadow-black/30" : "border-slate-200 bg-slate-50 shadow-slate-200/50"} flex items-center justify-center`}
            >
              <Avatar
                name={client.name_en}
                gradient={client.logoColor}
                size="lg"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className={`text-xl font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {client.name_en}
              </h3>
              <p
                className={`text-sm truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}
                dir="rtl"
              >
                {client.name_fa}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* 🔐 client_btn_edit */}
            {canEditBtn && (
              <Button
                variant="outline"
                size="md"
                onClick={onEdit}
                className="gap-2 shadow-sm transition-all hover:scale-105"
              >
                <span>✏️</span> Edit Client
              </Button>
            )}
            {/* 🔐 client_btn_delete */}
            {canDeleteBtn && onDelete && (
              <Button
                variant="danger"
                size="md"
                onClick={onDelete}
                className="gap-2 shadow-sm transition-all hover:scale-105"
              >
                <span>🗑️</span> Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Company/Personal Information */}
          {client.type === "LEGAL" ? (
            <div
              className={`rounded-xl border p-4 ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/70 bg-slate-50/50"}`}
            >
              <h3
                className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                🏢 Company Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    National ID
                  </div>
                  <div
                    className={`font-mono text-xs truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {client.national_id || "—"}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Registration No
                  </div>
                  <div
                    className={`font-mono text-xs truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {(client as any).registration_no || "—"}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Economic Code
                  </div>
                  <div
                    className={`font-mono text-xs truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {(client as any).economic_code || "—"}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Abbreviated Name
                  </div>
                  <div
                    className={`text-xs truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {(client as any).abbreviated_name || "—"}
                  </div>
                </div>

                {/* 🔐 client_emails_dropdown */}
                {canEmails && (
                  <div className="relative" ref={emailDropdownRef}>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Emails
                    </div>
                    {(() => {
                      const allEmails = [
                        ...(client.email ? [client.email] : []),
                        ...((client as any).emails || []),
                      ].filter(
                        (email, index, self) => self.indexOf(email) === index,
                      );
                      if (allEmails.length > 0) {
                        return (
                          <button
                            onClick={() =>
                              setShowEmailDropdown(!showEmailDropdown)
                            }
                            className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
                          >
                            <span>
                              📧 {allEmails.length} email
                              {allEmails.length > 1 ? "s" : ""}
                            </span>
                            <span
                              className={`text-[10px] transition-transform ${showEmailDropdown ? "rotate-180" : ""}`}
                            >
                              ▼
                            </span>
                          </button>
                        );
                      }
                      return (
                        <div
                          className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          —
                        </div>
                      );
                    })()}
                    {showEmailDropdown && (
                      <div
                        className={`absolute top-full left-0 mt-1 w-72 rounded-xl border shadow-xl z-50 py-2 max-h-80 overflow-y-auto ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                      >
                        {/* محتوای دراپ‌داون ایمیل (همان کد قبلی شما) */}
                        {client.email && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyEmail(client.email!);
                              setShowEmailDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors flex items-center gap-2 border-b ${isDark ? "text-slate-200 hover:bg-indigo-900/30 border-slate-700" : "text-slate-700 hover:bg-indigo-50 border-slate-100"}`}
                          >
                            <span className="truncate">{client.email}</span>
                            <span
                              className={`ml-auto ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              📋
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 🔐 client_contacts_dropdown */}
                {canContacts && (
                  <div className="relative" ref={contactDropdownRef}>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Contact Persons
                    </div>
                    {filteredContactPersons.length > 0 ? (
                      <button
                        onClick={() =>
                          setShowContactDropdown(!showContactDropdown)
                        }
                        className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
                      >
                        <span>
                          👥 {filteredContactPersons.length} contact
                          {filteredContactPersons.length > 1 ? "s" : ""}
                        </span>
                        <span
                          className={`text-[10px] transition-transform ${showContactDropdown ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </button>
                    ) : (
                      <div
                        className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        —
                      </div>
                    )}
                    {showContactDropdown &&
                      filteredContactPersons.length > 0 && (
                        <div
                          className={`absolute top-full left-0 mt-1 w-72 rounded-xl border shadow-xl z-50 py-2 max-h-80 overflow-y-auto ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                        >
                          {filteredContactPersons.map((cp: any) => (
                            <div
                              key={cp.id}
                              className={`px-3 py-2 border-b last:border-0 transition-colors ${isDark ? "border-slate-700 hover:bg-slate-700/50" : "border-slate-100 hover:bg-slate-50"}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-xs font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                                >
                                  {cp.name}
                                </span>
                              </div>
                              {cp.position && (
                                <div
                                  className={`text-[10px] mb-1 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                                >
                                  {cp.position}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-slate-400">📞</span>
                                <span
                                  className={`font-mono ${isDark ? "text-slate-200" : "text-slate-700"}`}
                                >
                                  {cp.mobile}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Personal Information (ساختار مشابه بالا با canEmails)
            <div
              className={`rounded-xl border p-4 ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/70 bg-slate-50/50"}`}
            >
              <h3
                className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                👤 Personal Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    National Code
                  </div>
                  <div
                    className={`font-mono text-xs truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {client.national_id || "—"}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Mobile
                  </div>
                  <div
                    className={`text-xs truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {client.phone || "—"}
                  </div>
                </div>
                {/* 🔐 client_emails_dropdown (مشابه بخش حقوقی) */}
                {canEmails && (
                  <div className="relative" ref={emailDropdownRef}>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Emails
                    </div>
                    {client.email && (
                      <button
                        onClick={() => setShowEmailDropdown(!showEmailDropdown)}
                        className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
                      >
                        <span>📧 1 email</span>
                        <span
                          className={`text-[10px] transition-transform ${showEmailDropdown ? "rotate-180" : ""}`}
                        >
                          ▼
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🔐 Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {canStatAgreements && (
              <div
                className={`rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? "border-slate-700/50 bg-slate-800/50" : "border-slate-200/70 bg-white"}`}
              >
                <div
                  className={`text-[10px] uppercase font-semibold mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {summaryTitle}
                </div>
                <div
                  className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  {dynamicContractCount}
                </div>
              </div>
            )}
            {canStatValue && (
              <div
                className={`rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? "border-emerald-700/50 bg-emerald-900/20" : "border-emerald-200/70 bg-emerald-50"}`}
              >
                <div
                  className={`text-[10px] uppercase font-semibold mb-2 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
                >
                  Total Value
                </div>
                <div
                  className={`text-lg font-bold truncate ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                >
                  {formatCurrency(totalValue)}
                </div>
              </div>
            )}
            {canStatInvoiced && (
              <div
                className={`rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? "border-indigo-700/50 bg-indigo-900/20" : "border-indigo-200/70 bg-indigo-50"}`}
              >
                <div
                  className={`text-[10px] uppercase font-semibold mb-2 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}
                >
                  Invoiced Works
                </div>
                <div
                  className={`text-lg font-bold truncate ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                >
                  {formatCurrency(totalInvoiced)}
                </div>
              </div>
            )}
            {canStatUninvoiced && (
              <div
                className={`rounded-xl border p-4 transition-all hover:shadow-md ${isDark ? "border-rose-700/50 bg-rose-900/20" : "border-rose-200/70 bg-rose-50"}`}
              >
                <div
                  className={`text-[10px] uppercase font-semibold mb-2 ${isDark ? "text-rose-400" : "text-rose-700"}`}
                >
                  Not Invoiced
                </div>
                <div
                  className={`text-lg font-bold truncate ${isDark ? "text-rose-300" : "text-rose-700"}`}
                >
                  {formatCurrency(totalUninvoicedWork)}
                </div>
              </div>
            )}
          </div>

          {/* 🔐 client_agreements_section */}
          {canAgreements && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  Agreements
                </h3>
                {/* 🔧 اصلاح: حذف canAgreementsTabs و نمایش مستقیم تب‌ها در صورت دسترسی به بخش agreements */}
                <div
                  className={`flex gap-1 rounded-lg p-0.5 ${isDark ? "bg-slate-800/50 border border-slate-700/50" : "bg-slate-100 border border-slate-200/70"}`}
                >
                  {(["ALL", "CONTRACT", "WORK_ORDER"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setContractTab(t)}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        contractTab === t
                          ? isDark
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                            : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md"
                          : isDark
                            ? "text-slate-400 hover:text-slate-200"
                            : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {t === "ALL"
                        ? `All (${clientContracts.length})`
                        : t === "CONTRACT"
                          ? `📄 Contracts`
                          : `📦 Work Orders`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredContracts.map((contract) => {
                  const workProgress = calculateProgressFromTariffs(contract);
                  const invoiceProgress = calculateInvoiceProgress(contract);
                  const expiringInfo = contract.end_date
                    ? isExpiringSoon(contract)
                    : { expiring: false, daysLeft: 0 };

                  return (
                    <div
                      key={contract.id}
                      onClick={() => handleContractClick(contract)}
                      className={`group rounded-xl border p-4 transition-all ${
                        canClickContractItem
                          ? "cursor-pointer hover:shadow-md hover:scale-[1.01]"
                          : "cursor-not-allowed opacity-70"
                      } ${isDark ? "border-slate-700/50 bg-slate-800/30 hover:border-indigo-500/50" : "border-slate-200/70 bg-white/50 hover:border-indigo-300/50"} ${
                        expiringInfo.expiring
                          ? isDark
                            ? "border-amber-700/50 bg-amber-950/20"
                            : "border-amber-300/70 bg-amber-50/50"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge
                              tone={
                                contract.type === "CONTRACT"
                                  ? "indigo"
                                  : "amber"
                              }
                              className="text-[9px]"
                            >
                              {contract.type === "CONTRACT"
                                ? "📄 Contract"
                                : "📦 Work Order"}
                            </Badge>
                            <span
                              className={`font-mono text-[11px] truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}
                            >
                              {contract.contract_no}
                            </span>
                            {expiringInfo.expiring && (
                              <Badge
                                tone="danger"
                                className="gap-1 animate-pulse text-[9px]"
                              >
                                <span>⚠️</span>
                                <span>Expiring Soon</span>
                              </Badge>
                            )}
                          </div>
                          <h4
                            className={`text-sm font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                            title={contract.contract_title}
                          >
                            {contract.contract_title}
                          </h4>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          {/* 🔐 client_agreement_value */}
                          {canAgreementValue && (
                            <div
                              className={`text-sm font-bold truncate mb-1 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                              title={formatCurrency(
                                contract.total_value,
                                contract.currency,
                              )}
                            >
                              {formatCurrency(
                                contract.total_value,
                                contract.currency,
                              )}
                            </div>
                          )}
                          <Badge
                            tone={
                              contract.status === "ACTIVE" ? "emerald" : "slate"
                            }
                            className="text-[9px]"
                          >
                            {contract.status === "ACTIVE"
                              ? "🟢 Active"
                              : contract.status}
                          </Badge>
                        </div>
                      </div>

                      {/* 🔐 client_agreement_progress_work */}
                      {canAgreementProgressWork && (
                        <>
                          <div
                            className={`flex items-center justify-between text-[10px] mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            <span>Work Performed</span>
                            <span
                              className={`font-bold ${getProgressTextClass(workProgress)}`}
                            >
                              {workProgress.toFixed(1)}%
                            </span>
                          </div>
                          <div
                            className={`h-1.5 rounded-full overflow-hidden mb-3 ${isDark ? "bg-slate-700/50" : "bg-slate-200/70"}`}
                          >
                            <div
                              className={`h-full rounded-full transition-all ${getProgressBgClass(workProgress)}`}
                              style={{
                                width: `${Math.min(workProgress, 100)}%`,
                              }}
                            />
                          </div>
                        </>
                      )}

                      {/* 🔐 client_agreement_progress_invoice */}
                      {canAgreementProgressInvoice && (
                        <>
                          <div
                            className={`flex items-center justify-between text-[10px] mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            <span>Invoiced</span>
                            <span
                              className={`font-bold ${getProgressTextClass(invoiceProgress)}`}
                            >
                              {invoiceProgress.toFixed(1)}%
                            </span>
                          </div>
                          <div
                            className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700/50" : "bg-slate-200/70"}`}
                          >
                            <div
                              className={`h-full rounded-full transition-all ${getProgressBgClass(invoiceProgress)}`}
                              style={{
                                width: `${Math.min(invoiceProgress, 100)}%`,
                              }}
                            />
                          </div>
                        </>
                      )}

                      {/* 🔐 client_contract_dates */}
                      {canContractDates && (
                        <div
                          className={`flex items-center justify-between text-[11px] mt-3 pt-3 border-t ${isDark ? "border-slate-700/50 text-slate-400" : "border-slate-200/70 text-slate-600"}`}
                        >
                          <span>
                            📅 {contract.start_date} → {contract.end_date}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 font-medium">
                            View Details →
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
