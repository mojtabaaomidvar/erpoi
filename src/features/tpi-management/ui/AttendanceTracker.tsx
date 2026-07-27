// src/features/tpi-management/ui/AttendanceTracker.tsx

import { useState, useEffect } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { inspectorAttendanceAppService } from "../application/InspectorAttendanceApplicationService";
import { supabase } from "@shared/database/supabase";
import type { AttendanceStatus } from "../domain/types";

interface AttendanceTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  residentInspectionId: string;
  onSuccess: () => void;
}

const ATTENDANCE_STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  icon: string;
}[] = [
  { value: "PRESENT", label: "Present", icon: "✅" },
  { value: "ABSENT", label: "Absent", icon: "❌" },
  { value: "LATE", label: "Late", icon: "⏰" },
  { value: "LEAVE", label: "Leave", icon: "🏖️" },
];

export function AttendanceTracker({
  isOpen,
  onClose,
  residentInspectionId,
  onSuccess,
}: AttendanceTrackerProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    inspector_id: "",
    discipline: "",
    attendance_date: "",
    status: "PRESENT" as AttendanceStatus,
    hours_worked: 8,
    notes: "",
  });

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .schema("core")
        .from("users")
        .select("id, full_name, username, email, role")
        .in("role", ["inspector", "expert"])
        .order("full_name", { ascending: true });

      if (error) throw new Error(error.message);
      setUsers(data || []);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (
      !formData.inspector_id ||
      !formData.attendance_date ||
      !formData.discipline
    ) {
      showToast(
        "error",
        "Error",
        "Inspector, date, and discipline are required",
      );
      return;
    }

    setIsSaving(true);
    try {
      await inspectorAttendanceAppService.create({
        resident_inspection_id: residentInspectionId,
        inspector_id: formData.inspector_id,
        discipline: formData.discipline,
        attendance_date: formData.attendance_date,
        status: formData.status,
        hours_worked: formData.hours_worked,
        notes: formData.notes || undefined,
        recorded_by: user?.id || "unknown",
      });

      showToast("success", "Recorded", "Attendance recorded successfully");
      setFormData({
        inspector_id: "",
        discipline: "",
        attendance_date: "",
        status: "PRESENT",
        hours_worked: 8,
        notes: "",
      });
      onSuccess();
    } catch (err: any) {
      showToast("error", "Save Failed", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Attendance"
      size="lg"
    >
      <div className="flex flex-col" style={{ height: "calc(90vh - 120px)" }}>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Inspector */}
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Inspector <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.inspector_id}
              onChange={(e) =>
                setFormData({ ...formData, inspector_id: e.target.value })
              }
              className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed`}
            >
              <option value="">-- Select Inspector --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.username}
                </option>
              ))}
            </select>
          </div>

          {/* Discipline */}
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Discipline <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.discipline}
              onChange={(e) =>
                setFormData({ ...formData, discipline: e.target.value })
              }
              className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed`}
            >
              <option value="">-- Select Discipline --</option>
              {[
                "General",
                "Telecommunication",
                "Architecture",
                "Piping",
                "Instrumentation",
                "Mechanical",
                "Electrical",
                "Process",
                "Welding",
                "HVAC",
                "Civil",
                "Coating",
                "NDT",
                "Structure",
                "Material",
              ].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Attendance Date <span className="text-rose-500">*</span>
            </label>
            <JalaaliDatePicker
              value={formData.attendance_date}
              onChange={(date) =>
                setFormData({ ...formData, attendance_date: date })
              }
              placeholder="Select date"
            />
          </div>

          {/* Status */}
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, status: opt.value })
                  }
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                    formData.status === opt.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : isDark
                        ? "bg-slate-800 border-slate-700 text-slate-400"
                        : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  <div className="text-lg mb-0.5">{opt.icon}</div>
                  <div>{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hours Worked */}
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Hours Worked
            </label>
            <input
              type="number"
              value={formData.hours_worked}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hours_worked: Number(e.target.value),
                })
              }
              min={0}
              max={24}
              className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed`}
            />
          </div>

          {/* Notes */}
          <div>
            <label
              className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed`}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex-shrink-0 px-6 py-4 border-t flex justify-end gap-2 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
        >
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSaving ? "⏳ Recording..." : "✅ Record"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
