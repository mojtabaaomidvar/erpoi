// src/pages/Inspections.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { InspectionElements } from "@shared/authorization/ui/elements/InspectionElements";
import { useAuth } from "@features/auth/hooks/useAuth";
import { inspectionRequestAppService } from "@features/inspection-management/application/InspectionRequestApplicationService";
import { InspectionList } from "@features/inspection-management/ui/InspectionList";
import { TPIRequestForm } from "@/features/tpi-management/ui/TPIRequestForm";
import { InspectionDetailsModal } from "@features/inspection-management/ui/InspectionDetailsModal";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import type {
  InspectionStatus,
  Priority,
} from "@/features/inspection-management/domain/types";
import type { TPIRequest } from "@/features/tpi-management/domain/types";
import { showToast } from "@shared/ui/ToastContainer";

import { tpiRequestAppService } from "@/features/tpi-management";

export function Inspections() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  const [inspectionRequests, setInspectionRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TPIRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TPIRequest | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [filterStatus, setFilterStatus] = useState<InspectionStatus | "ALL">(
    "ALL",
  );
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

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
      const data = await tpiRequestAppService.getAll();
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

  const handleRequestClick = (request: TPIRequest) => {
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

  const handleEditFromDetails = (request: TPIRequest) => {
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

  const handleDeleteRequest = async (request: TPIRequest) => {
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
      message: `Are you sure you want to delete "${request.methods}"?\n\nThis action cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsDetailsOpen(false);
    setSelectedRequest(null);
    setInspectionRequests((prev) => prev.filter((r) => r.id !== request.id));
    showToast("success", "Deleted", "Inspection request has been removed");

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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
          >
            🔒
          </div>
          <h2
            className={`text-2xl font-bold mb-2 ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Access Denied
          </h2>
          <p
            className={`text-sm mb-6 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
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
      />

      <TPIRequestForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={async () => {
          const data = await tpiRequestAppService.getAll();
          setInspectionRequests(data);
          setShowForm(false);
          setSelectedRequest(null);
        }}
        initialData={selectedRequest}
      />
    </>
  );
}
