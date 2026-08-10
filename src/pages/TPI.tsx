// src/pages/TPI.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { TPIElements } from "@shared/authorization/ui/elements/TPIElements";
import { tpiRequestAppService } from "@/features/tpi-management";
import { TPIList } from "@features/tpi-management/ui/TPIList";
import { TPIRequestForm } from "@features/tpi-management/ui/TPIRequestForm";
import { TPIDetailsModal } from "@features/tpi-management/ui/TPIDetailsModal";
import { SessionSelectionModal } from "@features/tpi-management/ui/components/SessionSelectionModal";
import { PendingDeletionNoticeModal } from "@features/tpi-management/ui/components/PendingDeletionNoticeModal";
import { showToast } from "@shared/ui/ToastContainer";
import type {
  TPIRequest,
  TPIMode,
} from "@features/tpi-management/domain/types";
import type { InspectionSession } from "@/features/inspection-management/domain/models/InspectionSession";
import { useAuth } from "@features/auth/hooks/useAuth";
import { tpiDeletionWorkflowAppService } from "@/processes/tpi-deletion";
import { useEvent } from "@infra/events";

interface TPIPackageDeletionEventPayload {
  entityId: string;
}

export function TPI() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  const [tpiRequests, setTpiRequests] = useState<TPIRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeletionPackageIds, setPendingDeletionPackageIds] = useState<
    Set<string>
  >(new Set());
  const [isPendingDeletionNoticeOpen, setIsPendingDeletionNoticeOpen] =
    useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TPIRequest | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<TPIRequest | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Session selection flow
  const [sessionSelectionRequest, setSessionSelectionRequest] =
    useState<TPIRequest | null>(null);
  const [isSessionSelectionOpen, setIsSessionSelectionOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<TPIMode | "ALL">("ALL");

  const canViewItems = canAccessElement(TPIElements.TPIList.list_item_view.id);
  const canDelete = canAccessElement(
    TPIElements.TPIDetails.btn_request_package_deletion.id,
  );

  const loadTPIRequests = async () => {
    setLoading(true);
    try {
      const [requests, pendingPackageIds] = await Promise.all([
        tpiRequestAppService.getAll(),
        tpiDeletionWorkflowAppService.getPendingPackageDeletionIds(),
      ]);
      setTpiRequests(requests);
      setPendingDeletionPackageIds(new Set(pendingPackageIds));
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTPIRequests();
  }, []);

  useEvent<TPIPackageDeletionEventPayload>(
    "tpi.package.deletion.approved",
    ({ payload }) => {
      setPendingDeletionPackageIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(payload.entityId);
        return nextIds;
      });
      setTpiRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== payload.entityId),
      );
    },
  );

  useEvent<TPIPackageDeletionEventPayload>(
    "tpi.package.deletion.rejected",
    ({ payload }) => {
      setPendingDeletionPackageIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(payload.entityId);
        return nextIds;
      });
    },
  );

  const handleRequestClick = (request: TPIRequest) => {
    if (pendingDeletionPackageIds.has(request.id)) {
      setIsPendingDeletionNoticeOpen(true);
      return;
    }

    // Open session selection modal first
    setSessionSelectionRequest(request);
    setIsSessionSelectionOpen(true);
  };

  const handleSessionSelect = (
    request: TPIRequest,
    session: InspectionSession | null,
  ) => {
    if (pendingDeletionPackageIds.has(request.id)) {
      setIsSessionSelectionOpen(false);
      setSessionSelectionRequest(null);
      setIsPendingDeletionNoticeOpen(true);
      return;
    }

    setIsSessionSelectionOpen(false);
    setSessionSelectionRequest(null);
    // Pass the selected session info to TPIDetailsModal
    setSelectedRequest(request);
    setIsDetailsOpen(true);
    // Store the pre-selected session id in sessionStorage so TPIDetailsModal can use it
    if (session) {
      sessionStorage.setItem(`preselected_session_${request.id}`, session.id);
    } else {
      sessionStorage.removeItem(`preselected_session_${request.id}`);
    }
  };

  const handleAddClick = () => {
    setEditingRequest(null);
    setIsAddModalOpen(true);
  };

  const handleDeleteRequest = async (request: TPIRequest, reason: string) => {
    await tpiDeletionWorkflowAppService.requestPackageDeletion({
      packageId: request.id,
      requestedBy: user?.id || "",
      reason,
      packageSnapshot: {
        project_id: request.project_id,
        client_id: request.client_id,
        inspection_date: request.inspection_date,
        tpi_mode: request.tpi_mode,
      },
    });
    setPendingDeletionPackageIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(request.id);
      return nextIds;
    });
    setIsSessionSelectionOpen(false);
    setSessionSelectionRequest(null);
    showToast(
      "success",
      "Request Submitted",
      "Package deletion is pending managerial approval",
    );
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
        pendingDeletionPackageIds={pendingDeletionPackageIds}
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

      {/* Session Selection Modal - opens before TPIDetailsModal */}
      <SessionSelectionModal
        isOpen={isSessionSelectionOpen}
        onClose={() => {
          setIsSessionSelectionOpen(false);
          setSessionSelectionRequest(null);
        }}
        request={sessionSelectionRequest}
        onSessionSelect={handleSessionSelect}
        onDelete={handleDeleteRequest}
        canDelete={canDelete}
      />

      <PendingDeletionNoticeModal
        isOpen={isPendingDeletionNoticeOpen}
        onClose={() => setIsPendingDeletionNoticeOpen(false)}
      />

      <TPIDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onEdit={(req) => {
          if (pendingDeletionPackageIds.has(req.id)) {
            setIsDetailsOpen(false);
            setSelectedRequest(null);
            setIsPendingDeletionNoticeOpen(true);
            return;
          }
          setEditingRequest(req);
          setIsAddModalOpen(true);
          setIsDetailsOpen(false);
        }}
      />
    </>
  );
}
