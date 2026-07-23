// src/pages/Inspections.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { InspectionElements } from "@shared/authorization/ui/elements/InspectionElements";
import { useAuth } from "@features/auth/hooks/useAuth";
import { inspectionRequestAppService } from "@features/inspection-management/application/InspectionRequestApplicationService";
import { InspectionList } from "@features/inspection-management/ui/InspectionList";
import { InspectionRequestForm } from "@features/inspection-management/ui/InspectionRequestForm";
import { InspectionDetailsModal } from "@features/inspection-management/ui/InspectionDetailsModal";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import type {
  InspectionRequest,
  InspectionStatus,
  Priority,
} from "@/features/inspection-management/domain/types";
import { showToast } from "@shared/ui/ToastContainer";

export function Inspections() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  // State های سطح بالا
  const [inspectionRequests, setInspectionRequests] = useState<
    InspectionRequest[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] =
    useState<InspectionRequest | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<InspectionRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [filterStatus, setFilterStatus] = useState<InspectionStatus | "ALL">(
    "ALL",
  );
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // ✅ دسترسی‌ها با استفاده از Registry (بدون رشته‌های سخت‌کد شده)
  const canViewItems = canAccessElement(
    InspectionElements.InspectionList.list_item_view.id,
  );
  const canClickItem = canAccessElement(
    InspectionElements.InspectionList.list_item_click.id,
  );
  const canEdit = canAccessElement(
    InspectionElements.InspectionDetails.btn_edit.id,
  );
  const canDelete = canAccessElement(
    InspectionElements.InspectionDetails.btn_delete.id,
  );

  // بارگذاری داده‌ها
  const loadInspectionRequests = async () => {
    setLoading(true);
    try {
      const data = await inspectionRequestAppService.getAll();
      setInspectionRequests(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspectionRequests();
  }, []);

  // Handlers
  const handleSaveRequest = async (formData: any, isEdit: boolean) => {
    try {
      if (isEdit && editingRequest) {
        await inspectionRequestAppService.update(
          editingRequest.id,
          formData,
          user?.id || "unknown",
        );
      } else {
        await inspectionRequestAppService.create(
          formData,
          user?.id || "unknown",
        );
      }

      setEditingRequest(null);
      setIsAddModalOpen(false);
      await loadInspectionRequests();
      showToast("success", "Saved", "Inspection request saved successfully!");
    } catch (err: any) {
      showToast("error", "Save Failed", err.message || "Failed to save");
    }
  };

  const handleRequestClick = (request: InspectionRequest) => {
    if (!canClickItem) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to view inspection details",
      );
      return;
    }
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleEditFromDetails = (request: InspectionRequest) => {
    if (!canEdit) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to edit inspection requests",
      );
      return;
    }
    setEditingRequest(request);
    setIsAddModalOpen(true);
  };

  const handleDeleteRequest = async (request: InspectionRequest) => {
    if (!canDelete) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to delete inspection requests",
      );
      return;
    }

    const confirmed = await confirmDialog({
      title: "Delete Inspection Request",
      message: `Are you sure you want to delete "${request.inspection_scope}"?\n\nThis action cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    // ✅ Optimistic UI: حذف فوری از لیست
    setIsDetailsOpen(false);
    setSelectedRequest(null);
    setInspectionRequests((prev) => prev.filter((r) => r.id !== request.id));
    showToast("success", "Deleted", "Inspection request has been removed");

    // ✅ Rollback در صورت خطای سرور
    await inspectionRequestAppService
      .delete(request.id, user?.id || "unknown")
      .catch((err: any) => {
        setInspectionRequests((prev) => [request, ...prev]);
        showToast("error", "Delete Failed", err.message || "Failed to delete");
      });
  };

  // بررسی دسترسی مشاهده
  if (!canViewItems) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
          >
            🔒
          </div>
          <h2
            className={`text-xl font-bold mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Access Denied
          </h2>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            You do not have permission to view the inspections module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <InspectionList
        inspectionRequests={inspectionRequests}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        onRequestClick={handleRequestClick}
        onAddClick={() => {
          setEditingRequest(null);
          setIsAddModalOpen(true);
        }}
        loading={loading}
      />

      <InspectionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRequest(null);
        }}
        inspectionRequest={selectedRequest}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteRequest}
        // ✅ حذف Propsهای دسترسی: کامپوننت Modal نیز خودش آن‌ها را مدیریت می‌کند
      />

      <InspectionRequestForm
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRequest(null);
        }}
        onSave={handleSaveRequest}
        initialData={editingRequest}
        isAdmin={isAdmin}
      />
    </>
  );
}
