import { Card, Badge, Button, StatusPill } from "@design-system";
import { inspections } from "../data/mockData";
import { formatDateShort } from "@shared/lib/formatters";

export function Inspections() {
  const cols = [
    { status: "REQUESTED", label: "Requested", accent: "bg-sky-500" },
    { status: "DOC_REVIEW", label: "Doc Review", accent: "bg-indigo-500" },
    { status: "INSPECTOR_ASSIGNED", label: "Assigned", accent: "bg-violet-500" },
    { status: "EXECUTING", label: "Executing", accent: "bg-amber-500" },
    { status: "NCR_ISSUED", label: "NCR Issued", accent: "bg-rose-500" },
    { status: "COMPLETED", label: "Completed", accent: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Inspection Workflow (Kanban)</h2>
        <Button size="sm">+ New Request</Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cols.map((col) => {
          const items = inspections.filter((i) => i.status === col.status);
          return (
            <div key={col.status} className="rounded-xl border border-slate-200 bg-slate-50/40">
              <div className="border-b border-slate-200 bg-white px-3 py-2 rounded-t-xl flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                  <span className="text-xs font-semibold text-slate-800">{col.label}</span>
                  <Badge tone="slate">{items.length}</Badge>
                </div>
              </div>
              <div className="space-y-2 p-2 min-h-[120px]">
                {items.map((ins) => (
                  <div
                    key={ins.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-indigo-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-mono text-[11px] font-semibold text-indigo-600">
                        {ins.inspection_no}
                      </div>
                      {ins.has_ncr && (
                        <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                          NCR
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-xs font-medium text-slate-900">{ins.discipline}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{ins.location}</div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-500">
                        <span>
						  📅 {ins.date_requested
							? formatDateShort(ins.date_requested)
							: "-"}
						</span>
                      <span>
                        {ins.inspector_name
                          ? `👤 ${ins.inspector_name.split(" ")[0]}`
                          : "Unassigned"}
                      </span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white/50 py-8 text-center text-[11px] text-slate-400">
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}




