// src/features/contract-management/ui/ApprovalModal.tsx

import { useState, useMemo, useEffect } from "react";
import { Button, Badge, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { showToast } from "@shared/ui/ToastContainer";
import { amendmentService } from "../services/AmendmentService";
import type { Contract, ContractAmendment } from "@/types/contract";
import { formatCurrency } from "@shared/lib/formatters";
import { useAuth } from "@features/auth/hooks/useAuth";
import { ModalFooter } from "@shared/ui/Modal";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  amendment: ContractAmendment;
  onSuccess: () => void;
}

type TabKey = "overview" | "changes" | "documents" | "history";

export function ApprovalModal({
  isOpen,
  onClose,
  contract,
  amendment,
  onSuccess,
}: ApprovalModalProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  //  State برای وضعیت فعلی amendment
  const [currentAmendment, setCurrentAmendment] =
    useState<ContractAmendment>(amendment);
  const [isLoading, setIsLoading] = useState(false);

  const loadLatestAmendment = async () => {
    setIsLoading(true);
    try {
      const latest = await amendmentService.getById(amendment.id);
      if (latest) {
        setCurrentAmendment(latest);
        console.log(
          "[ApprovalModal] ✅ Loaded latest amendment status:",
          latest.approval_status,
        );
      }
    } catch (error) {
      console.error(
        "[ApprovalModal] ❌ Failed to load latest amendment:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 🔧 NEW: بارگذاری مجدد وضعیت amendment
  useEffect(() => {
    if (isOpen && amendment.id) {
      loadLatestAmendment();
    }
  }, [isOpen, amendment.id]);
  // 🔧 NEW: بررسی آیا اکشن می‌تواند انجام شود
  const canTakeAction = currentAmendment.approval_status === "PENDING";
  const isApproved = currentAmendment.approval_status === "APPROVED";
  const isRejected = currentAmendment.approval_status === "REJECTED";

  const handleApprove = async () => {
    if (!canTakeAction) {
      showToast(
        "warning",
        "Already Processed",
        "This amendment has already been processed",
      );
      return;
    }

    setIsProcessing(true);
    try {
      await amendmentService.approve(
        currentAmendment.id,
        user?.id || "unknown",
      );
      showToast("success", "Approved", "Amendment approved successfully");

      // 🔧 NEW: بارگذاری مجدد وضعیت
      await loadLatestAmendment();

      onSuccess();

      // بستن مودال بعد از 2 ثانیه
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!canTakeAction) {
      showToast(
        "warning",
        "Already Processed",
        "This amendment has already been processed",
      );
      return;
    }

    if (!rejectionReason.trim()) {
      showToast(
        "error",
        "Validation Error",
        "Please provide a rejection reason",
      );
      return;
    }

    setIsProcessing(true);
    try {
      await amendmentService.reject(
        currentAmendment.id,
        user?.id || "unknown",
        rejectionReason,
      );
      showToast("success", "Rejected", "Amendment rejected");

      // 🔧 NEW: بارگذاری مجدد وضعیت
      await loadLatestAmendment();

      onSuccess();

      // بستن مودال بعد از 2 ثانیه
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🔧 استخراج مدارک
  const documents = useMemo(() => {
    const docs: Array<{ id: string; name: string; url: string; type: string }> =
      [];

    if (
      currentAmendment.attachment_urls &&
      currentAmendment.attachment_urls.length > 0
    ) {
      currentAmendment.attachment_urls.forEach((url, index) => {
        docs.push({
          id: `doc_${index}`,
          name:
            currentAmendment.attachment_names?.[index] || `File ${index + 1}`,
          url: url,
          type: url.split(".").pop()?.toLowerCase() || "file",
        });
      });
    }

    return docs;
  }, [currentAmendment]);

  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: string;
    count?: number;
  }> = [
    { key: "overview", label: "Overview", icon: "📋" },
    { key: "changes", label: "Changes", icon: "🔄" },
    {
      key: "documents",
      label: "Documents",
      icon: "📎",
      count: documents.length,
    },
    { key: "history", label: "Contract Info", icon: "📄" },
  ];

  // 🔧 NEW: Badge برای وضعیت
  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <Badge tone="emerald" className="text-[10px] gap-1">
          <span>✓</span>
          <span>Approved</span>
        </Badge>
      );
    }
    if (isRejected) {
      return (
        <Badge tone="danger" className="text-[10px] gap-1">
          <span>✕</span>
          <span>Rejected</span>
        </Badge>
      );
    }
    return (
      <Badge tone="amber" className="text-[10px] gap-1">
        <span>⏳</span>
        <span>Pending</span>
      </Badge>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔍 Review Amendment"
      size="xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-4xl mb-2 animate-pulse">⏳</div>
            <p
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Loading latest status...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status Banner */}
          {!canTakeAction && (
            <div
              className={`rounded-xl border-2 p-4 ${
                isApproved
                  ? isDark
                    ? "border-emerald-700 bg-emerald-950/30"
                    : "border-emerald-200 bg-emerald-50"
                  : isDark
                    ? "border-rose-700 bg-rose-950/30"
                    : "border-rose-200 bg-rose-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{isApproved ? "✓" : "✕"}</div>
                <div className="flex-1">
                  <h4
                    className={`text-sm font-bold mb-1 ${
                      isApproved
                        ? isDark
                          ? "text-emerald-200"
                          : "text-emerald-900"
                        : isDark
                          ? "text-rose-200"
                          : "text-rose-900"
                    }`}
                  >
                    {isApproved ? "Already Approved" : "Already Rejected"}
                  </h4>
                  <p
                    className={`text-xs ${
                      isApproved
                        ? isDark
                          ? "text-emerald-300"
                          : "text-emerald-800"
                        : isDark
                          ? "text-rose-300"
                          : "text-rose-800"
                    }`}
                  >
                    {isApproved
                      ? `This amendment was approved on ${currentAmendment.approved_at ? new Date(currentAmendment.approved_at).toLocaleString("fa-IR") : "N/A"}`
                      : `This amendment was rejected on ${currentAmendment.created_at ? new Date(currentAmendment.created_at).toLocaleString("fa-IR") : "N/A"}`}
                    {isRejected && currentAmendment.rejection_reason && (
                      <span className="block mt-1 font-semibold">
                        Reason: {currentAmendment.rejection_reason}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Header Info */}
          <div
            className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge tone="indigo" className="text-[10px] font-mono">
                {currentAmendment.amendment_no || "Auto"}
              </Badge>
              {getStatusBadge()}
              <span
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                📅 Effective: {currentAmendment.effective_date}
              </span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {currentAmendment.amendment_types.map((type) => (
                <Badge
                  key={type}
                  tone={
                    type === "DATE_EXTENSION"
                      ? "indigo"
                      : type === "VALUE_INCREASE"
                        ? "emerald"
                        : "amber"
                  }
                  className="text-[10px]"
                >
                  {type === "DATE_EXTENSION"
                    ? "📅 Date Extension"
                    : type === "VALUE_INCREASE"
                      ? "💰 Value Increase"
                      : "📊 Tariff Adjustment"}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div
            className={`flex border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-all relative ${
                  activeTab === tab.key
                    ? isDark
                      ? "text-indigo-300 bg-indigo-950/30"
                      : "text-indigo-700 bg-indigo-50"
                    : isDark
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${
                      isDark
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? "bg-indigo-500" : "bg-indigo-600"}`}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-3">
                <h4
                  className={`text-xs font-bold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Summary
                </h4>

                {currentAmendment.description && (
                  <div
                    className={`p-3 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                  >
                    <div
                      className={`text-[10px] font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Description
                    </div>
                    <div
                      className={`text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}
                    >
                      {currentAmendment.description}
                    </div>
                  </div>
                )}

                <div
                  className={`p-3 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                >
                  <div
                    className={`text-[10px] font-semibold mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Impact Summary
                  </div>
                  <div className="space-y-2">
                    {currentAmendment.amendment_types.includes(
                      "DATE_EXTENSION",
                    ) &&
                      currentAmendment.new_end_date && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            📅 End Date Extension
                          </span>
                          <span
                            className={`text-xs font-mono font-bold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                          >
                            {currentAmendment.previous_end_date} →{" "}
                            {currentAmendment.new_end_date}
                          </span>
                        </div>
                      )}
                    {currentAmendment.amendment_types.includes(
                      "VALUE_INCREASE",
                    ) &&
                      currentAmendment.new_value !== undefined && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            💰 Value Increase
                          </span>
                          <span
                            className={`text-xs font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                          >
                            +
                            {formatCurrency(
                              (currentAmendment.new_value || 0) -
                                (currentAmendment.previous_value || 0),
                              contract.currency,
                            )}
                          </span>
                        </div>
                      )}
                    {currentAmendment.amendment_types.includes(
                      "TARIFF_ADJUSTMENT",
                    ) &&
                      currentAmendment.tariff_adjustments && (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            📊 Tariff Adjustments
                          </span>
                          <span
                            className={`text-xs font-mono font-bold ${isDark ? "text-amber-300" : "text-amber-700"}`}
                          >
                            {currentAmendment.tariff_adjustments.length} line(s)
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Changes Tab */}
            {activeTab === "changes" && (
              <div className="space-y-3">
                {amendment.amendment_types.includes("DATE_EXTENSION") &&
                  amendment.new_end_date && (
                    <div
                      className={`p-3 rounded-lg border ${isDark ? "border-indigo-700 bg-indigo-950/30" : "border-indigo-200 bg-indigo-50"}`}
                    >
                      <h5
                        className={`text-xs font-bold mb-2 ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                      >
                        📅 Date Extension
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div
                            className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Previous
                          </div>
                          <div
                            className={`text-sm font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}
                          >
                            {amendment.previous_end_date}
                          </div>
                        </div>
                        <div>
                          <div
                            className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            New
                          </div>
                          <div
                            className={`text-sm font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                          >
                            {amendment.new_end_date}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {amendment.amendment_types.includes("VALUE_INCREASE") &&
                  amendment.new_value !== undefined && (
                    <div
                      className={`p-3 rounded-lg border ${isDark ? "border-emerald-700 bg-emerald-950/30" : "border-emerald-200 bg-emerald-50"}`}
                    >
                      <h5
                        className={`text-xs font-bold mb-2 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                      >
                        💰 Value Increase
                      </h5>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <div
                            className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Previous
                          </div>
                          <div
                            className={`text-sm font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}
                          >
                            {formatCurrency(
                              amendment.previous_value || 0,
                              contract.currency,
                            )}
                          </div>
                        </div>
                        <div>
                          <div
                            className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            New
                          </div>
                          <div
                            className={`text-sm font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                          >
                            {formatCurrency(
                              amendment.new_value,
                              contract.currency,
                            )}
                          </div>
                        </div>
                        <div>
                          <div
                            className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Increase
                          </div>
                          <div
                            className={`text-sm font-mono font-bold ${isDark ? "text-amber-300" : "text-amber-700"}`}
                          >
                            +
                            {formatCurrency(
                              (amendment.new_value || 0) -
                                (amendment.previous_value || 0),
                              contract.currency,
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {amendment.amendment_types.includes("TARIFF_ADJUSTMENT") &&
                  amendment.tariff_adjustments && (
                    <div
                      className={`p-3 rounded-lg border ${isDark ? "border-amber-700 bg-amber-950/30" : "border-amber-200 bg-amber-50"}`}
                    >
                      <h5
                        className={`text-xs font-bold mb-2 ${isDark ? "text-amber-300" : "text-amber-700"}`}
                      >
                        📊 Tariff Adjustments
                      </h5>
                      <div
                        className={`overflow-x-auto rounded border ${isDark ? "border-slate-700" : "border-slate-200"}`}
                      >
                        <table className="w-full text-xs">
                          <thead
                            className={
                              isDark ? "bg-slate-800/50" : "bg-slate-50"
                            }
                          >
                            <tr>
                              <th className="px-2 py-1.5 text-left">
                                Description
                              </th>
                              <th className="px-2 py-1.5 text-right">
                                Previous Rate
                              </th>
                              <th className="px-2 py-1.5 text-center">Mode</th>
                              <th className="px-2 py-1.5 text-right">
                                New Rate
                              </th>
                              <th className="px-2 py-1.5 text-right">Change</th>
                            </tr>
                          </thead>
                          <tbody
                            className={
                              isDark
                                ? "divide-y divide-slate-700"
                                : "divide-y divide-slate-200"
                            }
                          >
                            {amendment.tariff_adjustments.map((adj, idx) => {
                              const change = adj.new_rate - adj.previous_rate;
                              const changePercent = (
                                (change / adj.previous_rate) *
                                100
                              ).toFixed(1);
                              return (
                                <tr key={idx}>
                                  <td
                                    className={`px-2 py-1.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}
                                  >
                                    Tariff #{idx + 1}
                                  </td>
                                  <td
                                    className={`px-2 py-1.5 text-right font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                                  >
                                    {formatCurrency(
                                      adj.previous_rate,
                                      contract.currency,
                                    )}
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    <Badge tone="slate" className="text-[9px]">
                                      {adj.adjustment_mode === "PERCENTAGE"
                                        ? `${adj.adjustment_percentage}%`
                                        : "Manual"}
                                    </Badge>
                                  </td>
                                  <td
                                    className={`px-2 py-1.5 text-right font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                                  >
                                    {formatCurrency(
                                      adj.new_rate,
                                      contract.currency,
                                    )}
                                  </td>
                                  <td
                                    className={`px-2 py-1.5 text-right font-mono ${change > 0 ? (isDark ? "text-emerald-400" : "text-emerald-600") : isDark ? "text-rose-400" : "text-rose-600"}`}
                                  >
                                    {change > 0 ? "+" : ""}
                                    {formatCurrency(
                                      change,
                                      contract.currency,
                                    )}{" "}
                                    ({changePercent}%)
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <div
                    className={`text-center py-12 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-sm">No documents attached</p>
                  </div>
                ) : (
                  documents.map((doc) => {
                    const fileExt = doc.type.toLowerCase();
                    const isImage = ["jpg", "jpeg", "png", "gif"].includes(
                      fileExt,
                    );
                    const isPdf = fileExt === "pdf";

                    return (
                      <div
                        key={doc.id}
                        className={`rounded-lg border overflow-hidden ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-white"}`}
                      >
                        {isImage && (
                          <div
                            className={`p-2 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
                          >
                            <img
                              src={doc.url}
                              alt={doc.name}
                              className="max-w-full max-h-64 mx-auto rounded"
                            />
                          </div>
                        )}

                        <div className="p-3 flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                              isPdf
                                ? isDark
                                  ? "bg-rose-900/50 text-rose-300"
                                  : "bg-rose-50 text-rose-600"
                                : isImage
                                  ? isDark
                                    ? "bg-emerald-900/50 text-emerald-300"
                                    : "bg-emerald-50 text-emerald-600"
                                  : isDark
                                    ? "bg-indigo-900/50 text-indigo-300"
                                    : "bg-indigo-50 text-indigo-600"
                            }`}
                          >
                            {isPdf ? "📄" : isImage ? "🖼️" : "📎"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-xs font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                            >
                              {doc.name}
                            </div>
                            <div
                              className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {fileExt.toUpperCase()} file
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isDark
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                : "bg-indigo-500 hover:bg-indigo-600 text-white"
                            }`}
                          >
                            {isPdf || isImage ? "👁️ View" : "⬇️ Download"}
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-3">
                <h4
                  className={`text-xs font-bold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Contract Information
                </h4>

                <div
                  className={`p-3 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                >
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div
                        className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        Contract No
                      </div>
                      <div
                        className={`font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {contract.contract_no}
                      </div>
                    </div>
                    <div>
                      <div
                        className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        Client
                      </div>
                      <div
                        className={isDark ? "text-slate-200" : "text-slate-800"}
                      >
                        {contract.client_name}
                      </div>
                    </div>
                    <div>
                      <div
                        className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        Current Value
                      </div>
                      <div
                        className={`font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                      >
                        {formatCurrency(
                          contract.total_value,
                          contract.currency,
                        )}
                      </div>
                    </div>
                    <div>
                      <div
                        className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        End Date
                      </div>
                      <div
                        className={`font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {contract.end_date}
                      </div>
                    </div>
                  </div>
                </div>

                {amendment.created_at && (
                  <div
                    className={`p-3 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                  >
                    <div
                      className={`text-[10px] font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Amendment Requested
                    </div>
                    <div
                      className={`text-xs ${isDark ? "text-slate-200" : "text-slate-800"}`}
                    >
                      {new Date(amendment.created_at).toLocaleString("fa-IR")}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🔧 NEW: Actions - فقط اگر PENDING است */}
          {canTakeAction ? (
            <>
              {/* Reject Input */}
              {showRejectInput && (
                <div
                  className={`rounded-xl border-2 p-4 ${isDark ? "border-rose-700 bg-rose-950/30" : "border-rose-200 bg-rose-50"}`}
                >
                  <label
                    className={`mb-2 block text-xs font-semibold ${isDark ? "text-rose-300" : "text-rose-700"}`}
                  >
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100"
                        : "border-slate-200 bg-white"
                    }`}
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}

              {/* Actions */}
              <div
                className={`flex justify-end gap-3 pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
              >
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>

                {!showRejectInput ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectInput(true)}
                      disabled={isProcessing}
                      className="text-rose-600 border-rose-600 hover:bg-rose-50"
                    >
                      ✕ Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isProcessing ? "⏳ Processing..." : "✓ Approve"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectInput(false);
                        setRejectionReason("");
                      }}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={isProcessing || !rejectionReason.trim()}
                      className="bg-rose-600 hover:bg-rose-700"
                    >
                      {isProcessing
                        ? "⏳ Processing..."
                        : "✕ Confirm Rejection"}
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            // 🔧 NEW: فقط دکمه Close اگر اکشن قبلاً انجام شده
            <div
              className={`flex justify-end pt-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
            >
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
