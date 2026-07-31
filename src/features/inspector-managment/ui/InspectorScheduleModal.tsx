// src/features/inspector-managment/ui/InspectorScheduleModal.tsx

import { useState, useMemo } from "react";
import { Modal, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { jalaaliToGregorianDate } from "@/entities/contract/services/contractCalculations";
import { formatJalaliDate } from "@/shared/utils/dateUtils";

interface InspectorScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectorId: string;
  inspectorName: string;
  allAssignments: any[];
}

const MONTHS_EN = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
];

const WEEK_DAYS_EN = ["Fri", "Thu", "Wed", "Tue", "Mon", "Sun", "Sat"];

export function InspectorScheduleModal({
  isOpen,
  onClose,
  inspectorId,
  inspectorName,
  allAssignments,
}: InspectorScheduleModalProps) {
  const { isDark } = useTheme();

  console.log("🔍 [InspectorScheduleModal] Props received:");
  console.log("  - allAssignments length:", allAssignments?.length || 0);
  console.log("  - allAssignments first item:", allAssignments?.[0]);
  console.log("  - inspectorId:", inspectorId);

  const now = new Date();
  const jalaliString = now.toLocaleDateString("fa-IR");
  const toEnglishDigits = (str: string) =>
    str.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const parts = toEnglishDigits(jalaliString).split("/");

  const [jYear, setJYear] = useState<number>(parseInt(parts[0]));
  const [jMonth, setJMonth] = useState<number>(parseInt(parts[1]));

  // ✅ Stateهای Tooltip بر اساس موقعیت المان (نه موس)
  const [hoveredInspection, setHoveredInspection] = useState<any>(null);
  const [tooltipRect, setTooltipRect] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const inspectorAssignments = useMemo(() => {
    return allAssignments.filter((a) => a.inspector_id === inspectorId);
  }, [allAssignments, inspectorId]);

  const assignmentsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    inspectorAssignments.forEach((a) => {
      if (a.execution_date) {
        const jDateStr = formatJalaliDate(a.execution_date).replace(/-/g, "/");
        if (!map[jDateStr]) map[jDateStr] = [];
        map[jDateStr].push(a);
      }
    });
    return map;
  }, [inspectorAssignments]);

  const calendarGrid = useMemo(() => {
    const days: (number | null)[] = [];
    const firstDayStr = `${jYear}/${String(jMonth).padStart(2, "0")}/01`;
    const gDate = jalaaliToGregorianDate(firstDayStr);
    if (!gDate) return days;

    const dayOfWeek = gDate.getDay();
    const startDayIndex = (dayOfWeek + 1) % 7;

    for (let i = 0; i < startDayIndex; i++) days.push(null);

    const daysInMonth = jMonth <= 6 ? 31 : jMonth <= 11 ? 30 : 29;
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [jYear, jMonth]);

  const handlePrevMonth = () => {
    if (jMonth === 1) {
      setJMonth(12);
      setJYear(jYear - 1);
    } else {
      setJMonth(jMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (jMonth === 12) {
      setJMonth(1);
      setJYear(jYear + 1);
    } else {
      setJMonth(jMonth + 1);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "COMPLETED") return "bg-emerald-500 text-white";
    if (status === "CANCELLED") return "bg-rose-500 text-white";
    if (status === "IN_PROGRESS") return "bg-amber-500 text-white";
    return "bg-indigo-500 text-white";
  };

  // ✅ دریافت موقعیت دقیق المان و قرار دادن Tooltip بالای آن
  const handleItemHover = (e: React.MouseEvent, inspection: any) => {
    setHoveredInspection(inspection);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // جلوگیری از بیرون زدن Tooltip از سمت راست صفحه (عرض Tooltip حدود 288px است)
    const safeLeft = Math.min(rect.left, window.innerWidth - 300);

    setTooltipRect({
      top: rect.top,
      left: Math.max(8, safeLeft), // حداقل 8px فاصله از چپ صفحه
    });
  };

  const handleItemLeave = () => {
    setHoveredInspection(null);
    setTooltipRect(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Work Calendar: ${inspectorName}`}
      size="full"
    >
      <div
        className={`p-6 rounded-xl flex flex-col h-[80vh] min-h-[600px] ${isDark ? "bg-slate-900" : "bg-white"}`}
      >
        {/* هدر تقویم */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <button
            onClick={handlePrevMonth}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}
          >
            ← Prev
          </button>
          <h3
            className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            {MONTHS_EN[jMonth - 1]} {jYear}
          </h3>
          <button
            onClick={handleNextMonth}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-700"}`}
          >
            Next →
          </button>
        </div>

        <div
          className="flex-1 border rounded-lg overflow-hidden flex flex-col h-full"
          dir="rtl"
        >
          <div
            className={`grid grid-cols-7 border-b shrink-0 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
          >
            {WEEK_DAYS_EN.map((day) => (
              <div
                key={day}
                className={`text-center text-xs font-bold py-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1">
            {calendarGrid.map((day, index) => {
              if (day === null)
                return (
                  <div
                    key={`empty-${index}`}
                    className={`border-b border-r ${isDark ? "border-slate-800 bg-slate-900/30" : "border-slate-100 bg-slate-50/30"}`}
                  />
                );

              const dateKey = `${jYear}/${String(jMonth).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
              const dayAssignments = assignmentsByDate[dateKey] || [];
              const hasAssignments = dayAssignments.length > 0;
              const displayAssignments = dayAssignments.slice(0, 5);
              const remaining = dayAssignments.length - 5;

              return (
                <div
                  key={dateKey}
                  className={`relative border-b border-r p-1.5 text-right transition-all flex flex-col
                    ${isDark ? "border-slate-800 hover:bg-slate-800/50" : "border-slate-100 hover:bg-slate-50"}
                    ${hasAssignments ? (isDark ? "bg-indigo-900/10" : "bg-indigo-50/50") : ""}
                  `}
                >
                  <span
                    className={`text-xs font-semibold mb-1 block shrink-0 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {day}
                  </span>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                    {displayAssignments.map((a, idx) => (
                      <div
                        key={idx}
                        onMouseEnter={(e) => handleItemHover(e, a)}
                        onMouseLeave={handleItemLeave}
                        className={`p-1.5 rounded text-[10px] leading-tight cursor-pointer transition-all hover:brightness-110 ${getStatusColor(a.status)}`}
                      >
                        <div className="font-bold truncate flex items-center gap-1">
                          👤 {a.client_name}
                        </div>

                        <div className="text-[9px] opacity-90 truncate flex items-center gap-1 mt-0.5">
                          🏢 {a.project_name}
                        </div>
                      </div>
                    ))}
                    {remaining > 0 && (
                      <div
                        className={`text-[10px] px-1.5 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        +{remaining} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {hoveredInspection && tooltipRect && (
          <div
            key={`tooltip-${hoveredInspection.id}`}
            className={`fixed z-[100] w-80 p-4 rounded-xl shadow-2xl border pointer-events-none transition-all duration-150 ease-out
              ${isDark ? "bg-slate-800/95 border-slate-600" : "bg-white/95 border-slate-300"}
            `}
            style={{
              bottom: `${window.innerHeight - tooltipRect.top + 8}px`,
              left: `${tooltipRect.left}px`,
            }}
          >
            <div
              className={`absolute w-3 h-3 border-r border-b transform rotate-45
                ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}
              `}
              style={{ bottom: "-6px", left: "20px" }}
            />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <Badge
                tone={
                  hoveredInspection.status === "COMPLETED"
                    ? "emerald"
                    : hoveredInspection.status === "CANCELLED"
                      ? "danger"
                      : "indigo"
                }
                className="text-xs"
              >
                {hoveredInspection.status}
              </Badge>
              <span
                className={`text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {formatJalaliDate(hoveredInspection.execution_date)}
              </span>
            </div>

            <div className="space-y-3 relative z-10">
              <div>
                <div>
                  <div
                    className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                  >
                    👤 Client
                  </div>
                  <div
                    className={`text-[9px] font-medium leading-snug ${isDark ? "text-slate-200" : "text-slate-800"}`}
                  >
                    {hoveredInspection.client_name}
                  </div>
                </div>
              </div>
              <div>
                <div
                  className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  🏢 Project
                </div>
                <div
                  className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  {hoveredInspection.project_name ||
                    hoveredInspection.vendor_site ||
                    "Not specified"}
                </div>
              </div>

              {hoveredInspection.inspection_items &&
                hoveredInspection.inspection_items.length > 0 && (
                  <div
                    className={`pt-3 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
                  >
                    <div
                      className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      📋 Inspection Items
                    </div>
                    <div className="space-y-1.5">
                      {hoveredInspection.inspection_items
                        .slice(0, 2)
                        .map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className={`text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            • {item.name || item.description}
                          </div>
                        ))}
                      {hoveredInspection.inspection_items.length > 2 && (
                        <div
                          className={`text-[10px] italic ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          +{hoveredInspection.inspection_items.length - 2} more
                          items
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {hoveredInspection && tooltipRect && (
                <div
                  className={`fixed z-[100] w-80 p-4 rounded-xl shadow-2xl border pointer-events-none transition-all duration-150 ease-out
              ${isDark ? "bg-slate-800/95 border-slate-600" : "bg-white/95 border-slate-300"}
            `}
                  style={{
                    bottom: `${window.innerHeight - tooltipRect.top + 8}px`,
                    left: `${tooltipRect.left}px`,
                  }}
                >
                  <div
                    className={`absolute w-3 h-3 border-r border-b transform rotate-45
                ${isDark ? "bg-slate-800 border-slate-600" : "bg-white border-slate-300"}
              `}
                    style={{ bottom: "-6px", left: "20px" }}
                  />

                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <Badge
                      tone={
                        hoveredInspection.status === "COMPLETED"
                          ? "emerald"
                          : hoveredInspection.status === "CANCELLED"
                            ? "danger"
                            : "indigo"
                      }
                      className="text-xs"
                    >
                      {hoveredInspection.status}
                    </Badge>
                    <span
                      className={`text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {formatJalaliDate(hoveredInspection.execution_date)}
                    </span>
                  </div>

                  <div className="space-y-3 relative z-10">
                    {/* مشتری */}
                    <div>
                      <div
                        className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                      >
                        👤 Client
                      </div>
                      <div
                        className={`text-xs font-medium leading-snug ${isDark ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {hoveredInspection.client_name}
                      </div>
                    </div>

                    {/* پروژه */}
                    <div>
                      <div
                        className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                      >
                        🏢 Project
                      </div>
                      <div
                        className={`text-xs font-medium leading-snug ${isDark ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {hoveredInspection.project_name}
                      </div>
                    </div>

                    {/* وندور، متد و استیج */}
                    <div
                      className={`pt-3 border-t border-dashed ${isDark ? "border-slate-700" : "border-slate-300"}`}
                    >
                      <div className="mb-3">
                        <div
                          className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                        >
                          🏭 Vendor
                        </div>
                        <div
                          className={`text-xs font-medium leading-snug ${isDark ? "text-slate-200" : "text-slate-800"}`}
                        >
                          {hoveredInspection.vendor_name}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div
                            className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                          >
                            🔍 Method
                          </div>
                          <div
                            className={`text-xs font-medium leading-snug ${isDark ? "text-slate-200" : "text-slate-800"}`}
                          >
                            {Array.isArray(hoveredInspection.inspection_method)
                              ? hoveredInspection.inspection_method.join(", ")
                              : hoveredInspection.inspection_method}
                          </div>
                        </div>
                        <div>
                          <div
                            className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                          >
                            📌 Stage
                          </div>
                          <div
                            className={`text-xs font-medium leading-snug ${isDark ? "text-slate-200" : "text-slate-800"}`}
                          >
                            {Array.isArray(hoveredInspection.inspection_stages)
                              ? hoveredInspection.inspection_stages.join(", ")
                              : hoveredInspection.inspection_stages || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* آیتم‌های بازرسی (Disciplines) */}
                    {hoveredInspection.disciplines && (
                      <div
                        className={`pt-3 border-t border-dashed ${isDark ? "border-slate-700" : "border-slate-300"}`}
                      >
                        <div
                          className={`text-[10px] uppercase font-bold tracking-wider mb-1.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                        >
                          📋 Disciplines
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(hoveredInspection.disciplines)
                            ? hoveredInspection.disciplines
                            : String(hoveredInspection.disciplines)
                                .split(",")
                                .map((s: string) => s.trim())
                          )
                            .slice(0, 3)
                            .map((item: string, idx: number) => (
                              <span
                                key={idx}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium
                        ${isDark ? "bg-indigo-900/40 text-indigo-300 border border-indigo-800" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}
                      `}
                              >
                                {item}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
