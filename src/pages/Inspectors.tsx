// src/pages/Inspectors.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { useAuth } from "@features/auth/hooks/useAuth";
import { inspectorService } from "@features/inspector-managment/services/InspectorService";
import { InspectorList } from "@features/inspector-managment/ui/InspectorList";
import { InspectorAddForm } from "@features/inspector-managment/ui/InspectorAddForm";
import { InspectorDetailsModal } from "@features/inspector-managment/ui/InspectorDetailsModal";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import type {
  Inspector,
  InspectorType,
  InspectorStatus,
} from "@/types/inspector";
import { showToast } from "@shared/ui/ToastContainer";

export function Inspectors() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  // 🔧 State های سطح بالا
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInspector, setEditingInspector] = useState<Inspector | null>(
    null,
  );
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [filterType, setFilterType] = useState<InspectorType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<InspectorStatus | "ALL">(
    "ALL",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // 🔐 دسترسی‌ها
  const canViewItems = canAccessElement("inspector_list_view");
  const canClickItem = canAccessElement("inspector_list_item_click");
  const canAdd = canAccessElement("inspector_btn_add");
  const canEdit = canAccessElement("inspector_btn_edit");
  const canDelete = canAccessElement("inspector_btn_delete");
  const canDownloadResume = canAccessElement(
    "inspector_details_download_resume",
  );

  // 🔧 بارگذاری داده‌ها
  const loadInspectors = async () => {
    setLoading(true);
    try {
      const data = await inspectorService.getAll();
      setInspectors(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspectors();
  }, []);

  // 🔧 Handlers
  const handleSaveInspector = async (formData: any, isEdit: boolean) => {
    try {
      let savedInspector;

      if (isEdit && editingInspector) {
        if (editingInspector.resume_url && formData.resumeFile) {
          await inspectorService.deleteResume(editingInspector.resume_url);
        }
        const { resumeFile, ...inspectorData } = formData;
        savedInspector = await inspectorService.update(
          editingInspector.id,
          inspectorData,
        );
      } else {
        const { resumeFile, ...inspectorData } = formData;
        savedInspector = await inspectorService.create(inspectorData);
      }

      setEditingInspector(null);
      setIsAddModalOpen(false);
      await loadInspectors();
      showToast("success", "Saved", "Inspector saved successfully!");

      if (formData.resumeFile && savedInspector) {
        inspectorService
          .uploadResume(
            formData.resumeFile,
            savedInspector.id,
            formData.resume_name,
          )
          .then(async (uploadResult) => {
            await inspectorService.update(savedInspector.id, {
              resume_name: uploadResult.name,
              resume_url: uploadResult.url,
              resume_size: uploadResult.size,
              resume_uploaded_at: uploadResult.uploadedAt,
            });
            await loadInspectors();
          })
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

    // 🔧 ۱. بستن فوری مودال
    setIsDetailsOpen(false);
    setSelectedInspector(null);

    // 🔧 ۲. حذف فوری از لیست (Optimistic Update)
    setInspectors((prev) => prev.filter((i) => i.id !== inspector.id));

    // 🔧 ۳. نمایش فوری پیام موفقیت
    showToast("success", "Deleted", `${inspector.name_en} has been removed`);

    // 🔧 ۴. فرآیند حذف واقعی در پس‌زمینه
    inspectorService.delete(inspector.id).catch((err: any) => {
      // اگر حذف شکست خورد، بازرس را به لیست برگردان
      setInspectors((prev) => [inspector, ...prev]);
      showToast(
        "error",
        "Delete Failed",
        err.message || "Failed to delete inspector",
      );
    });
  };
  // 🔐 بررسی دسترسی مشاهده
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
            You do not have permission to view the inspectors module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 🔧 اسکلت صفحه - فقط فراخوانی کامپوننت‌ها */}
      <InspectorList
        inspectors={inspectors}
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
        canClickItem={canClickItem}
        canSearch={true}
        canFilter={true}
        canAdd={canAdd}
        loading={loading}
      />

      {/* مودال‌ها */}
      <InspectorDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedInspector(null);
        }}
        inspector={selectedInspector}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteInspector}
        canEdit={canEdit}
        canDelete={canDelete}
        canDownloadResume={canDownloadResume}
      />

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
    </>
  );
}
