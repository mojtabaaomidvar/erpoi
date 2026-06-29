import { Card, CardHeader, Badge, Button, StatusPill } from "@design-system";
import { inspectors, inspectionsByDiscipline, inspectionsByMonth } from "../data/mockData";

export function Reports() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue Trend" subtitle="Monthly revenue ($K)" />
          <div className="p-6 flex items-end gap-4 h-64">
            {inspectionsByMonth.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 justify-end h-full">
                <div className="w-full flex flex-col gap-1 flex-1 justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-500 to-violet-500 rounded-t-md"
                    style={{ height: `${(d.revenue / 250) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{d.month}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Discipline Mix" />
          <div className="p-5 space-y-3">
            {inspectionsByDiscipline.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
                <span className="text-xs text-slate-600 w-20">{d.name}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(d.value / 30) * 100}%`, background: d.color }}
                  />
                </div>
                <span className="text-xs font-semibold w-6 text-right">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Inspector Leaderboard" />
        <div className="divide-y divide-slate-100">
          {[...inspectors]
            .sort((a, b) => b.completedJobs - a.completedJobs)
            .map((ins, idx) => (
              <div key={ins.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{ins.name_en}</div>
                  <div className="text-xs text-slate-500">{ins.completedJobs} inspections</div>
                </div>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${(ins.completedJobs / 150) * 100}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}




