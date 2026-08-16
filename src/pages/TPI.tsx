// src/pages/TPI.tsx

import { useEffect, useState } from "react";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { TPIElements } from "@shared/authorization/ui/elements/TPIElements";
import { ResidentElements } from "@shared/authorization/ui/elements/ResidentElements";
import { TPIList } from "@features/tpi-management/ui/TPIList";
import { TPIRequestForm } from "@features/tpi-management/ui/TPIRequestForm";
import { TPIDetailsModal } from "@features/tpi-management/ui/TPIDetailsModal";
import { SessionSelectionModal } from "@features/tpi-management/ui/components/SessionSelectionModal";
import { PendingDeletionNoticeModal } from "@features/tpi-management/ui/components/PendingDeletionNoticeModal";
import { ResidentEngagementDetail } from "@features/resident-inspection/ui/ResidentEngagementDetail";
import { ResidentEngagementForm } from "@features/tpi-management/ui/ResidentEngagementForm";
import { Modal } from "@design-system";
import { showToast } from "@shared/ui/ToastContainer";
import type { TPIRequest } from "@features/tpi-management/domain/types";
import type {
  TPIEngagement,
  TPIEngagementMode,
} from "@features/tpi-management/domain/models/TPIEngagement";
import type { InspectionSession } from "@/features/inspection-management/domain/models/InspectionSession";
import { tpiEngagementAppService } from "@features/tpi-management/application";
import { documentReviewAppService } from "@features/inspection-management/application/DocumentReviewApplicationService";
import { useAuth } from "@features/auth/hooks/useAuth";
import { tpiDeletionWorkflowAppService } from "@/processes/tpi-deletion";
import { useEvent } from "@infra/events";
import { Building2, MapPin, Lock } from "lucide-react";
import { EmptyState } from "@shared/ui/EmptyState";
import type { ResidentEngagement } from "@features/resident-inspection/domain/types";

interface TPIPackageDeletionEventPayload {
  entityId: string;
}

