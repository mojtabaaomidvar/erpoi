// src/pages/ResidentInspection.tsx

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { ResidentElements } from "@shared/authorization/ui/elements/ResidentElements";
import {
  residentEngagementAppService,
  type ResidentEngagement,
} from "@/features/resident-inspection";
import { ResidentEngagementForm } from "@/features/tpi-management/ui/ResidentEngagementForm";
import { ResidentEngagementDetail } from "@/features/resident-inspection/ui/ResidentEngagementDetail";
import { documentReviewAppService } from "@/features/inspection-management/application/DocumentReviewApplicationService";
import { showToast } from "@shared/ui/ToastContainer";
import { Button, Badge } from "@design-system";
import { FloatingSearch } from "@shared/ui/FloatingSearch";

export function ResidentInspection() {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  const [engagements, setEngagements] = useState<ResidentEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEngagement, setSelectedEngagement] =
    useState<ResidentEngagement | null>(null);
  const [editingEngagement, setEditingEngagement] =
    useState<ResidentEngagement | null>(null);

  const canViewList = canAccessElement(
    ResidentElements.ResidentList.list_item_view.id,
  );
  const canAdd = canAccessElement(ResidentElements.ResidentList.btn_add.id);
  const canSearch = canAccessElement(
    ResidentElements.ResidentList.search_box.id,
  );

  const loadEngagements = async () => {
    setLoading(true);
    try {
      const data = await residentEngagementAppService.getAll();
      setEngagements(data);
    } catch (err: any) {
      showToast(
        "error",
        "Load Failed",
        err.message || "Could not load engagements",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEngagements();
  }, []);

  const filteredEngagements = useMemo(() => {
    return engagements.filter((e) => {
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.scope_of_work?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "ALL" || e.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [engagements, searchQuery, filterStatus]);

  if (!canViewList) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2
            className={`text-xl font-bold mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            Access Denied
          </h2>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            You do not have permission to view Resident Inspection module.
          </p>
        </div>
      </div>
    );
  }

  if (selectedEngagement) {
    return (
      <div className="p-6">
        <ResidentEngagementDetail
          engagement={selectedEngagement}
          onEdit={() => {
            setEditingEngagement(selectedEngagement);
            setIsFormOpen(true);
          }}
          onBack={() => setSelectedEngagement(null)}
        />
        <ResidentEngagementForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingEngagement(null);
          }}
          initialData={editingEngagement}
          onUploadDocuments={(engagementId, documents) =>
            documentReviewAppService.uploadResidentDocuments(
              engagementId,
              documents,
            )
          }
          onSuccess={() => {
            loadEngagements();
            setSelectedEngagement(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            🏢 Resident Inspection
          </h1>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Continuous on-site inspection engagements
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canSearch && (
            <FloatingSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search engagements..."
            />
          )}
          {canAdd && (
            <Button variant="primary" onClick={() => setIsFormOpen(true)}>
              + New Engagement
            </Button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          "ALL",
          "DRAFT",
          "PLANNED",
          "ACTIVE",
          "SUSPENDED",
          "COMPLETED",
          "CANCELLED",
          "CLOSED",
        ].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === status
                ? "bg-indigo-600 text-white shadow-md"
                : isDark
                  ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {status}
            <span className="ml-1 opacity-70">
              (
              {status === "ALL"
                ? engagements.length
                : engagements.filter((e) => e.status === status).length}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`rounded-xl p-6 border animate-pulse ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredEngagements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3
            className={`text-lg font-semibold mb-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}
          >
            No engagements found
          </h3>
          <p
            className={`text-sm ${isDark ? "text-slate-500" : "text-slate-600"} mb-6`}
          >
            {engagements.length === 0
              ? "Create your first resident inspection engagement"
              : "Try adjusting your search or filter"}
          </p>
          {canAdd && (
            <Button variant="primary" onClick={() => setIsFormOpen(true)}>
              Create Engagement
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEngagements.map((engagement) => (
            <div
              key={engagement.id}
              onClick={() => setSelectedEngagement(engagement)}
              className={`cursor-pointer rounded-xl p-5 border transition-all hover:shadow-lg hover:scale-[1.02] ${
                isDark
                  ? "bg-slate-800/50 border-slate-700 hover:border-indigo-500/50"
                  : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-indigo-500/10"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3
                  className={`font-bold text-lg truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  {engagement.title}
                </h3>
                <Badge
                  tone={
                    engagement.status === "ACTIVE"
                      ? "success"
                      : engagement.status === "PLANNED"
                        ? "info"
                        : engagement.status === "DRAFT"
                          ? "warning"
                          : engagement.status === "COMPLETED"
                            ? "neutral"
                            : "danger"
                  }
                  className="text-[10px]"
                >
                  {engagement.status}
                </Badge>
              </div>

              <p
                className={`text-sm mb-4 line-clamp-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                {engagement.scope_of_work || "No scope defined"}
              </p>

              <div className="space-y-2 text-xs">
                <div
                  className={`flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  <span>📍</span>
                  <span>{engagement.location || "Location TBD"}</span>
                </div>
                <div
                  className={`flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  <span>📅</span>
                  <span>
                    {engagement.planned_start_date} →{" "}
                    {engagement.planned_end_date || "Ongoing"}
                  </span>
                </div>
              </div>

              <div
                className={`mt-4 pt-4 border-t text-right ${isDark ? "border-slate-700" : "border-slate-200"}`}
              >
                <span
                  className={`text-xs font-medium ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                >
                  View Details →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <ResidentEngagementForm
        isOpen={isFormOpen && !selectedEngagement}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadEngagements}
        onUploadDocuments={(engagementId, documents) =>
          documentReviewAppService.uploadResidentDocuments(
            engagementId,
            documents,
          )
        }
      />
    </div>
  );
}
