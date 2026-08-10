// src/features/tpi-management/ui/components/SessionInfoCard.tsx

import { useTheme } from "@app/providers/ThemeProvider";
import { Badge } from "@design-system";
import type { InspectionSession } from "@/features/inspection-management/domain/models/InspectionSession";
import { INSPECTION_EXECUTION_STATUS_CONFIG } from "@/features/inspection-management/constants";

interface SessionInfoCardProps {
  session: InspectionSession | null;
  equipmentNames?: Record<string, string>;
  compact?: boolean;
  /** Request-level fields merged into the same card */
  serviceDomain?: string[] | string | null;
  tpiMode?: string;
  vendorName?: string | null;
}

export function SessionInfoCard({
  session,
  equipmentNames = {},
  compact = false,
  serviceDomain,
  tpiMode,
  vendorName,
}: SessionInfoCardProps) {
  const { isDark } = useTheme();

  const statusConfig = session
    ? INSPECTION_EXECUTION_STATUS_CONFIG[
        session.status as keyof typeof INSPECTION_EXECUTION_STATUS_CONFIG
      ] || {
        label: session.status,
        color: "slate",
        icon: "❓",
      }
    : null;

  const chipClass = (active: boolean) =>
    active
      ? "text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-600 text-white"
      : `text-[10px] px-2 py-0.5 rounded-full font-medium ${
          isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
        }`;

  const labelClass = `text-[9px] font-bold uppercase tracking-wider mb-1 ${
    isDark ? "text-slate-500" : "text-slate-400"
  }`;

  const valueClass = `font-medium ${
    isDark ? "text-slate-200" : "text-slate-800"
  }`;

  const serviceDomainText = Array.isArray(serviceDomain)
    ? serviceDomain.join(", ")
    : serviceDomain || "—";

  return (
    <div
      className={`rounded-xl border ${
        isDark
          ? "bg-slate-900/60 border-slate-700"
          : "bg-white border-slate-200 shadow-sm"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3
          className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          Request Information
        </h3>
        {statusConfig && (
          <Badge tone={statusConfig.color as any} className="text-[9px]">
            {statusConfig.icon} {statusConfig.label}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Request-level fields */}
        <div>
          <p className={labelClass}>Service Domain</p>
          <div className={valueClass}>{serviceDomainText}</div>
        </div>
        <div>
          <p className={labelClass}>
            {tpiMode === "SPOT" ? "Vendor" : "Site Representative"}
          </p>
          <div className={valueClass}>
            {tpiMode === "SPOT" ? vendorName || "Not assigned" : "Not assigned"}
          </div>
        </div>

        {/* Session details */}
        {session && (
          <>
            {session.stages.length > 0 && (
              <div>
                <p className={labelClass}>Stages</p>
                <div className="flex flex-wrap gap-1">
                  {session.stages.map((s) => (
                    <span key={s} className={chipClass(true)}>
                      ⚙️ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {session.methods.length > 0 && (
              <div>
                <p className={labelClass}>Methods</p>
                <div className="flex flex-wrap gap-1">
                  {session.methods.map((m) => (
                    <span key={m} className={chipClass(false)}>
                      🔬 {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {session.equipment_ids.length > 0 && (
              <div>
                <p className={labelClass}>
                  Equipment ({session.equipment_ids.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {session.equipment_ids.map((id) => (
                    <span key={id} className={chipClass(false)}>
                      🔧 {equipmentNames[id] || id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {session.sub_vendor && (
              <div>
                <p className={labelClass}>SUB-VENDOR</p>
                <div className="flex flex-wrap gap-1">{session.sub_vendor}</div>
              </div>
            )}

            {session.notes && (
              <div
                className={`text-[10px] italic ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                📝 {session.notes}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
