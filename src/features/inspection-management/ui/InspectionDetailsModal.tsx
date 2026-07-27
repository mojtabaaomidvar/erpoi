// src/features/inspection-management/ui/InspectionDetailsModal.tsx

import { useState, useEffect } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
// ❌ حذف ایمپورت مستقیم سوپابیس
// import { supabase } from "@shared/database/supabase";
import { projectAppService } from "@/features/project-management";
import { vendorAppService } from "@/features/tpi-management/application/VendorApplicationService";
import { tpiRequestAppService } from "@/features/tpi-management/application/TPIRequestApplicationService"; // ✅ اضافه شده
import type { TPIRequest } from "@/features/tpi-management";
import type {
  InspectionItem,
  SourceFile,
} from "@/features/tpi-management/domain/types";
import { INSPECTION_STATUS_CONFIG, PRIORITY_CONFIG } from "../constants";
import { InspectionElements } from "@shared/authorization/ui/elements/InspectionElements";
import { usePermissionMapping } from "@/shared/authorization";

import { DocumentReviewSection } from "./details/DocumentReviewSection";
import { InspectorAssignmentSection } from "./details/InspectorAssignmentSection";

interface InspectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionRequest: TPIRequest | null;
  onEdit: (request: TPIRequest) => void;
  onDelete: (request: TPIRequest) => void;
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
}: InspectionDetailsModalProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const [items, setItems] = useState<InspectionItem[]>([]);
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [projectName, setProjectName] = useState("Unknown Project");
  const [vendorName, setVendorName] = useState("No Vendor");
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { canAccessElement } = usePermissionMapping();
  const canEdit = canAccessElement(
    InspectionElements.InspectionDetails.btn_edit.id,
  );
  const canDelete = canAccessElement(
    InspectionElements.InspectionDetails.btn_delete.id,
  );

  // ✅ دریافت جزییات فقط از طریق Application Service
  const fetchDetails = async () => {
    if (!inspectionRequest) return;
    setLoadingDetails(true);
    try {
      // دریافت نام پروژه
      if (inspectionRequest.project_id) {
        const project = await projectAppService.getProjectById(
          inspectionRequest.project_id,
        );
        if (project) setProjectName(project.name);
      }

      // دریافت نام وندور
      if (inspectionRequest.vendor_id) {
        const vendors = await vendorAppService.getAll();
        const vendor = vendors.find(
          (v) => v.id === inspectionRequest.vendor_id,
        );
        if (vendor) setVendorName(vendor.name);
      }

      // ✅ دریافت آیتم‌ها و فایل‌ها از طریق Service (بدون دسترسی مستقیم به supabase)
      const [itemsData, filesData] = await Promise.all([
        tpiRequestAppService.getInspectionItems(inspectionRequest.id),
        tpiRequestAppService.getSourceFiles(inspectionRequest.id),
      ]);

      setItems(itemsData || []);
      setSourceFiles(filesData || []);
    } catch (err) {
      console.error("Failed to fetch details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (isOpen && inspectionRequest) {
      setActiveTab("overview");
      fetchDetails();
    }
  }, [isOpen, inspectionRequest?.id]);

  if (!inspectionRequest) return null;

  const statusConfig =
    INSPECTION_STATUS_CONFIG[inspectionRequest.status] ||
    INSPECTION_STATUS_CONFIG.NEW;
  const priorityConfig =
    PRIORITY_CONFIG[inspectionRequest.priority] || PRIORITY_CONFIG.NORMAL;

  const firstStage =
    Array.isArray(inspectionRequest.stages) &&
    inspectionRequest.stages.length > 0
      ? inspectionRequest.stages[0]
      : "No Stage";

  const displayTitle = `${projectName} - ${vendorName} - ${firstStage}`;

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "inspector", label: "Inspector", icon: "👷" },
    { id: "checklists", label: "Checklists", icon: "✅" },
    { id: "ncr", label: "NCR", icon: "⚠️" },
    { id: "reports", label: "Reports", icon: "📊" },
  ];

  const formatJalaliDate = (dateString: string): string => {
    if (!dateString) return "—";
    const jalaliRegex = /^\d{4}[/\-]\d{1,2}[/\-]\d{1,2}$/;
    if (jalaliRegex.test(dateString)) {
      return dateString.replace(/-/g, "/");
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const jalaliDate = date.toLocaleDateString("en-US-u-ca-persian-nu-latn", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = jalaliDate.split("/");
      return parts.length === 3
        ? `${parts[2]}/${parts[0]}/${parts[1]}`
        : jalaliDate;
    } catch {
      return dateString;
    }
  };

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
          className={`flex-shrink-0 px-6 py-4 border-b ${isDark ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  #{inspectionRequest.id.split("_").pop()}
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
                className={`text-lg font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                title={displayTitle}
              >
                {displayTitle}
              </h2>
              <p
                className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                📅 Inspection Date:{" "}
                {formatJalaliDate(inspectionRequest.inspection_date)}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
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
                      message: "Are you sure you want to delete this request?",
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
            <div className="flex flex-col items-center justify-center h-40">
              <div className="text-2xl animate-spin mb-2">⏳</div>
              <p className="text-xs text-slate-500">Loading details...</p>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* بخش فایل‌های منبع (Source Files) */}
                  {sourceFiles.length > 0 && (
                    <div
                      className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                    >
                      <h3
                        className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        📎 Source Files & Documents
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sourceFiles.map((file) => (
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

                  {/* بخش آیتم‌های بازرسی (Inspection Items) */}
                  {items.length > 0 && (
                    <div
                      className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                    >
                      <h3
                        className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        📦 Inspection Items ({items.length})
                      </h3>
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
                                Item Name
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
                            {items.map((item, index) => (
                              <tr
                                key={item.id}
                                className={`border-b last:border-0 ${isDark ? "border-slate-700/50 hover:bg-slate-700/30" : "border-slate-100 hover:bg-slate-50"}`}
                              >
                                <td className="py-2.5 px-2 text-slate-500">
                                  {index + 1}
                                </td>
                                <td className="py-2.5 px-2 font-medium">
                                  {item.item_name}
                                  {item.description && (
                                    <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                                      {item.description}
                                    </p>
                                  )}
                                </td>
                                <td className="py-2.5 px-2 font-mono text-slate-600 dark:text-slate-400">
                                  {item.tag_number || "—"}
                                </td>
                                <td className="py-2.5 px-2">
                                  {item.manufacturer || "—"}
                                </td>
                                <td className="py-2.5 px-2 text-center font-semibold">
                                  {item.quantity}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                                  >
                                    {item.unit}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* اگر هیچ آیتم یا فایلی نبود */}
                  {items.length === 0 && sourceFiles.length === 0 && (
                    <div
                      className={`p-8 rounded-xl border text-center ${isDark ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="text-3xl mb-2">📭</div>
                      <p
                        className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        No items or source files attached
                      </p>
                      <p
                        className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                      >
                        Items can be added during request creation.
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {inspectionRequest.notes && (
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
                        {inspectionRequest.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "documents" && (
                <DocumentReviewSection
                  requestId={inspectionRequest.id}
                  category={inspectionRequest.category}
                />
              )}

              {activeTab === "inspector" && (
                <InspectorAssignmentSection
                  requestId={inspectionRequest.id}
                  serviceDomain={inspectionRequest.disciplines}
                  plannedDate={inspectionRequest.inspection_date}
                  mode={inspectionRequest.tpi_mode || "SPOT"}
                />
              )}

              {(activeTab === "checklists" ||
                activeTab === "ncr" ||
                activeTab === "reports") && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <div className="text-4xl mb-3">🚧</div>
                  <h3 className="text-sm font-semibold mb-1">
                    Module Under Development
                  </h3>
                  <p className="text-xs">
                    This feature will be available soon.
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
