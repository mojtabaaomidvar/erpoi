// src/features/tpi-management/ui/TPIDetailsModal.tsx

import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { TPIElements } from "@shared/authorization/ui/elements/TPIElements";
import {
  tpiRequestAppService,
  type TPIRequestDetailsDTO,
} from "../application";
import {
  INSPECTION_STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/features/inspection-management/constants";
import { formatJalaliDate } from "@/shared/utils/dateUtils";
import type { TPIRequest } from "../domain/types";
import { ResidentDashboard } from "./ResidentDashboard";
import { DocumentReviewSection } from "@/features/inspection-management/ui/details/DocumentReviewSection";
import { InspectorAssignmentSection } from "@/features/inspection-management/ui/details/InspectorAssignmentSection";
import { ChecklistSection } from "@/features/inspection-management/ui/details/ChecklistSection";
import { showToast } from "@/shared/ui/ToastContainer";

interface TPIDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: TPIRequest | null;
  onEdit: (request: TPIRequest) => void;
  onDelete: (request: TPIRequest) => void;
}

const formatArrayField = (value: any): string => {
  if (!value) return "—";

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "—";
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.length > 0 ? parsed.join(", ") : "—";
      }
      return parsed;
    } catch {
      return value;
    }
  }

  return String(value);
};

type TabType =
  | "overview"
  | "documents"
  | "inspector"
  | "checklist" // ✅ اصلاح شد: حذف s اضافی برای هماهنگی با شرط رندر
  | "ncr"
  | "reports"
  | "release_note"
  | "resident";

