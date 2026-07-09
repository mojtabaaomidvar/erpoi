// src/features/contract-management/ui/ApprovalModal.tsx

import { useState } from "react";
import { Button, Badge, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { showToast } from "@shared/ui/ToastContainer";
import { amendmentService } from "../services/AmendmentService";
import type { Contract, ContractAmendment } from "@/types/contract";
import { formatCurrency } from "@shared/lib/formatters";
import { useAuth } from "@features/auth/hooks/useAuth";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  amendment: ContractAmendment;
  onSuccess: () => void;
}

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

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await amendmentService.approve(amendment.id, user?.id || "unknown");
      showToast(
        "success",
        "Approved",
        "Amendment has been approved successfully",
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
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
      await amendmentService.reject(amendment.id, rejectionReason);
      showToast("success", "Rejected", "Amendment has been rejected");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔍 Review Amendment"
      size="lg"
    >
      <div className="space-y-4">
        {/* Amendment Info */}
        <div
          className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge tone="indigo" className="text-[10px] font-mono">
              {amendment.amendment_no || "Auto"}
            </Badge>
            <Badge tone="amber" className="text-[10px]">
              ⏳ Pending Approval
            </Badge>
            <span
              className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              📅 {amendment.effective_date}
            </span>
          </div>

          {/* Types */}
          <div className="flex gap-1 flex-wrap mb-3">
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

          {/* Changes */}
          <div className="space-y-2">
            {amendment.amendment_types.includes("DATE_EXTENSION") &&
              amendment.new_end_date && (
                <div
                  className={`p-2 rounded ${isDark ? "bg-indigo-950/30" : "bg-indigo-50"}`}
                >
                  <div
                    className={`text-[10px] font-semibold mb-1 ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                  >
                    📅 Date Extension
                  </div>
                  <div
                    className={`text-xs font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {amendment.previous_end_date} → {amendment.new_end_date}
                  </div>
                </div>
              )}

            {amendment.amendment_types.includes("VALUE_INCREASE") &&
              amendment.new_value !== undefined && (
                <div
                  className={`p-2 rounded ${isDark ? "bg-emerald-950/30" : "bg-emerald-50"}`}
                >
                  <div
                    className={`text-[10px] font-semibold mb-1 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                  >
                    💰 Value Increase
                  </div>
                  <div
                    className={`text-xs font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {formatCurrency(
                      amendment.previous_value || 0,
                      contract.currency,
                    )}{" "}
                    → {formatCurrency(amendment.new_value, contract.currency)}
                  </div>
                </div>
              )}

            {amendment.amendment_types.includes("TARIFF_ADJUSTMENT") &&
              amendment.tariff_adjustments && (
                <div
                  className={`p-2 rounded ${isDark ? "bg-amber-950/30" : "bg-amber-50"}`}
                >
                  <div
                    className={`text-[10px] font-semibold mb-1 ${isDark ? "text-amber-300" : "text-amber-700"}`}
                  >
                    📊 Tariff Adjustments ({amendment.tariff_adjustments.length}
                    )
                  </div>
                  <div
                    className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {amendment.tariff_adjustments.length} tariff line(s) will be
                    adjusted
                  </div>
                </div>
              )}
          </div>

          {amendment.description && (
            <div
              className={`mt-3 p-2 rounded ${isDark ? "bg-slate-700/30" : "bg-slate-100"}`}
            >
              <div
                className={`text-[10px] font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Description
              </div>
              <div
                className={`text-xs ${isDark ? "text-slate-200" : "text-slate-800"}`}
              >
                {amendment.description}
              </div>
            </div>
          )}

          {/* Attached Files */}
          {amendment.attachment_urls &&
            amendment.attachment_urls.length > 0 && (
              <div
                className={`mt-3 p-3 rounded-lg border ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50"}`}
              >
                <div
                  className={`text-[10px] font-semibold mb-2 flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  <span>📎</span>
                  <span>
                    Attached Files ({amendment.attachment_urls.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {amendment.attachment_urls.map((url, index) => {
                    const fileName =
                      amendment.attachment_names?.[index] ||
                      `File ${index + 1}`;
                    const fileExt = fileName.split(".").pop()?.toLowerCase();
                    const fileIcon =
                      fileExt === "pdf"
                        ? "📄"
                        : fileExt === "doc" || fileExt === "docx"
                          ? "📝"
                          : fileExt === "jpg" ||
                              fileExt === "jpeg" ||
                              fileExt === "png"
                            ? "🖼️"
                            : "📎";

                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 p-2 rounded-lg transition-all hover:scale-[1.01] ${
                          isDark
                            ? "bg-slate-700/50 hover:bg-slate-700"
                            : "bg-white hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-lg">{fileIcon}</span>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-xs font-medium truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}
                          >
                            {fileName}
                          </div>
                        </div>
                        <span
                          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          ⬇️
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
        </div>

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
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
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
                {isProcessing ? "⏳ Processing..." : "✕ Confirm Rejection"}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