export function TPI() {
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  const [engagements, setEngagements] = useState<TPIEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeletionPackageIds, setPendingDeletionPackageIds] = useState<
    Set<string>
  >(new Set());
  const [isPendingDeletionNoticeOpen, setIsPendingDeletionNoticeOpen] =
    useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<TPIEngagementMode | null>(
    null,
  );
  const [editingRequest, setEditingRequest] = useState<TPIRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TPIRequest | null>(
    null,
  );
  const [selectedResident, setSelectedResident] = useState<Extract<
    TPIEngagement,
    { mode: "RESIDENT" }
  > | null>(null);
  const [editingResident, setEditingResident] =
    useState<ResidentEngagement | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [sessionSelectionRequest, setSessionSelectionRequest] =
    useState<TPIRequest | null>(null);
  const [isSessionSelectionOpen, setIsSessionSelectionOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<TPIEngagementMode | "ALL">(
    "ALL",
  );

  const canViewItems = canAccessElement(TPIElements.TPIList.list_item_view.id);
  const canDelete = canAccessElement(
    TPIElements.TPIDetails.btn_request_package_deletion.id,
  );
  const canCreateResident = canAccessElement(
    ResidentElements.ResidentList.btn_add.id,
  );
  const canOpenResident = canAccessElement(
    ResidentElements.ResidentDetails.details_view.id,
  );

  const loadTPIEngagements = async () => {
    setLoading(true);
    try {
      const [items, pendingPackageIds] = await Promise.all([
        tpiEngagementAppService.getAll(),
        tpiDeletionWorkflowAppService.getPendingPackageDeletionIds(),
      ]);
      setEngagements(items);
      setPendingDeletionPackageIds(new Set(pendingPackageIds));
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTPIEngagements();
  }, []);

  useEvent<TPIPackageDeletionEventPayload>(
    "tpi.package.deletion.approved",
    ({ payload }) => {
      setPendingDeletionPackageIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(payload.entityId);
        return nextIds;
      });
      setEngagements((currentItems) =>
        currentItems.filter(
          (item) =>
            item.mode !== "SPOT" || item.request.id !== payload.entityId,
        ),
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

  const handleEngagementClick = (engagement: TPIEngagement) => {
    if (engagement.mode === "RESIDENT") {
      if (!canOpenResident) {
        showToast(
          "error",
          "Access Denied",
          "You do not have permission to open Resident engagement details.",
        );
        return;
      }
      setSelectedResident(engagement);
      return;
    }

    if (pendingDeletionPackageIds.has(engagement.request.id)) {
      setIsPendingDeletionNoticeOpen(true);
      return;
    }

    setSessionSelectionRequest(engagement.request);
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
    setSelectedRequest(request);
    setIsDetailsOpen(true);

    if (session) {
      sessionStorage.setItem(`preselected_session_${request.id}`, session.id);
    } else {
      sessionStorage.removeItem(`preselected_session_${request.id}`);
    }
  };

  const handleAddClick = () => {
    setEditingRequest(null);
    setEditingResident(null);
    setCreationMode(filterMode === "ALL" ? null : filterMode);
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
      <EmptyState
        icon={Lock}
        title="Access Denied"
        description="You do not have permission to view the TPI module."
        className="min-h-[60vh]"
      />
    );
  }

  const showResidentForm = isAddModalOpen && creationMode === "RESIDENT";
  const showSpotForm = isAddModalOpen && creationMode === "SPOT";

  return (
    <>
      <TPIList
        engagements={engagements}
        pendingDeletionPackageIds={pendingDeletionPackageIds}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        onEngagementClick={handleEngagementClick}
        onAddClick={handleAddClick}
        loading={loading}
      />

      <Modal
        isOpen={isAddModalOpen && creationMode === null}
        onClose={() => setIsAddModalOpen(false)}
        title="New TPI Inspection"
        size="md"
      >
        <div className="grid grid-cols-2 gap-4 p-6">
          <button
            type="button"
            onClick={() => setCreationMode("SPOT")}
            className="rounded-xl border border-indigo-300 p-6 text-left hover:bg-indigo-50 dark:border-indigo-700 dark:hover:bg-indigo-950/30"
          >
            <strong className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" aria-hidden="true" /> SPOT
            </strong>
            <span className="text-sm text-slate-500">
              Session-based inspection
            </span>
          </button>
          <button
            type="button"
            onClick={() => canCreateResident && setCreationMode("RESIDENT")}
            disabled={!canCreateResident}
            className="rounded-xl border border-emerald-300 p-6 text-left hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:hover:bg-emerald-950/30"
          >
            <strong className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" aria-hidden="true" /> RESIDENT
            </strong>
            <span className="text-sm text-slate-500">
              {canCreateResident
                ? "Long-running engagement"
                : "Additional permission required"}
            </span>
          </button>
        </div>
      </Modal>

      <TPIRequestForm
        isOpen={showSpotForm}
        onClose={() => {
          setIsAddModalOpen(false);
          setCreationMode(null);
          setEditingRequest(null);
        }}
        onSuccess={loadTPIEngagements}
        initialData={editingRequest}
      />

      <ResidentEngagementForm
        isOpen={showResidentForm}
        onClose={() => {
          setIsAddModalOpen(false);
          setCreationMode(null);
          setEditingResident(null);
        }}
        onSuccess={loadTPIEngagements}
        onUploadDocuments={(engagementId, documents) =>
          documentReviewAppService.uploadResidentDocuments(
            engagementId,
            documents,
          )
        }
        initialData={editingResident}
      />

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

      <Modal
        isOpen={selectedResident !== null}
        onClose={() => setSelectedResident(null)}
        title="Resident Inspection Detail"
        size="7xl"
      >
        {selectedResident && (
          <div
            className="p-6"
            style={{ maxHeight: "calc(95vh - 80px)", overflowY: "auto" }}
          >
            <ResidentEngagementDetail
              engagement={selectedResident.engagement}
              onBack={() => setSelectedResident(null)}
              onEdit={(engagement) => {
                setEditingResident(engagement);
                setSelectedResident(null);
                setCreationMode("RESIDENT");
                setIsAddModalOpen(true);
              }}
              onChanged={(engagement) => {
                setSelectedResident({ mode: "RESIDENT", engagement });
                void loadTPIEngagements();
              }}
            />
          </div>
        )}
      </Modal>

      <TPIDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onEdit={(request) => {
          if (pendingDeletionPackageIds.has(request.id)) {
            setIsDetailsOpen(false);
            setSelectedRequest(null);
            setIsPendingDeletionNoticeOpen(true);
            return;
          }
          setEditingRequest(request);
          setCreationMode("SPOT");
          setIsAddModalOpen(true);
          setIsDetailsOpen(false);
        }}
      />
    </>
  );
}
