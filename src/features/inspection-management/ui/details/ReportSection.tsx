// src/features/inspection-management/ui/details/ReportSection.tsx

import { useState, useEffect } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { reportAppService } from "../../application/ReportApplicationService";
import { inspectionAppService } from "../../application";
import type {
  InspectionReport,
  ReportType,
  Inspection,
} from "@/features/inspection-management/domain/types";
import { REPORT_TYPE_CONFIG } from "../../constants";

interface ReportSectionProps {
  requestId: string;
}

const REPORT_TYPES: ReportType[] = ["IR", "IRN", "SRN"];

export function ReportSection({ requestId }: ReportSectionProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>("");
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    report_type: "IR" as ReportType,
    file: null as File | null,
  });

  const loadInspections = async () => {
    setLoading(true);
    try {
      const data = await inspectionAppService.getByInspectionRequest(requestId);
      setInspections(data);
      if (data.length > 0) setSelectedInspectionId(data[0].id);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async (inspectionId: string) => {
    try {
      const data = await reportAppService.getByInspection(inspectionId);
      setReports(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    }
  };

  useEffect(() => {
    loadInspections();
  }, [requestId]);

  useEffect(() => {
    if (selectedInspectionId) {
      loadReports(selectedInspectionId);
    }
  }, [selectedInspectionId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      showToast("error", "Error", "Please select a file");
      return;
    }

    setUploading(true);
    try {
      await reportAppService.uploadReport({
        inspection_id: selectedInspectionId,
        report_type: uploadForm.report_type,
        report_url: uploadForm.file
          ? URL.createObjectURL(uploadForm.file)
          : "pending_upload",
        issued_by: user?.id || "",
        issued_at: new Date().toISOString().split("T")[0],
        sent_to_client: false,
      });
      showToast("success", "Uploaded", "Report uploaded successfully");
      setShowUploadModal(false);
      setUploadForm({ report_type: "IR", file: null });
      await loadReports(selectedInspectionId);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSendToClient = async (report: InspectionReport) => {
    const confirmed = await confirmDialog({
      title: "Send to Client",
      message: `Send report ${report.report_number} to client?`,
      confirmText: "Send",
      cancelText: "Cancel",
      variant: "info",
    });
    if (!confirmed) return;

    try {
      await reportAppService.sendToClient(report.id);
      showToast("success", "Sent", "Report sent to client");
      await loadReports(selectedInspectionId);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    }
  };

  const handleDelete = async (reportId: string) => {
    const confirmed = await confirmDialog({
      title: "Delete Report",
      message: "Are you sure you want to delete this report?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await reportAppService.delete(reportId);
      showToast("success", "Deleted", "Report removed");
      await loadReports(selectedInspectionId);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    }
  };

  const stats = {
    total: reports.length,
    ir: reports.filter((r) => r.report_type === "IR").length,
    irn: reports.filter((r) => r.report_type === "IRN").length,
    srn: reports.filter((r) => r.report_type === "SRN").length,
    sent: reports.filter((r) => r.sent_to_client).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={selectedInspectionId}
            onChange={(e) => setSelectedInspectionId(e.target.value)}
            className={`rounded-lg px-3 py-2 text-sm input-themed max-w-xs`}
          >
            {inspections.length === 0 ? (
              <option value="">No inspections available</option>
            ) : (
              inspections.map((insp) => (
                <option key={insp.id} value={insp.id}>
                  Inspection {insp.id.slice(-6)}
                </option>
              ))
            )}
          </select>
          <Badge tone="slate" className="text-[10px]">
            📊 {stats.total} Total
          </Badge>
          <Badge tone="indigo" className="text-[10px]">
            {" "}
            {stats.ir} IR
          </Badge>
          <Badge tone="amber" className="text-[10px]">
            ⚠️ {stats.irn} IRN
          </Badge>
          <Badge tone="emerald" className="text-[10px]">
            ✅ {stats.sent} Sent
          </Badge>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowUploadModal(true)}
          disabled={!selectedInspectionId}
        >
          📤 Upload Report
        </Button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2 animate-pulse">⏳</div>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Loading...
          </p>
        </div>
      ) : !selectedInspectionId ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📊</div>
          <p
            className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No inspection selected
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📊</div>
          <p
            className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No reports generated
          </p>
          <p
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Upload inspection reports (IR, IRN, SRN)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => {
            const typeConfig = REPORT_TYPE_CONFIG[report.report_type];

            return (
              <div
                key={report.id}
                className={`p-4 rounded-xl border ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                        isDark ? "bg-indigo-900/30" : "bg-indigo-100"
                      }`}
                    >
                      📊
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {report.report_number}
                        </span>
                        <Badge tone="indigo" className="text-[9px]">
                          {typeConfig.label}
                        </Badge>
                        {report.sent_to_client && (
                          <Badge tone="emerald" className="text-[9px]">
                            ✅ Sent to Client
                          </Badge>
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-3 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        <span>
                          📅 {new Date(report.issued_at).toLocaleDateString()}
                        </span>
                        {report.approved_at && (
                          <span>
                            ✓ Approved{" "}
                            {new Date(report.approved_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={report.report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                        isDark
                          ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      title="View"
                    >
                      👁️
                    </a>
                    {!report.sent_to_client && (
                      <button
                        onClick={() => handleSendToClient(report)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                        title="Send to Client"
                      >
                        📤
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(report.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                        isDark
                          ? "bg-rose-900/30 text-rose-300 hover:bg-rose-900/50"
                          : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                      }`}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl ${
              isDark ? "bg-slate-900 border border-slate-700" : "bg-white"
            }`}
          >
            <div
              className={`px-6 py-4 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <h3
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                📤 Upload Report
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Report Type *
                </label>
                <div className="flex gap-2">
                  {REPORT_TYPES.map((type) => {
                    const config = REPORT_TYPE_CONFIG[type];
                    const isSelected = uploadForm.report_type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setUploadForm({ ...uploadForm, report_type: type })
                        }
                        className={`flex-1 py-3 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : isDark
                              ? "bg-slate-800 border-slate-700 text-slate-400"
                              : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <div className="text-lg mb-1">
                          {type === "IR" ? "📄" : type === "IRN" ? "⚠️" : ""}
                        </div>
                        <div>{config.label}</div>
                        <div
                          className={`text-[9px] mt-0.5 ${isSelected ? "text-indigo-200" : isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {config.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Report File (PDF) *
                </label>
                <label
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
                    uploadForm.file
                      ? isDark
                        ? "border-emerald-600 bg-emerald-900/20"
                        : "border-emerald-400 bg-emerald-50"
                      : isDark
                        ? "border-slate-600 bg-slate-800/50 hover:border-indigo-500"
                        : "border-slate-300 bg-slate-50 hover:border-indigo-400"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadForm.file ? (
                      <>
                        <div className="text-2xl mb-1">📎</div>
                        <p
                          className={`text-xs font-medium ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                        >
                          {uploadForm.file.name}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl mb-1">📄</div>
                        <p
                          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Click to upload PDF
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
            <div
              className={`px-6 py-4 border-t flex justify-end gap-2 ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <Button
                variant="ghost"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={uploading || !uploadForm.file}
              >
                {uploading ? "⏳ Uploading..." : "📤 Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
