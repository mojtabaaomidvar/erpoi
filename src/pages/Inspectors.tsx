// src/pages/Inspectors.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { InspectorElements } from "@shared/authorization/ui/elements/InspectorElements";
import { useAuth } from "@features/auth/hooks/useAuth";
import { inspectorAppService } from "@/features/inspector-managment/application";
import { InspectorList } from "@/features/inspector-managment/ui/InspectorList";
import { tpiRequestAppService } from "@/features/tpi-management/application/TPIRequestApplicationService";
import { TPIDetailsModal } from "@/features/tpi-management/ui/TPIDetailsModal";
// import { MWSDetailsModal } from "@/features/mws-management/ui/MWSDetailsModal";
import { InspectorAddForm } from "@/features/inspector-managment/ui/InspectorAddForm";
import { InspectorDetailsModal } from "@/features/inspector-managment/ui/InspectorDetailsModal";
import { useInspectors } from "@/features/inspector-managment/hooks/useInspectors";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { showToast } from "@shared/ui/ToastContainer";
import type { Inspector } from "@/features/inspector-managment/domain";
import { inspectionAppService } from "@/features/inspection-management/application";
import type { Inspection } from "@/features/inspection-management/domain/types";

export function Inspectors() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  const [selectedInspectionRequest, setSelectedInspectionRequest] =
    useState<any>(null);

  const handleInspectionClick = async (inspection: Inspection) => {
    try {
      const requestDetails = await tpiRequestAppService.getById(
        inspection.inspection_request_id,
      );

      if (requestDetails) {
        setSelectedInspectionRequest(requestDetails);
        setIsInspectionModalOpen(true);
      } else {
        showToast("error", "Not Found", "Could not load inspection details.");
      }
    } catch (err: any) {
      console.error("Failed to load inspection details:", err);
      showToast("error", "Error", "Failed to load inspection details.");
    }
  };

  const [upcomingAssignments, setUpcomingAssignments] = useState<
    Record<string, Inspection[]>
  >({});

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const allInspections = await inspectionAppService.getAll();

        const grouped = allInspections.reduce<Record<string, Inspection[]>>(
          (acc, curr) => {
            if (curr.status === "SCHEDULED" && curr.execution_date) {
              if (!acc[curr.inspector_id]) acc[curr.inspector_id] = [];
              acc[curr.inspector_id].push(curr);
            }
            return acc;
          },
          {},
        );

        setUpcomingAssignments(grouped);
      } catch (err) {
        console.error("Failed to load upcoming assignments:", err);
      }
    };
    loadAssignments();
  }, []);

  const {
    inspectors,
    loading,
    refresh,
    searchQuery,
    setSearchQuery,
    selectedInspector,
    setSelectedInspector,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filteredInspectors,
    stats,
  } = useInspectors();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInspector, setEditingInspector] = useState<Inspector | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // 🔐 دسترسی‌ها با استفاده از Registry
  const canViewItems = canAccessElement(
    InspectorElements.InspectorList.list_view.id,
  );
  const canClickItem = canAccessElement(
    InspectorElements.InspectorList.list_item_click.id,
  );
  const canEdit = canAccessElement(InspectorElements.InspectorList.btn_edit.id);
  const canDelete = canAccessElement(
    InspectorElements.InspectorList.btn_delete.id,
  );

  const handleSaveInspector = async (formData: any, isEdit: boolean) => {
    try {
      let savedInspector: Inspector;

      if (isEdit && editingInspector) {
        if (editingInspector.resume_url && formData.resumeFile) {
          await inspectorAppService.deleteResume(editingInspector.resume_url);
        }
        const { resumeFile, ...inspectorData } = formData;
        savedInspector = await inspectorAppService.update(
          editingInspector.id,
          inspectorData,
        );
      } else {
        const { resumeFile, ...inspectorData } = formData;
        savedInspector = await inspectorAppService.create(inspectorData);
      }

      setEditingInspector(null);
      setIsAddModalOpen(false);
      await refresh();
      showToast("success", "Saved", "Inspector saved successfully!");

      if (formData.resumeFile && savedInspector) {
        inspectorAppService
          .uploadResume(
            formData.resumeFile,
            savedInspector.id,
            formData.resume_name,
          )
          .then(
            async (uploadResult: {
              url: string;
              name: string;
              size: number;
              uploadedAt: string;
            }) => {
              await inspectorAppService.update(savedInspector.id, {
                resume_name: uploadResult.name,
                resume_url: uploadResult.url,
                resume_size: uploadResult.size,
                resume_uploaded_at: uploadResult.uploadedAt,
              });
              await refresh();
            },
          )
          .catch(() => {
            showToast(
              "warning",
              "Upload Notice",
              "Inspector saved, but resume upload failed. You can edit it later.",
            );
          });
      }
    } catch (err: any) {
      showToast(
        "error",
        "Save Failed",
        err.message || "Failed to save inspector",
      );
    }
  };

  const handleInspectorClick = (inspector: Inspector) => {
    if (!canClickItem) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to view inspector details",
      );
      return;
    }
    setSelectedInspector(inspector);
    setIsDetailsOpen(true);
  };

  const handleEditFromDetails = (inspector: Inspector) => {
    if (!canEdit) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to edit inspectors",
      );
      return;
    }
    setEditingInspector(inspector);
    setIsDetailsOpen(false);
    setIsAddModalOpen(true);
  };

  const handleDeleteInspector = async (inspector: Inspector) => {
    if (!canDelete) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to delete inspectors",
      );
      return;
    }

    const confirmed = await confirmDialog({
      title: "Delete Inspector",
      message: `Are you sure you want to permanently delete "${inspector.name_en}"?\n\nThis action will also delete their associated resume from the server and cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsDetailsOpen(false);
    setSelectedInspector(null);

    showToast("success", "Deleted", `${inspector.name_en} has been removed`);

    try {
      await inspectorAppService.delete(inspector.id);
      await refresh();
    } catch (err: any) {
      showToast(
        "error",
        "Delete Failed",
        err.message || "Failed to delete inspector",
      );
      await refresh();
    }
  };

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
            You do not have permission to view the inspector module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <InspectorList
        inspectors={inspectors}
        filteredInspectors={filteredInspectors}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onInspectorClick={handleInspectorClick}
        onAddClick={() => {
          setEditingInspector(null);
          setIsAddModalOpen(true);
        }}
        loading={loading}
        upcomingAssignments={upcomingAssignments}
        onInspectionClick={handleInspectionClick}
      />

      {/* مودال جزئیات */}
      <InspectorDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedInspector(null);
        }}
        inspector={selectedInspector}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteInspector}
      />

      {/* مودال افزودن/ویرایش */}
      <InspectorAddForm
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingInspector(null);
        }}
        onSave={handleSaveInspector}
        initialData={editingInspector}
        isAdmin={isAdmin}
      />

      {isInspectionModalOpen && selectedInspectionRequest && (
        <>
          <TPIDetailsModal
            isOpen={isInspectionModalOpen}
            onClose={() => {
              setIsInspectionModalOpen(false);
              setSelectedInspectionRequest(null);
            }}
            request={selectedInspectionRequest}
            onEdit={(req) => {
              setIsInspectionModalOpen(false);
              showToast("info", "Edit", "Edit functionality coming soon");
            }}
            onDelete={async (req) => {
              setIsInspectionModalOpen(false);
              await refresh();
            }}
          />

          {/* {/* ✅ در آینده وقتی ماژول MWS آماده شد، فقط این شرط را اضافه می‌کنید: 
          {selectedInspectionRequest.category === "MWS" && (
            <MWSDetailsModal
              isOpen={isInspectionModalOpen}
              onClose={() => { setIsInspectionModalOpen(false); setSelectedInspectionRequest(null); }}
              request={selectedInspectionRequest}
              // ...
            />
          )} 
          */}
        </>
      )}
    </>
  );
}
