import { Card, Badge, Button, StatusPill } from"@design-system";
import { inspectors } from"../data/mockData";

export function Inspectors() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Inspector Roster</h2>
        <Button size="sm">+ Add Inspector</Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {inspectors.map((ins) => (
          <Card key={ins.id} className="overflow-hidden">
            <div
              className={`h-16 bg-gradient-to-br ${
                ins.status ==="AVAILABLE"?"from-emerald-400 to-cyan-600": ins.status ==="BUSY"?"from-amber-400 to-red-500":"from-slate-400 to-slate-600"}`}
            />
            <div className="relative px-5 pb-5">
              <div className="-mt-8 mb-3 flex items-end justify-between">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br text-lg font-bold text-white shadow-lg ring-4 ring-white ${
                    ins.status ==="AVAILABLE"?"from-indigo-500 to-violet-600": ins.status ==="BUSY"?"from-rose-500 to-pink-600":"from-slate-500 to-zinc-700"}`}
                >
                  {ins.name_en.split("").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <StatusPill status={ins.status} />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{ins.name_en}</div>
                  <div className="text-xs text-slate-500"dir="rtl">{ins.name_fa}</div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                  ⭐ {ins.rating}
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div>📍 {ins.location}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {ins.specialties.map((s) => (
                    <Badge key={s} tone="slate">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                <div>
                  <div className="text-[10px] text-slate-500">Active</div>
                  <div className="text-sm font-semibold text-slate-900">{ins.activeJobs}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Completed</div>
                  <div className="text-sm font-semibold text-slate-900">{ins.completedJobs}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Certs</div>
                  <div className="text-sm font-semibold text-slate-900">{ins.certifications}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}




