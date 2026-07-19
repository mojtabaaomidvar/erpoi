// src/features/inspection-management/ui/InspectionDetailsModal.tsx

import { useState } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import type { InspectionRequest } from "@/types/inspection";
import { INSPECTION_STATUS_CONFIG, PRIORITY_CONFIG } from "../constants";

// Import Components
import { DocumentReviewSection } from "./details/DocumentReviewSection";
import { InspectorAssignmentSection } from "./details/InspectorAssignmentSection";
import { ChecklistSection } from "./details/ChecklistSection";
import { NCRSection } from "./details/NCRSection";
import { ReportSection } from "./details/ReportSection";

interface InspectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionRequest: InspectionRequest | null;
  onEdit: (request: InspectionRequest) => void;
  onDelete: (request: InspectionRequest) => void;
  canEdit: boolean;
  canDelete: boolean;
}

type TabType =
  | "overview"
  | "documents"
  | "inspector"
  | "checklists"
  | "ncr"
  | "reports";

export function InspectionDetailsModal({
  isOpen,
  onClose,
  inspectionRequest,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: InspectionDetailsModalProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  if (!inspectionRequest) return null;

  const statusConfig = INSPECTION_STATUS_CONFIG[inspectionRequest.status];
  const priorityConfig = PRIORITY_CONFIG[inspectionRequest.priority];

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "inspector", label: "Inspector", icon: "👷" },
    { id: "checklists", label: "Checklists", icon: "✅" },
    { id: "ncr", label: "NCR", icon: "⚠️" },
    { id: "reports", label: "Reports", icon: "📊" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inspection Request Details"
      size="xl"
    >
      <div className="flex flex-col" style={{ height: "calc(90vh - 120px)" }}>
        {/* Header Info */}
        <div
          className={`flex-shrink-0 px-6 py-4 border-b ${
            isDark
              ? "border-slate-700 bg-slate-900/50"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {inspectionRequest.id}
                </span>
                <Badge tone={statusConfig.color as any} className="text-[10px]">
                  {statusConfig.icon} {statusConfig.label}
                </Badge>
                <Badge
                  tone={priorityConfig.color as any}
                  className="text-[10px]"
                >
                  {priorityConfig.icon} {priorityConfig.label}
                </Badge>
              </div>
              <h2
                className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {inspectionRequest.inspection_scope}
              </h2>
              <p
                className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                📅 Notification Date:{" "}
                {new Date(
                  inspectionRequest.inspection_date,
                ).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(inspectionRequest)}
                >
                  ✏️ Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    const confirmed = await confirmDialog({
                      title: "Delete Request",
                      message: "Are you sure?",
                      confirmText: "Delete",
                      cancelText: "Cancel",
                      variant: "danger",
                    });
                    if (confirmed) onDelete(inspectionRequest);
                  }}
                >
                  🗑️ Delete
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? isDark
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-indigo-500 text-white shadow-md"
                    : isDark
                      ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
              >
                <h3
                  className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  Request Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div
                      className={`text-[10px] font-semibold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Client ID
                    </div>
                    <div
                      className={`text-sm font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}
                    >
                      {inspectionRequest.client_id}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-[10px] font-semibold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Contract ID
                    </div>
                    <div
                      className={`text-sm font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}
                    >
                      {inspectionRequest.contract_id}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-[10px] font-semibold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Priority
                    </div>
                    <Badge
                      tone={priorityConfig.color as any}
                      className="text-xs"
                    >
                      {priorityConfig.icon} {priorityConfig.label}
                    </Badge>
                  </div>
                  <div>
                    <div
                      className={`text-[10px] font-semibold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Status
                    </div>
                    <Badge tone={statusConfig.color as any} className="text-xs">
                      {statusConfig.icon} {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
              >
                <h3
                  className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  🔍 Inspection Scope
                </h3>
                <p
                  className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {inspectionRequest.inspection_scope}
                </p>
              </div>

              {inspectionRequest.notes && (
                <div
                  className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                >
                  <h3
                    className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    📝 Notes
                  </h3>
                  <p
                    className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {inspectionRequest.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <DocumentReviewSection requestId={inspectionRequest.id} />
          )}

          {activeTab === "inspector" && (
            <InspectorAssignmentSection requestId={inspectionRequest.id} />
          )}

          {activeTab === "checklists" && (
            <ChecklistSection requestId={inspectionRequest.id} />
          )}

          {activeTab === "ncr" && (
            <NCRSection requestId={inspectionRequest.id} />
          )}

          {activeTab === "reports" && (
            <ReportSection requestId={inspectionRequest.id} />
          )}
        </div>
      </div>
    </Modal>
  );
}
