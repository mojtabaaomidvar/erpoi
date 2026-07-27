// src/features/tpi-management/ui/MonthlyReportForm.tsx
import { useState } from "react";
import { Modal, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { monthlyReportAppService } from "../application/MonthlyReportApplicationService";

interface MonthlyReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  residentInspectionId: string;
  onSuccess: () => void;
}

export function MonthlyReportForm({
  isOpen,
  onClose,
  residentInspectionId,
  onSuccess,
}: MonthlyReportFormProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    report_month: new Date().toISOString().slice(0, 7), // YYYY-MM
    summary: "",
    achievements: "",
    issues: "",
    recommendations: "",
  });

  const handleSubmit = async () => {
    if (!formData.summary.trim()) {
      showToast("error", "Error", "Summary is required");
      return;
    }

    setIsSaving(true);
    try {
      const [year, month] = formData.report_month.split("-").map(Number);
      
      await monthlyReportAppService.create({
        resident_inspection_id: residentInspectionId,
        report_month: formData.report_month,
        report_year: year,
        summary: formData.summary,
        achievements: formData.achievements,
        issues: formData.issues,
        recommendations: formData.recommendations,
        submitted_by: user?.id || "unknown",
        submitted_at: new Date().toISOString(),
      });

      showToast("success", "Created", "Monthly report submitted successfully");
      onSuccess();
    } catch (err: any) {
      showToast("error", "Save Failed", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Monthly Report" size="lg">
      <div className="flex flex-col" style={{ height: "calc(90vh - 120px)" }}>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Report Month */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Report Month <span className="text-rose-500">*</span>
            </label>
            <input
              type="month"
              value={formData.report_month}
              onChange={(e) => setFormData({ ...formData, report_month: e.target.value })}
              className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed`}
            />
          </div>

          {/* Summary */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Executive Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
              className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed`}
              placeholder="Brief overview of the month's activities..."
            />
          </div>

          {/* Achievements */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Key Achievements
            </label>
            <textarea
              value={formData.achievements}
              onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
              rows={3}
              className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed`}
              placeholder="List key achievements this month..."
            />
          </div>

          {/* Issues */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Issues & Challenges
            </label>
            <textarea
              value={formData.issues}
              onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
              rows={3}
              className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed`}
              placeholder="Describe any issues encountered..."
            />
          </div>

          {/* Recommendations */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Recommendations
            </label>
            <textarea
              value={formData.recommendations}
              onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
              rows={3}
              className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed`}
              placeholder="Recommendations for next month..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex-shrink-0 px-6 py-4 border-t flex justify-end gap-2 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSaving ? "⏳ Submitting..." : "📊 Submit Report"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}