export function TPIDetailsModal({
  isOpen,
  onClose,
  request,
  onEdit,
  onDelete,
}: TPIDetailsModalProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { canAccessElement } = usePermissionMapping();

  const [details, setDetails] = useState<TPIRequestDetailsDTO | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const canEdit = canAccessElement(TPIElements.TPIDetails.btn_edit.id);
  const canDelete = canAccessElement(TPIElements.TPIDetails.btn_delete.id);

  const fetchDetails = async () => {
    if (!request) return;
    setLoadingDetails(true);
    setDetails(null);
    try {
      const detailsData = await tpiRequestAppService.getTPIRequestDetails(
        request.id,
      );
      setDetails(detailsData);
    } catch (err: any) {
      console.error("Failed to fetch details:", err);
      showToast(
        "error",
        "Load Failed",
        err.message || "Could not load request details",
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (isOpen && request) {
      setActiveTab("overview");
      fetchDetails();
    }
  }, [isOpen, request?.id]);

  const handleItemSelection = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!details?.items) return;
    if (selectedItems.size === details.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(details.items.map((item) => item.id)));
    }
  }, [details?.items, selectedItems.size]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [details]);

  if (!request) return null;

  const firstStage =
    Array.isArray(request.stages) && request.stages.length > 0
      ? request.stages[0]
      : "No Stage";

  const displayTitle = details
    ? `${details.clientName} - ${details.projectName} - ${details.vendorName || "No Vendor"} - ${firstStage}`
    : "Loading details...";

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "inspector", label: "Inspector", icon: "👷" },
    { id: "checklist", label: "Checklists", icon: "✅" }, // ✅ اصلاح شد: "checklist"
    { id: "ncr", label: "NCR", icon: "⚠️" },
    { id: "reports", label: "Reports", icon: "📊" },
    { id: "release_note", label: "Release Note", icon: "🏷️" },
    { id: "resident", label: "Resident", icon: "🏢" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="TPI Request Details"
      size="xl"
    >
      <div className="flex flex-col" style={{ height: "calc(90vh - 120px)" }}>
        {/* Header Info */}
        <div
          className={`flex-shrink-0 px-6 py-4 border-b ${isDark ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}
        >
          <div className="flex items-start justify-between mb-3">
            {loadingDetails ? (
              <div className="flex-1 space-y-3 animate-pulse">
                <div className="flex gap-2">
                  <div
                    className={`h-5 w-20 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                  />
                  <div
                    className={`h-5 w-16 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                  />
                </div>
                <div
                  className={`h-6 w-3/4 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
                <div
                  className={`h-4 w-1/2 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge
                    tone={
                      (INSPECTION_STATUS_CONFIG as any)[request.status]
                        ?.color || "slate"
                    }
                    className="text-[10px]"
                  >
                    {(INSPECTION_STATUS_CONFIG as any)[request.status]?.icon ||
                      "❓"}{" "}
                    {(INSPECTION_STATUS_CONFIG as any)[request.status]
                      ?.labelFa || request.status}
                  </Badge>
                  <Badge
                    tone={
                      (PRIORITY_CONFIG as any)[request.priority]?.color ||
                      "slate"
                    }
                    className="text-[10px]"
                  >
                    {(PRIORITY_CONFIG as any)[request.priority]?.icon || "➡️"}{" "}
                    {(PRIORITY_CONFIG as any)[request.priority]?.label ||
                      request.priority}
                  </Badge>
                </div>

                <h2
                  className={`text-lg font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  title={displayTitle}
                >
                  {displayTitle}
                </h2>
                <p
                  className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  📅 Planned Date: {formatJalaliDate(request.inspection_date)}
                </p>
              </div>
            )}

            <div className="flex gap-2 shrink-0">
              {canEdit && !loadingDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(request)}
                >
                  ✏️ Edit
                </Button>
              )}
              {canDelete && !loadingDetails && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    const confirmed = await confirmDialog({
                      title: "Delete TPI Request",
                      message:
                        "Are you sure you want to delete this request? This action cannot be undone.",
                      confirmText: "Delete",
                      cancelText: "Cancel",
                      variant: "danger",
                    });
                    if (confirmed) onDelete(request);
                  }}
                >
                  🗑️ Delete
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
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
          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-3xl animate-spin mb-3">⏳</div>
              <p className="text-sm text-slate-500">
                Loading request details...
              </p>
            </div>
          ) : (
            <>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div
                          className={`text-[10px] font-semibold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          Service Domain
                        </div>
                        <div
                          className={`font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}
                        >
                          {Array.isArray(request.disciplines)
                            ? request.disciplines.join(", ")
                            : request.disciplines || "—"}
                        </div>
                      </div>
                      <div>
                        <div
                          className={`text-[10px] font-semibold uppercase ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {request.tpi_mode === "SPOT"
                            ? "Vendor"
                            : "Site Representative"}
                        </div>
                        <div
                          className={`font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}
                        >
                          {request.tpi_mode === "SPOT"
                            ? details?.vendorName || "Not assigned"
                            : "Not assigned"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {details?.items && details.items.length > 0 && (
                    <div
                      className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3
                          className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                        >
                          📦 Inspection Items ({details.items.length})
                        </h3>
                        {selectedItems.size > 0 && (
                          <span
                            className={`text-xs px-2 py-1 rounded ${isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}
                          >
                            {selectedItems.size} selected
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr
                              className={`border-b ${isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-600"}`}
                            >
                              <th className="text-left py-2 px-2 font-semibold">
                                #
                              </th>
                              <th className="text-left py-2 px-2 font-semibold">
                                Item Name & Description
                              </th>
                              <th className="text-left py-2 px-2 font-semibold">
                                Tag No.
                              </th>
                              <th className="text-left py-2 px-2 font-semibold">
                                Manufacturer
                              </th>
                              <th className="text-center py-2 px-2 font-semibold">
                                Qty
                              </th>
                              <th className="text-center py-2 px-2 font-semibold">
                                Unit
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.items.map((item, index) => {
                              const isSelected = selectedItems.has(item.id);
                              return (
                                <tr
                                  key={item.id}
                                  className={`border-b last:border-0 transition-colors ${
                                    isSelected
                                      ? isDark
                                        ? "bg-indigo-900/20 border-slate-700/50"
                                        : "bg-indigo-50/50 border-slate-100"
                                      : isDark
                                        ? "border-slate-700/50 hover:bg-slate-700/30"
                                        : "border-slate-100 hover:bg-slate-50"
                                  }`}
                                >
                                  <td className="py-3 px-2 text-slate-500">
                                    {index + 1}
                                  </td>
                                  <td className="py-3 px-2">
                                    <div
                                      className={`font-medium mb-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}
                                    >
                                      {item.item_name}
                                    </div>
                                    {item.description && (
                                      <div
                                        className={`text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                      >
                                        {item.description}
                                      </div>
                                    )}
                                  </td>
                                  <td
                                    className={`py-3 px-2 font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                  >
                                    {item.tag_number || "—"}
                                  </td>
                                  <td className="py-3 px-2">
                                    {item.manufacturer || "—"}
                                  </td>
                                  <td className="py-3 px-2 text-center font-semibold">
                                    {item.quantity}
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                                    >
                                      {item.unit}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {details?.sourceFiles && details.sourceFiles.length > 0 && (
                    <div
                      className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                    >
                      <h3
                        className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        📎 Packing List, MTO, ...
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {details.sourceFiles.map((file) => (
                          <a
                            key={file.id}
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className={`group flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02] ${
                              isDark
                                ? "bg-slate-700/50 border-slate-600 hover:border-indigo-500"
                                : "bg-slate-50 border-slate-200 hover:border-indigo-400 hover:shadow-sm"
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${isDark ? "bg-slate-600" : "bg-white border border-slate-200"}`}
                            >
                              {file.file_type === "PACKING_LIST"
                                ? "📦"
                                : file.file_type === "MTO"
                                  ? "📋"
                                  : "📄"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                              >
                                {file.file_name}
                              </p>
                              <p
                                className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                              >
                                {file.file_type.replace("_", " ")} •{" "}
                                {((file.file_size || 0) / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              ⬇️
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!details?.items || details.items.length === 0) &&
                    (!details?.sourceFiles ||
                      details.sourceFiles.length === 0) && (
                      <div
                        className={`p-8 rounded-xl border text-center ${isDark ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div className="text-3xl mb-2">📭</div>
                        <p
                          className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          No items or source files attached
                        </p>
                      </div>
                    )}

                  {request.notes && (
                    <div
                      className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                    >
                      <h3
                        className={`text-sm font-bold mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        📝 Notes
                      </h3>
                      <p
                        className={`text-sm whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {request.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "resident" &&
                (request.tpi_mode === "RESIDENT" ? (
                  <ResidentDashboard tpiRequestId={request.id} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-5xl mb-3">📍</div>
                    <p
                      className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Spot Inspection Mode
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
                    >
                      Resident dashboard is only available for Resident mode
                      inspections
                    </p>
                  </div>
                ))}

              {activeTab === "documents" && (
                <DocumentReviewSection
                  requestId={request.id}
                  category={request.category}
                />
              )}

              {activeTab === "inspector" && (
                <InspectorAssignmentSection
                  requestId={request.id}
                  serviceDomain={request.disciplines}
                  plannedDate={request.inspection_date}
                  mode={request.tpi_mode || "SPOT"}
                  category="TPI"
                />
              )}

              {/* ✅ اصلاح شده: نگاشت صحیح فیلدها بر اساس اسکیمای جدید */}
              {activeTab === "checklist" && request && (
                <ChecklistSection
                  equipmentId={
                    request.equipment_type_id ||
                    (request.item_types && request.item_types.length > 0
                      ? request.item_types[0]
                      : "GENERIC_ITEM")
                  }
                  inspectionStages={request.stages || []}
                  inspectionMethods={
                    request.methods && request.methods.length > 0
                      ? request.methods[0]
                      : undefined
                  }
                />
              )}

              {(activeTab === "ncr" ||
                activeTab === "reports" ||
                activeTab === "release_note") && (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="text-4xl mb-3">🚧</div>
                  <p
                    className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Module Under Development
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
