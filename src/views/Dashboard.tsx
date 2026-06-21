import {
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowRight,
  MapPin,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

import { Card, CardHeader, StatCard, StatusPill, Avatar, Button } from "../design-system";

import {
  inspections,
  invoices,
  inspectionsByDiscipline,
  inspectionsByMonth,
  inspectorPerformance,
} from "../data/mockData";
import { formatCurrency } from "../lib/formatters";

export function Dashboard() {
  const activeInspections = inspections.filter((i) =>
    ["REQUESTED", "DOC_REVIEW", "INSPECTOR_ASSIGNED", "EXECUTING"].includes(i.status),
  ).length;
  const openNcrs = inspections.filter((i) => i.has_ncr && i.status !== "COMPLETED").length;
  const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE").length;
  const monthRevenue = invoices
    .filter((i) => i.status !== "CANCELLED" && i.status !== "DRAFT")
    .reduce((s, i) => s + i.total_amount, 0);

  const recentActivity = [
    { who: "Nasim Karimi", what: "uploaded inspection report", ref: "INS-2026-0184", when: "12m ago", tone: "indigo" as const },
    { who: "System", what: "issued NCR", ref: "NCR-2026-0012", when: "1h ago", tone: "rose" as const },
    { who: "TotalEnergies Pars", what: "requested inspection", ref: "INS-2026-0185", when: "3h ago", tone: "sky" as const },
    { who: "Mohammad A.", what: "assigned inspector", ref: "INS-2026-0189", when: "5h ago", tone: "emerald" as const },
    { who: "Finance", what: "issued invoice", ref: "INV-2026-0089", when: "yesterday", tone: "amber" as const },
  ];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Inspections"
          value={String(activeInspections)}
          delta="↑ 4 this week"
          tone="indigo"
          icon={<FileCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Revenue (30d)"
          value={formatCurrency(monthRevenue, "USD")}
          delta="↑ 12.4% vs last month"
          tone="emerald"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="Open NCRs"
          value={String(openNcrs)}
          delta="↓ 1 from yesterday"
          tone="rose"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Overdue Invoices"
          value={String(overdueInvoices)}
          delta={formatCurrency(invoices.find((i) => i.status === "OVERDUE")?.total_amount ?? 0, "USD")}
          tone="amber"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Inspections & Revenue Trend"
            subtitle="Last 6 months · inspections count vs revenue ($K)"
            action={
              <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button className="rounded-md bg-white px-2.5 py-1 font-medium text-slate-900 shadow-sm">
                  6M
                </button>
                <button className="px-2.5 py-1 text-slate-500">1Y</button>
                <button className="px-2.5 py-1 text-slate-500">All</button>
              </div>
            }
          />
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inspectionsByMonth} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInsp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="inspections"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#6366f1" }}
                  activeDot={{ r: 6 }}
                  name="Inspections"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: "#10b981" }}
                  name="Revenue ($K)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="By Discipline" subtitle="Current period distribution" />
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inspectionsByDiscipline}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {inspectionsByDiscipline.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 px-1 text-xs">
              {inspectionsByDiscipline.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: d.color }} />
                  <span className="truncate text-slate-600">{d.name}</span>
                  <span className="ml-auto font-medium text-slate-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Second row: inspector performance + activity + workflow summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Inspector Performance"
            subtitle="Completed inspections and NCRs issued per inspector"
            action={<Button variant="outline" size="sm">Export <ArrowUpRight className="h-3.5 w-3.5" /></Button>}
          />
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inspectorPerformance} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="ncrIssued" fill="#f43f5e" radius={[4, 4, 0, 0]} name="NCRs Issued" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Activity" subtitle="Live feed from operations" />
          <div className="divide-y divide-slate-100">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <Avatar name={a.who} size="sm" gradient={
                  a.tone === "rose" ? "from-rose-500 to-pink-600" :
                  a.tone === "sky" ? "from-sky-500 to-blue-600" :
                  a.tone === "emerald" ? "from-emerald-500 to-teal-600" :
                  a.tone === "amber" ? "from-amber-500 to-orange-600" :
                  "from-indigo-500 to-violet-600"
                } />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-700">
                    <span className="font-medium text-slate-900">{a.who}</span> {a.what}{" "}
                    <span className="font-mono text-indigo-600">{a.ref}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Workflow summary */}
      <Card>
        <CardHeader
          title="Inspection Pipeline"
          subtitle="Live snapshot of the 5-step workflow"
          action={<Button size="sm">View Workflow <ArrowRight className="h-3.5 w-3.5" /></Button>}
        />
        <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-5">
          {(["REQUESTED", "DOC_REVIEW", "INSPECTOR_ASSIGNED", "EXECUTING", "COMPLETED"] as const).map(
            (status) => {
              const count = inspections.filter((i) => i.status === status).length;
              return (
                <div
                  key={status}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <StatusPill status={status} />
                    <span className="text-lg font-semibold text-slate-900">{count}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {inspections
                        .filter((i) => i.status === status)
                        .slice(0, 1)
                        .map((i) => i.location)
                        .join(" ") || "—"}
                    </span>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </Card>
    </div>
  );
}