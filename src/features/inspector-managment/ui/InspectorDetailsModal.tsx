// src/features/inspector-managment/ui/InspectorDeatilsModal.tsx

import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Inspector } from "../domain";
import { InspectionElements } from "@shared/authorization/ui/elements/InspectionElements";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { sortSpecialties } from "@/shared/utils/formatUtils";
import { processOtherValue } from "@/shared/utils/formatUtils";

interface InspectorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspector: Inspector | null;
  onEdit: (inspector: Inspector) => void;
  onDelete: (inspector: Inspector) => void;
  canDownloadResume?: boolean;
}

const STATUS_LABELS: Record<
  string,
  {
    label: string;
    icon: string;
    tone: "emerald" | "amber" | "slate" | "danger";
  }
> = {
  AVAILABLE: { label: "Available", icon: "✅", tone: "emerald" },
  ON_MISSION: { label: "On Mission", icon: "🚀", tone: "amber" },
  ON_LEAVE: { label: "On Leave", icon: "🌴", tone: "slate" },
  INACTIVE: { label: "Inactive", icon: "⛔", tone: "danger" },
};

export function InspectorDetailsModal({
  isOpen,
  onClose,
  inspector,
  onEdit,
  onDelete,
  canDownloadResume = true,
}: InspectorDetailsModalProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();
  const canEdit = canAccessElement(
    InspectionElements.InspectionDetails.btn_edit.id,
  );
  const canDelete = canAccessElement(
    InspectionElements.InspectionDetails.btn_delete.id,
  );

  if (!inspector) return null;

  const statusInfo = STATUS_LABELS[inspector.status] || STATUS_LABELS.AVAILABLE;

  const handleDownloadResume = () => {
    if (!inspector.resume_url) return;
    const link = document.createElement("a");
    link.href = inspector.resume_url;
    link.download = inspector.resume_name || "resume";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sectionTitleClass = `text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inspector Details"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(inspector)}
              className="text-rose-600 border-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              🗑️ Delete
            </Button>
          )}
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(inspector);
              }}
            >
              ✏️ Edit
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
          >
            {inspector.name_en
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className={`text-lg font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {inspector.name_en}
            </h2>
            {inspector.name_fa && (
              <p
                className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}
                dir="rtl"
              >
                {inspector.name_fa}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge
                tone={
                  inspector.inspector_type === "ICS_MEMBER" ? "indigo" : "amber"
                }
                className="text-[9px] px-1.5 py-0.5"
              >
                {inspector.inspector_type === "ICS_MEMBER"
                  ? "🏢 ICS Member"
                  : "🎒 Freelancer"}
              </Badge>
              <Badge
                tone={statusInfo.tone}
                className="text-[9px] px-1.5 py-0.5"
              >
                {statusInfo.icon} {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionTitleClass}>
            <span>👤</span> Information
          </h3>
          <div
            className={`grid grid-cols-2 gap-3 p-3 rounded-lg text-sm ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
          >
            <div>
              <div
                className={`text-[10px] uppercase font-semibold mb-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                Phone
              </div>
              <div className="font-medium">{inspector.phone || "—"}</div>
            </div>
            <div>
              <div
                className={`text-[10px] uppercase font-semibold mb-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                Email
              </div>
              <div className="font-medium truncate">
                {inspector.email || "—"}
              </div>
            </div>
            <div>
              <div
                className={`text-[10px] uppercase font-semibold mb-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                Location
              </div>
              <div className="font-medium">
                {inspector.location_base || "—"}
              </div>
            </div>
            {inspector.inspector_type === "ICS_MEMBER" && (
              <div>
                <div
                  className={`text-[10px] uppercase font-semibold mb-0.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                >
                  Personnel Code
                </div>
                <div className="font-mono font-medium">
                  {inspector.personnel_code || "—"}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className={sectionTitleClass}>
            <span>📄</span> Resume
          </h3>
          {inspector.resume_url ? (
            <div
              className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? "border-emerald-700 bg-emerald-950/20" : "border-emerald-200 bg-emerald-50"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0">📎</span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${isDark ? "text-emerald-300" : "text-emerald-800"}`}
                  >
                    {inspector.resume_name}
                  </p>
                  <p
                    className={`text-[10px] ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    {inspector.resume_size
                      ? `${(inspector.resume_size / 1024).toFixed(1)} KB`
                      : "Unknown size"}
                  </p>
                  {inspector.resume_uploaded_at && (
                    <p
                      className={`text-[10px] ${isDark ? "text-emerald-500" : "text-emerald-700"}`}
                    >
                      📅 Uploaded:{" "}
                      {new Date(
                        inspector.resume_uploaded_at,
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
              {canDownloadResume && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadResume}
                  className="shrink-0"
                >
                  📥 Download
                </Button>
              )}
            </div>
          ) : (
            <div
              className={`p-3 rounded-lg border border-dashed text-center text-sm ${isDark ? "border-slate-700 text-slate-500" : "border-slate-300 text-slate-400"}`}
            >
              📄 No resume uploaded
            </div>
          )}
        </div>

        <div>
          <h3 className={sectionTitleClass}>
            <span>🛠️</span> Specialties & Skills
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {sortSpecialties(inspector.specialties).length > 0 ? (
              sortSpecialties(inspector.specialties).map((spec, i) => {
                const { displayValue, isOther } = processOtherValue(spec);
                return (
                  <Badge
                    key={i}
                    tone={isOther ? "amber" : "emerald"}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {isOther && <span className="mr-1">✨</span>}
                    {displayValue}
                  </Badge>
                );
              })
            ) : (
              <span
                className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                No specialties defined
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className={sectionTitleClass}>
            <span>📊</span> Performance Metrics
          </h3>
          <div
            className={`grid grid-cols-3 gap-2 p-3 rounded-lg text-center ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
          >
            <div>
              <div
                className={`text-lg font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}
              >
                ⭐ {inspector.rating.toFixed(1)}
              </div>
              <div
                className={`text-[9px] uppercase font-semibold ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                Rating
              </div>
            </div>
            <div>
              <div
                className={`text-lg font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
              >
                {inspector.completed_inspections}
              </div>
              <div
                className={`text-[9px] uppercase font-semibold ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                Completed
              </div>
            </div>
            <div>
              <div
                className={`text-lg font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              >
                {inspector.active_missions}
              </div>
              <div
                className={`text-[9px] uppercase font-semibold ${isDark ? "text-slate-500" : "text-slate-500"}`}
              >
                Active
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
