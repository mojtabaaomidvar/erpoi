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
        inspection.tpi_request_id,
      );

      if (requestDetails) {
        setSelectedInspectionRequest(requestDetails);
        setIsInspectionModalOpen(true);
      } else {
        showToast("error", "Not Found", "Could not load inspection details.");
      }
    } catch (err: any) {
      showToast("error", "Error", "Failed to load inspection details.");
    }
  };

  const [upcomingAssignments, setUpcomingAssignments] = useState<
    Record<string, Inspection[]>
  >({});

  useEffect(() => {
    const loadUpcomingAssignments = async () => {
      try {
        // ۱. دریافت تمام انتصابات از جدول صحیح
        const allAssignments =
          await inspectionAppService.getAllAssignments("TPI");

        // ۲. گروه‌بندی انتصابات بر اساس inspector_id و فیلتر کردن فقط وضعیت ASSIGNED
        const upcomingMap = allAssignments.reduce(
          (acc: Record<string, any[]>, curr: any) => {
            if (curr.inspector_id && curr.status === "ASSIGNED") {
              if (!acc[curr.inspector_id]) {
                acc[curr.inspector_id] = [];
              }
              acc[curr.inspector_id].push(curr);
            }
            return acc;
          },
          {},
        );

        setUpcomingAssignments(upcomingMap);
      } catch (err) {
        console.error("Failed to load upcoming assignments", err);
      }
    };
    loadUpcomingAssignments();
  }, []);

  const {
    inspectors,
    filteredInspectors,
    stats,
    loading,
    refreshing,
    refresh,
    searchQuery,
    setSearchQuery,
    selectedInspector,
    setSelectedInspector,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    updateInspectorsLocal,
  } = useInspectors();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInspector, setEditingInspector] = useState<Inspector | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [allAssignments, setAllAssignments] = useState<any[]>([]);

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const assignments = await inspectionAppService.getAllAssignments("TPI");
        setAllAssignments(assignments);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadAllAssignments = async () => {
      try {
        const assignments = await inspectionAppService.getAllAssignments("TPI");
        setAllAssignments(assignments);
      } catch (err) {
        console.error("Failed to load assignments", err);
      }
    };
    loadAllAssignments();
  }, []);

  const handleSaveInspector = async (formData: any, isEdit: boolean) => {
    setIsAddModalOpen(false);

    const tempId = `temp_${Date.now()}`;
    const tempInspector: Inspector = {
      id: tempId,
      name_en: formData.name_en,
      name_fa: formData.name_fa || "",
      inspector_type: formData.inspector_type,
      status: formData.status || "AVAILABLE",
      specialties: formData.specialties || [],
      phone: formData.phone,
      email: formData.email || "",
      location_base: formData.location_base || "",
      personnel_code: formData.personnel_code || "",
      user_id: formData.user_id || "",
      resume_name: formData.resume_name || "",
      resume_url: "",
      resume_size: formData.resume_size || 0,
      rating: 0,
      completed_inspections: 0,
      active_missions: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isEdit && editingInspector) {
      updateInspectorsLocal((prev: Inspector[]) =>
        prev.map((i: Inspector) =>
          i.id === editingInspector.id ? tempInspector : i,
        ),
      );
    } else {
      updateInspectorsLocal((prev: Inspector[]) => [tempInspector, ...prev]);
    }

    setEditingInspector(null);
    showToast("success", "Saved", "Inspector saved successfully!");

    try {
      let savedInspector: Inspector;

      if (isEdit && editingInspector) {
        savedInspector = await inspectorAppService.update(
          editingInspector.id,
          formData,
        );
      } else {
        savedInspector = await inspectorAppService.create(formData);
      }

      updateInspectorsLocal((prev: Inspector[]) =>
        prev.map((i: Inspector) => (i.id === tempId ? savedInspector : i)),
      );

      await refresh();
    } catch (err: any) {
      console.error("❌ [PARENT] Background save failed:", err);

      updateInspectorsLocal((prev: Inspector[]) =>
        prev.filter((i: Inspector) => i.id !== tempId),
      );

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
    const confirmed = await confirmDialog({
      title: "Delete Inspector",
      message: `Are you sure you want to delete "${inspector.name_en}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await inspectorAppService.delete(inspector.id);
      showToast("success", "Deleted", "Inspector deleted successfully");
      await refresh();
    } catch (err: any) {
      console.error("Delete Error:", err);

      showToast(
        "error",
        "Delete Failed",
        err.message || "Failed to delete inspector",
      );
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
      console.log("🔍 [Inspectors Page] allAssignments state:",
      allAssignments?.length || 0); console.log("🔍 [Inspectors Page] First
      assignment:", allAssignments?.[0]);
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
        allAssignments={allAssignments}
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
