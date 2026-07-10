// src/features/contract-management/ui/ContractDocumentsModal.tsx

import { useMemo, useState } from "react";
import { Button, Badge, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Contract, ContractAmendment } from "@/types/contract";
import { formatCurrency } from "@shared/lib/formatters";
import { AnimatedCollapse } from "@shared/ui/AnimatedCollapse";

interface ContractDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  amendments: ContractAmendment[];
}

interface ContractDocument {
  id: string;
  name: string;
  url: string;
  type: "contract" | "letter" | "amendment";
  amendment_no?: string;
  uploaded_at?: string;
}

type TabKey = "documents" | "ammendments" | "history";

export function ContractDocumentsModal({
  isOpen,
  onClose,
  contract,
  amendments,
}: ContractDocumentsModalProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>("documents");
  const [expandedAmendment, setExpandedAmendment] = useState<string | null>(
    null,
  );

  // 🔧 FIX: فقط amendments تایید شده
  const approvedAmendments = useMemo(() => {
    return amendments.filter((a) => a.approval_status === "APPROVED");
  }, [amendments]);

  // 🔧 NEW: همه amendments (برای History)
  const allAmendments = useMemo(() => {
    return [...amendments].sort((a, b) => {
      // اول بر اساس status مرتب کن
      const statusOrder = { APPROVED: 1, PENDING: 2, REJECTED: 3 };
      const statusDiff =
        (statusOrder[a.approval_status] || 99) -
        (statusOrder[b.approval_status] || 99);
      if (statusDiff !== 0) return statusDiff;

      // اگر status یکسان، بر اساس تاریخ
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [amendments]);

  // 🔧 FIX: استخراج مدارک - فقط از amendments تایید شده
  const documents = useMemo((): ContractDocument[] => {
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

    // 🔧 FIX: فقط amendments تایید شده
    approvedAmendments.forEach((amendment) => {
      if (amendment.attachment_urls && amendment.attachment_urls.length > 0) {
        amendment.attachment_urls.forEach((url, index) => {
          docs.push({
            id: `doc_amendment_${amendment.id}_${index}`,
            name:
              amendment.attachment_names?.[index] ||
              `Amendment ${amendment.amendment_no || amendment.id}`,
            url: url,
            type: "amendment",
            amendment_no: amendment.amendment_no,
            uploaded_at: amendment.created_at,
          });
        });
      }
    });

    return docs;
  }, [contract, approvedAmendments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge tone="emerald" className="text-[9px]">
            ✓ Approved
          </Badge>
        );
      case "PENDING":
        return (
          <Badge tone="amber" className="text-[9px]">
            ⏳ Pending
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge tone="danger" className="text-[9px]">
            ✕ Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return isDark
          ? "border-emerald-700/50 bg-emerald-950/20"
          : "border-emerald-200 bg-emerald-50/50";
      case "PENDING":
        return isDark
          ? "border-amber-700/50 bg-amber-950/20"
          : "border-amber-200 bg-amber-50/50";
      case "REJECTED":
        return isDark
          ? "border-rose-700/50 bg-rose-950/20"
          : "border-rose-200 bg-rose-50/50";
      default:
        return isDark
          ? "border-slate-700/50 bg-slate-950/20"
          : "border-slate-200 bg-slate-50/50";
    }
  };

  const getDotColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return isDark
          ? "border-emerald-500 bg-emerald-900/50"
          : "border-emerald-500 bg-emerald-50";
      case "PENDING":
        return isDark
          ? "border-amber-500 bg-amber-900/50"
          : "border-amber-500 bg-amber-50";
      case "REJECTED":
        return isDark
          ? "border-rose-500 bg-rose-900/50"
          : "border-rose-500 bg-rose-50";
      default:
        return isDark
          ? "border-slate-500 bg-slate-900/50"
          : "border-slate-500 bg-slate-50";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📎 Documents & Amendments"
      size="xl"
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div
          className={`flex border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
        >
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-all relative ${
              activeTab === "documents"
                ? isDark
                  ? "text-indigo-300 bg-indigo-950/30"
                  : "text-indigo-700 bg-indigo-50"
                : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📄 Documents ({documents.length})
            {activeTab === "documents" && (
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? "bg-indigo-500" : "bg-indigo-600"}`}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("ammendments")}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-all relative ${
              activeTab === "ammendments"
                ? isDark
                  ? "text-emerald-300 bg-emerald-950/30"
                  : "text-emerald-700 bg-emerald-50"
                : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ✓ Ammendments ({approvedAmendments.length})
            {activeTab === "ammendments" && (
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? "bg-emerald-500" : "bg-emerald-600"}`}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-all relative ${
              activeTab === "history"
                ? isDark
                  ? "text-slate-300 bg-slate-800/50"
                  : "text-slate-700 bg-slate-100"
                : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📜 History ({allAmendments.length})
            {activeTab === "history" && (
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? "bg-slate-500" : "bg-slate-600"}`}
              />
            )}
          </button>
        </div>

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="space-y-2">
            {documents.length === 0 ? (
              <div
                className={`text-center py-12 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                <div className="text-4xl mb-2">📭</div>
                <p>No documents attached</p>
              </div>
            ) : (
              documents.map((doc, index) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all animate-fadeIn hover:scale-[1.01] ${
                    isDark
                      ? "border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                      doc.type === "contract"
                        ? isDark
                          ? "bg-indigo-900/50 text-indigo-300"
                          : "bg-indigo-50 text-indigo-600"
                        : doc.type === "letter"
                          ? isDark
                            ? "bg-violet-900/50 text-violet-300"
                            : "bg-violet-50 text-violet-600"
                          : isDark
                            ? "bg-amber-900/50 text-amber-300"
                            : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {doc.type === "contract"
                      ? "📄"
                      : doc.type === "letter"
                        ? "📨"
                        : "🔄"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-xs font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {doc.name}
                    </div>
                    <div
                      className={`text-[10px] flex items-center gap-2 mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      <Badge
                        tone={
                          doc.type === "contract"
                            ? "indigo"
                            : doc.type === "letter"
                              ? "violet"
                              : "amber"
                        }
                        className="text-[9px] px-1.5 py-0"
                      >
                        {doc.type === "contract"
                          ? "Contract"
                          : doc.type === "letter"
                            ? "Letter"
                            : "Amendment"}
                      </Badge>
                      {doc.amendment_no && (
                        <span className="font-mono">{doc.amendment_no}</span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`text-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    ⬇️
                  </div>
                </a>
              ))
            )}
          </div>
        )}

        {/* Amendments Tab - فقط تایید شده‌ها */}
        {activeTab === "ammendments" && (
          <div className="relative pl-6">
            {approvedAmendments.length === 0 ? (
              <div
                className={`text-center py-12 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                <div className="text-4xl mb-2">📭</div>
                <p>No approved amendments yet</p>
              </div>
            ) : (
              <>
                <div
                  className={`absolute left-2 top-0 bottom-0 w-0.5 ${isDark ? "bg-emerald-700" : "bg-emerald-200"}`}
                />
                <div className="space-y-3">
                  {approvedAmendments.map((amendment, index) => (
                    <div
                      key={amendment.id}
                      className="relative animate-fadeIn"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div
                        className={`absolute -left-4 top-3 w-4 h-4 rounded-full border-2 ${getDotColor(amendment.approval_status)}`}
                      />

                      <div
                        className={`rounded-lg border p-3 ${getStatusColor(amendment.approval_status)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              tone="indigo"
                              className="text-[9px] font-mono"
                            >
                              {amendment.amendment_no || "Auto"}
                            </Badge>
                            {getStatusBadge(amendment.approval_status)}
                            <span
                              className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                            >
                              📅 {amendment.effective_date}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setExpandedAmendment(
                                expandedAmendment === amendment.id
                                  ? null
                                  : amendment.id,
                              )
                            }
                            className={`text-xs px-2 py-1 rounded transition-all ${
                              isDark
                                ? "text-slate-400 hover:bg-slate-700"
                                : "text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {expandedAmendment === amendment.id
                              ? "Hide"
                              : "Details"}
                          </button>
                        </div>

                        <div className="flex gap-1 flex-wrap mb-2">
                          {amendment.amendment_types.map((type) => (
                            <Badge
                              key={type}
                              tone={
                                type === "DATE_EXTENSION"
                                  ? "indigo"
                                  : type === "VALUE_INCREASE"
                                    ? "emerald"
                                    : "amber"
                              }
                              className="text-[9px]"
                            >
                              {type === "DATE_EXTENSION"
                                ? "📅 Date"
                                : type === "VALUE_INCREASE"
                                  ? "💰 Value"
                                  : "📊 Tariff"}
                            </Badge>
                          ))}
                        </div>

                        {amendment.description && (
                          <p
                            className={`text-xs mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            {amendment.description}
                          </p>
                        )}

                        <AnimatedCollapse
                          isOpen={expandedAmendment === amendment.id}
                        >
                          <div
                            className={`mt-3 pt-3 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
                          >
                            <h5
                              className={`text-[10px] font-bold mb-2 uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
                            >
                              Changes Applied
                            </h5>
                            <div className="space-y-2 text-xs">
                              {amendment.amendment_types.includes(
                                "DATE_EXTENSION",
                              ) &&
                                amendment.previous_end_date &&
                                amendment.new_end_date && (
                                  <div
                                    className={`p-2 rounded ${isDark ? "bg-indigo-950/30 border border-indigo-800" : "bg-indigo-50 border border-indigo-200"}`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span>📅</span>
                                      <span
                                        className={`font-semibold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                                      >
                                        Date Extension
                                      </span>
                                    </div>
                                    <div
                                      className={`font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                                    >
                                      {amendment.previous_end_date} →{" "}
                                      {amendment.new_end_date}
                                    </div>
                                  </div>
                                )}

                              {amendment.amendment_types.includes(
                                "VALUE_INCREASE",
                              ) &&
                                amendment.previous_value !== undefined &&
                                amendment.new_value !== undefined && (
                                  <div
                                    className={`p-2 rounded ${isDark ? "bg-emerald-950/30 border border-emerald-800" : "bg-emerald-50 border border-emerald-200"}`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span>💰</span>
                                      <span
                                        className={`font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                                      >
                                        Value Increase
                                      </span>
                                    </div>
                                    <div
                                      className={`font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                                    >
                                      {formatCurrency(
                                        amendment.previous_value,
                                        contract.currency,
                                      )}{" "}
                                      →{" "}
                                      {formatCurrency(
                                        amendment.new_value,
                                        contract.currency,
                                      )}
                                    </div>
                                    <div
                                      className={`text-[10px] mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                                    >
                                      +
                                      {formatCurrency(
                                        amendment.new_value -
                                          (amendment.previous_value || 0),
                                        contract.currency,
                                      )}
                                    </div>
                                  </div>
                                )}

                              {amendment.amendment_types.includes(
                                "TARIFF_ADJUSTMENT",
                              ) &&
                                amendment.tariff_adjustments &&
                                amendment.tariff_adjustments.length > 0 && (
                                  <div
                                    className={`p-2 rounded ${isDark ? "bg-amber-950/30 border border-amber-800" : "bg-amber-50 border border-amber-200"}`}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <span>📊</span>
                                      <span
                                        className={`font-semibold ${isDark ? "text-amber-300" : "text-amber-700"}`}
                                      >
                                        Tariff Adjustments (
                                        {amendment.tariff_adjustments.length})
                                      </span>
                                    </div>
                                    <div className="space-y-1">
                                      {amendment.tariff_adjustments.map(
                                        (adj) => (
                                          <div
                                            key={adj.id}
                                            className={`flex items-center justify-between text-[10px] font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                                          >
                                            <span>
                                              {adj.adjustment_mode ===
                                              "PERCENTAGE"
                                                ? `${adj.adjustment_percentage}%`
                                                : "Manual"}
                                            </span>
                                            <span>
                                              {formatCurrency(
                                                adj.previous_rate,
                                                contract.currency,
                                              )}{" "}
                                              →{" "}
                                              {formatCurrency(
                                                adj.new_rate,
                                                contract.currency,
                                              )}
                                            </span>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </AnimatedCollapse>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* History Tab - همه amendments */}
        {activeTab === "history" && (
          <div className="relative pl-6">
            {allAmendments.length === 0 ? (
              <div
                className={`text-center py-12 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                <div className="text-4xl mb-2">📭</div>
                <p>No amendments in history</p>
              </div>
            ) : (
              <>
                <div
                  className={`absolute left-2 top-0 bottom-0 w-0.5 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
                <div className="space-y-3">
                  {allAmendments.map((amendment, index) => (
                    <div
                      key={amendment.id}
                      className="relative animate-fadeIn"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div
                        className={`absolute -left-4 top-3 w-4 h-4 rounded-full border-2 ${getDotColor(amendment.approval_status)}`}
                      />

                      <div
                        className={`rounded-lg border p-3 ${getStatusColor(amendment.approval_status)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              tone="indigo"
                              className="text-[9px] font-mono"
                            >
                              {amendment.amendment_no || "Auto"}
                            </Badge>
                            {getStatusBadge(amendment.approval_status)}
                            <span
                              className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                            >
                              📅 {amendment.effective_date}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setExpandedAmendment(
                                expandedAmendment === amendment.id
                                  ? null
                                  : amendment.id,
                              )
                            }
                            className={`text-xs px-2 py-1 rounded transition-all ${
                              isDark
                                ? "text-slate-400 hover:bg-slate-700"
                                : "text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {expandedAmendment === amendment.id
                              ? "Hide"
                              : "Details"}
                          </button>
                        </div>

                        <div className="flex gap-1 flex-wrap mb-2">
                          {amendment.amendment_types.map((type) => (
                            <Badge
                              key={type}
                              tone={
                                type === "DATE_EXTENSION"
                                  ? "indigo"
                                  : type === "VALUE_INCREASE"
                                    ? "emerald"
                                    : "amber"
                              }
                              className="text-[9px]"
                            >
                              {type === "DATE_EXTENSION"
                                ? "📅 Date"
                                : type === "VALUE_INCREASE"
                                  ? "💰 Value"
                                  : "📊 Tariff"}
                            </Badge>
                          ))}
                        </div>

                        {amendment.description && (
                          <p
                            className={`text-xs mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            {amendment.description}
                          </p>
                        )}

                        {/* Rejection Reason */}
                        {amendment.approval_status === "REJECTED" &&
                          amendment.rejection_reason && (
                            <div
                              className={`mt-2 p-2 rounded text-xs ${isDark ? "bg-rose-900/30 text-rose-300 border border-rose-800" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
                            >
                              <div className="flex items-start gap-2">
                                <span>✕</span>
                                <div>
                                  <div className="font-semibold mb-1">
                                    Rejection Reason:
                                  </div>
                                  <div>{amendment.rejection_reason}</div>
                                </div>
                              </div>
                            </div>
                          )}

                        <AnimatedCollapse
                          isOpen={expandedAmendment === amendment.id}
                        >
                          <div
                            className={`mt-3 pt-3 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
                          >
                            <h5
                              className={`text-[10px] font-bold mb-2 uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
                            >
                              {amendment.approval_status === "APPROVED"
                                ? "Changes Applied"
                                : amendment.approval_status === "REJECTED"
                                  ? "Proposed Changes (Not Applied)"
                                  : "Proposed Changes (Pending)"}
                            </h5>
                            <div className="space-y-2 text-xs">
                              {amendment.amendment_types.includes(
                                "DATE_EXTENSION",
                              ) &&
                                amendment.previous_end_date &&
                                amendment.new_end_date && (
                                  <div
                                    className={`p-2 rounded ${isDark ? "bg-indigo-950/30 border border-indigo-800" : "bg-indigo-50 border border-indigo-200"}`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span>📅</span>
                                      <span
                                        className={`font-semibold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                                      >
                                        Date Extension
                                      </span>
                                    </div>
                                    <div
                                      className={`font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                                    >
                                      {amendment.previous_end_date} →{" "}
                                      {amendment.new_end_date}
                                    </div>
                                  </div>
                                )}

                              {amendment.amendment_types.includes(
                                "VALUE_INCREASE",
                              ) &&
                                amendment.previous_value !== undefined &&
                                amendment.new_value !== undefined && (
                                  <div
                                    className={`p-2 rounded ${isDark ? "bg-emerald-950/30 border border-emerald-800" : "bg-emerald-50 border border-emerald-200"}`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span>💰</span>
                                      <span
                                        className={`font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                                      >
                                        Value Increase
                                      </span>
                                    </div>
                                    <div
                                      className={`font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                                    >
                                      {formatCurrency(
                                        amendment.previous_value,
                                        contract.currency,
                                      )}{" "}
                                      →{" "}
                                      {formatCurrency(
                                        amendment.new_value,
                                        contract.currency,
                                      )}
                                    </div>
                                    <div
                                      className={`text-[10px] mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                                    >
                                      +
                                      {formatCurrency(
                                        amendment.new_value -
                                          (amendment.previous_value || 0),
                                        contract.currency,
                                      )}
                                    </div>
                                  </div>
                                )}

                              {amendment.amendment_types.includes(
                                "TARIFF_ADJUSTMENT",
                              ) &&
                                amendment.tariff_adjustments &&
                                amendment.tariff_adjustments.length > 0 && (
                                  <div
                                    className={`p-2 rounded ${isDark ? "bg-amber-950/30 border border-amber-800" : "bg-amber-50 border border-amber-200"}`}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <span>📊</span>
                                      <span
                                        className={`font-semibold ${isDark ? "text-amber-300" : "text-amber-700"}`}
                                      >
                                        Tariff Adjustments (
                                        {amendment.tariff_adjustments.length})
                                      </span>
                                    </div>
                                    <div className="space-y-1">
                                      {amendment.tariff_adjustments.map(
                                        (adj) => (
                                          <div
                                            key={adj.id}
                                            className={`flex items-center justify-between text-[10px] font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                                          >
                                            <span>
                                              {adj.adjustment_mode ===
                                              "PERCENTAGE"
                                                ? `${adj.adjustment_percentage}%`
                                                : "Manual"}
                                            </span>
                                            <span>
                                              {formatCurrency(
                                                adj.previous_rate,
                                                contract.currency,
                                              )}{" "}
                                              →{" "}
                                              {formatCurrency(
                                                adj.new_rate,
                                                contract.currency,
                                              )}
                                            </span>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </AnimatedCollapse>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div
          className={`flex justify-end pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
        >
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
