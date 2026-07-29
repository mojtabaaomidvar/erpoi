import { useState, useEffect } from "react";
import { Button, Badge, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { approvalAppService } from "../application/ApprovalApplicationService";
import { formatJalaliDate } from "@/shared/utils/dateUtils";
import type { PendingApproval } from "../domain/types";

type TabType = "PENDING" | "APPROVED" | "REJECTED";

export function ApprovalDashboard() {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("PENDING");
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  });

  // State های مودال تایید
  const [editingApproval, setEditingApproval] =
    useState<PendingApproval | null>(null);
  const [finalValue, setFinalValue] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // State های رد کردن
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadAllData = async () => {
    setLoading(true);
    try {
      const allData = await approvalAppService.getAllHistory();

      // محاسبه تعداد برای هر تب
      setCounts({
        PENDING: allData.filter((a) => a.status === "PENDING").length,
        APPROVED: allData.filter((a) => a.status === "APPROVED").length,
        REJECTED: allData.filter((a) => a.status === "REJECTED").length,
      });

      // فیلتر بر اساس تب فعال
      setApprovals(allData.filter((a) => a.status === activeTab));
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadAllData();
    }
  }, [activeTab]);

  const openApproveModal = (approval: PendingApproval) => {
    setEditingApproval(approval);
    setFinalValue(approval.proposed_value || "");
  };

  const handleConfirmApprove = async () => {
    if (!editingApproval) return;
    const safeValue = (finalValue || "").trim();
    if (!safeValue) {
      showToast("error", "Validation Error", "Approved value cannot be empty");
      return;
    }

    setIsApproving(true);
    try {
      await approvalAppService.approve(
        editingApproval.id,
        user?.id || "",
        safeValue,
      );
      showToast("success", "Approved", "Value has been added to master data");
      setEditingApproval(null);
      setFinalValue("");
      await loadAllData();
    } catch (err: any) {
      showToast("error", "Approval Failed", err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!rejectionReason.trim()) {
      showToast(
        "error",
        "Reason Required",
        "Please provide a rejection reason",
      );
      return;
    }
    try {
      await approvalAppService.reject(
        approvalId,
        user?.id || "",
        rejectionReason,
      );
      showToast("success", "Rejected", "Request has been rejected");
      setRejectingId(null);
      setRejectionReason("");
      await loadAllData();
    } catch (err: any) {
      showToast("error", "Rejection Failed", err.message);
    }
  };

  const tabs: { key: TabType; label: string; icon: string; color: string }[] = [
    { key: "PENDING", label: "Pending", icon: "⏳", color: "amber" },
    { key: "APPROVED", label: "Approved", icon: "✅", color: "emerald" },
    { key: "REJECTED", label: "Rejected", icon: "❌", color: "rose" },
  ];

  return (
    <div className="space-y-4">
      {/* Header با تب‌ها */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2
          className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          📋 Master Data Approvals
        </h2>
        <div
          className={`flex gap-1 p-1 rounded-xl ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? tab.color === "amber"
                    ? "bg-amber-500 text-white shadow-md"
                    : tab.color === "emerald"
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-rose-500 text-white shadow-md"
                  : isDark
                    ? "text-slate-400 hover:bg-slate-700"
                    : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : isDark
                      ? "bg-slate-700 text-slate-400"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* محتوا */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-2xl animate-spin">⏳</div>
        </div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">
            {activeTab === "PENDING"
              ? "✅"
              : activeTab === "APPROVED"
                ? "📭"
                : "📭"}
          </div>
          <p className="text-sm text-slate-500">
            No {activeTab.toLowerCase()} approvals
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className={`p-4 rounded-xl border ${
                approval.status === "APPROVED"
                  ? isDark
                    ? "bg-emerald-900/10 border-emerald-800/30"
                    : "bg-emerald-50/50 border-emerald-200"
                  : approval.status === "REJECTED"
                    ? isDark
                      ? "bg-rose-900/10 border-rose-800/30"
                      : "bg-rose-50/50 border-rose-200"
                    : isDark
                      ? "bg-slate-800/50 border-slate-700"
                      : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge tone="amber" className="text-[9px]">
                      {approval.field_type}
                    </Badge>
                    <Badge
                      tone={
                        approval.status === "APPROVED"
                          ? "emerald"
                          : approval.status === "REJECTED"
                            ? "danger"
                            : "amber"
                      }
                      className="text-[9px]"
                    >
                      {approval.status}
                    </Badge>
                    <span className="text-[10px] text-slate-500">
                      📅 {formatJalaliDate(approval.requested_at)}
                    </span>
                  </div>
                  <h3
                    className={`text-sm font-bold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    📝{" "}
                    {approval.status === "APPROVED"
                      ? approval.final_value || approval.proposed_value
                      : approval.proposed_value}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    👤 Requested by: {approval.requested_by}
                  </p>

                  {/* ✅ نمایش تاریخچه تایید */}
                  {approval.status === "APPROVED" && (
                    <div
                      className={`mt-3 p-2.5 rounded-lg text-[11px] ${isDark ? "bg-emerald-900/20 border border-emerald-800/30" : "bg-emerald-50 border border-emerald-200"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>✅</span>
                        <span
                          className={`font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                        >
                          Approved Value:
                        </span>
                        <span
                          className={`font-medium ${isDark ? "text-emerald-200" : "text-emerald-900"}`}
                        >
                          {approval.final_value || approval.proposed_value}
                        </span>
                      </div>

                      {/* ✅ فقط نمایش داده شود اگر مدیر مقدار را ویرایش کرده باشد */}
                      {approval.final_value &&
                        approval.final_value !== approval.proposed_value && (
                          <div
                            className={`text-[10px] mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                          >
                            ✏️ Original request was: "{approval.proposed_value}"
                          </div>
                        )}

                      <div
                        className={`text-[10px] mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                      >
                        🕐 Approved on:{" "}
                        {formatJalaliDate(approval.reviewed_at || "")}
                        {approval.reviewed_by && ` by ${approval.reviewed_by}`}
                      </div>
                    </div>
                  )}

                  {/* ✅ نمایش تاریخچه رد */}
                  {approval.status === "REJECTED" && (
                    <div
                      className={`mt-3 p-2.5 rounded-lg text-[11px] ${isDark ? "bg-rose-900/20 border border-rose-800/30" : "bg-rose-50 border border-rose-200"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>❌</span>
                        <span
                          className={`font-semibold ${isDark ? "text-rose-300" : "text-rose-700"}`}
                        >
                          Rejected
                        </span>
                      </div>
                      {approval.rejection_reason && (
                        <div
                          className={`text-[10px] mt-1 ${isDark ? "text-rose-300" : "text-rose-700"}`}
                        >
                          💬 Reason: {approval.rejection_reason}
                        </div>
                      )}
                      <div
                        className={`text-[10px] mt-1 ${isDark ? "text-rose-400" : "text-rose-600"}`}
                      >
                        🕐 Rejected on:{" "}
                        {formatJalaliDate(approval.reviewed_at || "")}
                        {approval.reviewed_by && ` by ${approval.reviewed_by}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* دکمه‌های عملیات فقط برای تب PENDING */}
              {approval.status === "PENDING" && (
                <>
                  {rejectingId === approval.id ? (
                    <div className="space-y-2 mt-3">
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(approval.id)}
                        >
                          Confirm Rejection
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openApproveModal(approval)}
                      >
                        ✓ Review & Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRejectingId(approval.id)}
                      >
                        ✕ Reject
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* مودال ویرایش و تایید */}
      {editingApproval && (
        <Modal
          isOpen={!!editingApproval}
          onClose={() => setEditingApproval(null)}
          title="Review & Approve Value"
          size="md"
        >
          <div className="space-y-4 p-2">
            <div
              className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-50"}`}
            >
              <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">
                Original Request
              </p>
              <p className="text-sm font-medium">
                {editingApproval.proposed_value}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Category: {editingApproval.field_type}
              </p>
              <p className="text-[10px] text-slate-400">
                Requested on: {formatJalaliDate(editingApproval.requested_at)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Final Approved Value (Editable)
              </label>
              <input
                type="text"
                value={finalValue}
                onChange={(e) => setFinalValue(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm input-themed border-indigo-500 focus:ring-indigo-500"
                placeholder="Edit value if necessary before approving..."
              />
              <p className="text-[10px] text-slate-500 mt-1">
                💡 This is the exact value that will be saved to the system and
                available for all users.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingApproval(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmApprove}
                disabled={isApproving || !finalValue.trim()}
              >
                {isApproving ? "⏳ Approving..." : "✅ Confirm & Add to System"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
