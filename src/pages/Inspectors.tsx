// src/pages/Inspectors.tsx

import { useState } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { InspectorElements } from "@shared/authorization/ui/elements/InspectorElements";
import { useAuth } from "@features/auth/hooks/useAuth";
import { inspectorAppService } from "@/features/inspector-managment/application";
import { InspectorList } from "@/features/inspector-managment/ui/InspectorList";
import { InspectorAddForm } from "@/features/inspector-managment/ui/InspectorAddForm";
import { InspectorDetailsModal } from "@/features/inspector-managment/ui/InspectorDetailsModal";
import { useInspectors } from "@/features/inspector-managment/hooks/useInspectors";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { showToast } from "@shared/ui/ToastContainer";
import type { Inspector } from "@/features/inspector-managment/domain";

export function Inspectors() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  // ✅ استفاده از هوک هوشمند به جای Stateهای دستی
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
    filteredInspectors, // ✅ حالا این متغیر تعریف شده است
    stats, // ✅ حالا این متغیر تعریف شده است
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

  // 🔧 هندلر ذخیره (ایجاد یا ویرایش)
  const handleSaveInspector = async (formData: any, isEdit: boolean) => {
    try {
      let savedInspector: Inspector;

      if (isEdit && editingInspector) {
        // حذف رزومه قدیمی در صورت وجود رزومه جدید
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

      // آپلود رزومه در پس‌زمینه (Background Upload)
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

  // 🔧 هندلر کلیک روی آیتم (باز کردن مودال جزئیات)
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

  // 🔧 هندلر ویرایش از داخل مودال جزئیات
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

  // 🔧 هندلر حذف با Optimistic Update
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

    // ۱. بستن فوری مودال
    setIsDetailsOpen(false);
    setSelectedInspector(null);

    // ۲. نمایش پیام موفقیت
    showToast("success", "Deleted", `${inspector.name_en} has been removed`);

    // ۳. حذف واقعی از دیتابیس و refresh لیست
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
      {/* ✅ کامپوننت لیست با props کامل و صحیح */}
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
    </>
  );
}
