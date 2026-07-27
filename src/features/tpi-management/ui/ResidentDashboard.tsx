// src/features/tpi-management/ui/ResidentDashboard.tsx
import { useState, useEffect, useMemo } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { residentInspectionAppService } from "../application/ResidentInspectionApplicationService";
import { monthlyReportAppService } from "../application/MonthlyReportApplicationService";
import { inspectorAttendanceAppService } from "../application/InspectorAttendanceApplicationService";
import { MonthlyReportForm } from "./MonthlyReportForm";
import { AttendanceTracker } from "./AttendanceTracker";
import type { ResidentInspection, MonthlyReport, MonthlyAttendanceSummary } from "../domain/types";

interface ResidentDashboardProps {
  tpiRequestId: string;
}

type ViewMode = "dashboard" | "attendance" | "reports";

export function ResidentDashboard({ tpiRequestId }: ResidentDashboardProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [residentInspections, setResidentInspections] = useState<ResidentInspection[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<MonthlyAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

  const [showReportForm, setShowReportForm] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [residents, reports] = await Promise.all([
        residentInspectionAppService.getByTPIRequest(tpiRequestId),
        monthlyReportAppService.getAll(),
      ]);
      setResidentInspections(residents);
      setMonthlyReports(reports);

      if (residents.length > 0) {
        const activeResident = residents.find((r) => r.status === "ACTIVE") || residents[0];
        setSelectedResidentId(activeResident.id);
        
        const summary = await inspectorAttendanceAppService.getMonthlySummary(
          activeResident.id,
          selectedMonth
        );
        setAttendanceSummary(summary);
      }
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tpiRequestId]);

  useEffect(() => {
    if (selectedResidentId) {
      inspectorAttendanceAppService
        .getMonthlySummary(selectedResidentId, selectedMonth)
        .then(setAttendanceSummary)
        .catch((err: any) => showToast("error", "Load Failed", err.message));
    }
  }, [selectedResidentId, selectedMonth]);

  const activeResident = residentInspections.find((r) => r.id === selectedResidentId);
  const residentReports = monthlyReports.filter(
    (r) => r.resident_inspection_id === selectedResidentId
  );

  const stats = useMemo(() => {
    const totalInspectors = new Set(attendanceSummary.map((a) => a.inspector_id)).size;
    const totalPresent = attendanceSummary.reduce((sum, a) => sum + a.present_days, 0);
    const totalAbsent = attendanceSummary.reduce((sum, a) => sum + a.absent_days, 0);
    const avgAttendance =
      attendanceSummary.length > 0
        ? attendanceSummary.reduce((sum, a) => sum + a.attendance_percentage, 0) /
          attendanceSummary.length
        : 0;

    return {
      totalInspectors,
      totalPresent,
      totalAbsent,
      avgAttendance,
      totalReports: residentReports.length,
    };
  }, [attendanceSummary, residentReports]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-4xl mb-2 animate-pulse">⏳</div>
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Loading resident data...
        </p>
      </div>
    );
  }

  if (residentInspections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-5xl mb-3">🏢</div>
        <p className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          No Resident Inspection Active
        </p>
        <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
          This TPI request is not configured for resident inspection
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={selectedResidentId}
            onChange={(e) => setSelectedResidentId(e.target.value)}
            className={`rounded-lg px-3 py-2 text-sm input-themed max-w-xs`}
          >
            {residentInspections.map((r) => (
              <option key={r.id} value={r.id}>
                Resident {r.id.slice(-6)} - {r.status}
              </option>
            ))}
          </select>
          {activeResident && (
            <Badge
              tone={activeResident.status === "ACTIVE" ? "emerald" : activeResident.status === "COMPLETED" ? "slate" : "amber"}
              className="text-[10px]"
            >
              {activeResident.status}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAttendance(true)}
            disabled={!selectedResidentId}
          >
            📅 Attendance
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowReportForm(true)}
            disabled={!selectedResidentId || activeResident?.status !== "ACTIVE"}
          >
            📊 New Monthly Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Inspectors", value: stats.totalInspectors, icon: "👷", color: "indigo" },
          { label: "Present Days", value: stats.totalPresent, icon: "✅", color: "emerald" },
          { label: "Absent Days", value: stats.totalAbsent, icon: "❌", color: "rose" },
          { label: "Avg Attendance", value: `${stats.avgAttendance.toFixed(0)}%`, icon: "📊", color: "blue" },
          { label: "Reports", value: stats.totalReports, icon: "📄", color: "amber" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl p-3 border transition-all ${
              isDark
                ? "bg-slate-800/50 border-slate-700/50"
                : "bg-white border-slate-200/70 shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {stat.value}
              </span>
            </div>
            <div className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Summary Table */}
      <div className={`rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "border-slate-700" : "border-slate-200"}`}>
          <h3 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            📅 Monthly Attendance Summary
          </h3>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`rounded-lg px-3 py-1.5 text-xs input-themed`}
          />
        </div>

        {attendanceSummary.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📭</div>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              No attendance records for this month
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className={isDark ? "bg-slate-900/50 text-slate-400" : "bg-slate-50 text-slate-600"}>
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Inspector</th>
                  <th className="px-4 py-2 text-left font-semibold">Discipline</th>
                  <th className="px-4 py-2 text-center font-semibold">Total</th>
                  <th className="px-4 py-2 text-center font-semibold">Present</th>
                  <th className="px-4 py-2 text-center font-semibold">Absent</th>
                  <th className="px-4 py-2 text-center font-semibold">Late</th>
                  <th className="px-4 py-2 text-center font-semibold">Leave</th>
                  <th className="px-4 py-2 text-center font-semibold">%</th>
                </tr>
              </thead>
              <tbody className={isDark ? "divide-y divide-slate-700/50" : "divide-y divide-slate-200/70"}>
                {attendanceSummary.map((row) => (
                  <tr key={row.inspector_id} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50/50"}>
                    <td className={`px-4 py-2 font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {row.inspector_name}
                    </td>
                    <td className={`px-4 py-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      <Badge tone="indigo" className="text-[9px]">{row.discipline}</Badge>
                    </td>
                    <td className={`px-4 py-2 text-center font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {row.total_days}
                    </td>
                    <td className="px-4 py-2 text-center font-mono text-emerald-500 font-bold">
                      {row.present_days}
                    </td>
                    <td className="px-4 py-2 text-center font-mono text-rose-500 font-bold">
                      {row.absent_days}
                    </td>
                    <td className="px-4 py-2 text-center font-mono text-amber-500">
                      {row.late_days}
                    </td>
                    <td className="px-4 py-2 text-center font-mono text-blue-500">
                      {row.leave_days}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                          <div
                            className={`h-full rounded-full ${
                              row.attendance_percentage >= 90
                                ? "bg-emerald-500"
                                : row.attendance_percentage >= 70
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${row.attendance_percentage}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                          {row.attendance_percentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Reports List */}
      <div className={`rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className={`px-4 py-3 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}>
          <h3 className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            📄 Monthly Reports ({residentReports.length})
          </h3>
        </div>

        {residentReports.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📭</div>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              No monthly reports submitted yet
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {residentReports.map((report) => (
              <div
                key={report.id}
                className={`p-3 rounded-lg border ${isDark ? "bg-slate-900/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone="indigo" className="text-[9px]">
                        📅 {report.report_month}
                      </Badge>
                      {report.approved_at ? (
                        <Badge tone="emerald" className="text-[9px]">✓ Approved</Badge>
                      ) : (
                        <Badge tone="amber" className="text-[9px]">⏳ Pending</Badge>
                      )}
                    </div>
                    <p className={`text-xs line-clamp-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {report.summary}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showReportForm && selectedResidentId && (
        <MonthlyReportForm
          isOpen={showReportForm}
          onClose={() => setShowReportForm(false)}
          residentInspectionId={selectedResidentId}
          onSuccess={() => {
            setShowReportForm(false);
            loadData();
          }}
        />
      )}

      {showAttendance && selectedResidentId && (
        <AttendanceTracker
          isOpen={showAttendance}
          onClose={() => setShowAttendance(false)}
          residentInspectionId={selectedResidentId}
          onSuccess={() => {
            setShowAttendance(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}