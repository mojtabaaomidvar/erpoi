// src/pages/TPI.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { TPIElements } from "@shared/authorization/ui/elements/TPIElements";
import { tpiRequestAppService } from "@/features/tpi-management";
import { TPIList } from "@features/tpi-management/ui/TPIList";
import { TPIRequestForm } from "@features/tpi-management/ui/TPIRequestForm";
import { TPIDetailsModal } from "@features/tpi-management/ui/TPIDetailsModal";
import { showToast } from "@shared/ui/ToastContainer";
import type {
  TPIRequest,
  TPIMode,
} from "@features/tpi-management/domain/types";

export function TPI() {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  const [tpiRequests, setTpiRequests] = useState<TPIRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TPIRequest | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<TPIRequest | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<TPIMode | "ALL">("ALL");

  const canViewItems = canAccessElement(TPIElements.TPIList.list_item_view.id);

  const loadTPIRequests = async () => {
    setLoading(true);
    try {
      const data = await tpiRequestAppService.getAll();
      setTpiRequests(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTPIRequests();
  }, []);

  const handleRequestClick = (request: TPIRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleAddClick = () => {
    setEditingRequest(null);
    setIsAddModalOpen(true);
  };

  const handleDeleteRequest = async (request: TPIRequest) => {
    // Optimistic UI update
    setTpiRequests((prev) => prev.filter((r) => r.id !== request.id));
    setIsDetailsOpen(false);
    setSelectedRequest(null);
    showToast("success", "Deleted", "TPI request has been removed");

    // Background deletion with rollback on error
    await tpiRequestAppService.delete(request.id).catch((err: any) => {
      setTpiRequests((prev) => [request, ...prev]);
      showToast("error", "Delete Failed", err.message || "Failed to delete");
    });
  };

  if (!canViewItems) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 mx-auto ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
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
            You do not have permission to view the TPI module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TPIList
        tpiRequests={tpiRequests}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        onRequestClick={handleRequestClick}
        onAddClick={handleAddClick}
        loading={loading}
      />

      <TPIRequestForm
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRequest(null);
        }}
        onSuccess={loadTPIRequests}
        initialData={editingRequest}
      />

      <TPIDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onEdit={(req) => {
          setEditingRequest(req);
          setIsAddModalOpen(true);
          setIsDetailsOpen(false);
        }}
        onDelete={handleDeleteRequest}
      />
    </>
  );
}
