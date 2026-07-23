// src/features/inspection-management/ui/details/DocumentReviewSection.tsx

import { useState, useEffect } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { documentReviewAppService } from "../../application/DocumentReviewApplicationService";

import type {
  DocumentReview,
  DocumentType,
  ReviewStatus,
} from "@/features/inspection-management/domain/types";
import { DOCUMENT_TYPE_CONFIG, REVIEW_STATUS_CONFIG } from "../../constants";

interface DocumentReviewSectionProps {
  requestId: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  "ITP",
  "PROCEDURE",
  "CERTIFICATE",
  "DRAWING",
  "OTHER",
];

export function DocumentReviewSection({
  requestId,
}: DocumentReviewSectionProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    document_type: "ITP" as DocumentType,
    document_name: "",
    document_number: "",
    revision: "",
    file: null as File | null,
  });

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data =
        await documentReviewAppService.getByInspectionRequest(requestId);
      setDocuments(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [requestId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file,
        document_name: file.name,
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      showToast("error", "Error", "Please select a file");
      return;
    }
    if (!uploadForm.document_name.trim()) {
      showToast("error", "Error", "Document name is required");
      return;
    }

    setUploading(true);
    try {
      await documentReviewAppService.uploadDocument({
        inspection_request_id: requestId,
        document_type: uploadForm.document_type,
        document_name: uploadForm.file?.name || "Uploaded Document",
        document_url: uploadForm.file
          ? URL.createObjectURL(uploadForm.file)
          : "pending_upload",
        document_number: uploadForm.document_number || undefined,
        revision: uploadForm.revision || undefined,
      });
      showToast("success", "Uploaded", "Document uploaded successfully");
      setShowUploadModal(false);
      setUploadForm({
        document_type: "ITP",
        document_name: "",
        document_number: "",
        revision: "",
        file: null,
      });
      await loadDocuments();
    } catch (err: any) {
      showToast("error", "Upload Failed", err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (
    doc: DocumentReview,
    newStatus: ReviewStatus,
  ) => {
    if (newStatus === "REJECTED" || newStatus === "COMMENTED") {
      const comments = prompt("Please enter your comments:");
      if (!comments) return;
      try {
        if (newStatus === "REJECTED") {
          await documentReviewAppService.rejectDocument(
            doc.id,
            user?.id || "",
            comments,
          );
        } else {
          await documentReviewAppService.commentDocument(
            doc.id,
            user?.id || "",
            comments,
          );
        }
        showToast("success", "Updated", `Document ${newStatus.toLowerCase()}`);
        await loadDocuments();
      } catch (err: any) {
        showToast("error", "Failed", err.message);
      }
    } else if (newStatus === "APPROVED") {
      const confirmed = await confirmDialog({
        title: "Approve Document",
        message: `Are you sure you want to approve "${doc.document_name}"?`,
        confirmText: "Approve",
        cancelText: "Cancel",
        variant: "info",
      });
      if (!confirmed) return;
      try {
        await documentReviewAppService.approveDocument(doc.id, user?.id || "");
        showToast("success", "Approved", "Document approved");
        await loadDocuments();
      } catch (err: any) {
        showToast("error", "Failed", err.message);
      }
    }
  };

  const handleDelete = async (doc: DocumentReview) => {
    const confirmed = await confirmDialog({
      title: "Delete Document",
      message: `Are you sure you want to delete "${doc.document_name}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await documentReviewAppService.delete(doc.document_url);
      await documentReviewAppService.delete(doc.id);
      showToast("success", "Deleted", "Document removed");
      await loadDocuments();
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    }
  };

  const pendingCount = documents.filter(
    (d) => d.review_status === "PENDING",
  ).length;
  const approvedCount = documents.filter(
    (d) => d.review_status === "APPROVED",
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Documents ({documents.length})
          </div>
          <Badge tone="amber" className="text-[10px]">
            ⏳ {pendingCount} Pending
          </Badge>
          <Badge tone="emerald" className="text-[10px]">
            ✅ {approvedCount} Approved
          </Badge>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowUploadModal(true)}
        >
          📤 Upload Document
        </Button>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2 animate-pulse">⏳</div>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Loading...
          </p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📄</div>
          <p
            className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No documents uploaded
          </p>
          <p
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Upload ITP, procedures, or certificates to start the review process
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const typeConfig = DOCUMENT_TYPE_CONFIG[doc.document_type];
            const statusConfig = REVIEW_STATUS_CONFIG[doc.review_status];

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${
                        isDark ? "bg-slate-700" : "bg-slate-100"
                      }`}
                    >
                      {typeConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`text-sm font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                        >
                          {doc.document_name}
                        </h4>
                        <Badge
                          tone={statusConfig.color as any}
                          className="text-[9px]"
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </Badge>
                      </div>
                      <div
                        className={`flex items-center gap-3 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        <span>{typeConfig.label}</span>
                        {doc.document_number && (
                          <span>#{doc.document_number}</span>
                        )}
                        {doc.revision && <span>Rev {doc.revision}</span>}
                        <span>
                          📅 {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.comments && (
                        <p
                          className={`text-[11px] mt-2 p-2 rounded ${
                            isDark
                              ? "bg-slate-900/50 text-slate-300"
                              : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          💬 {doc.comments}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isDark
                          ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                      title="View"
                    >
                      👁️
                    </a>
                    {doc.review_status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(doc, "APPROVED")}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                          title="Approve"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleStatusChange(doc, "COMMENTED")}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
                          title="Comment"
                        >
                          💬
                        </button>
                        <button
                          onClick={() => handleStatusChange(doc, "REJECTED")}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-all"
                          title="Reject"
                        >
                          ✕
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(doc)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isDark
                          ? "bg-rose-900/30 text-rose-300 hover:bg-rose-900/50"
                          : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                      }`}
                      title="Delete"
                    >
                      ️
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
                📤 Upload Document
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Document Type *
                </label>
                <select
                  value={uploadForm.document_type}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      document_type: e.target.value as DocumentType,
                    })
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {DOCUMENT_TYPE_CONFIG[type].icon}{" "}
                      {DOCUMENT_TYPE_CONFIG[type].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Document Name *
                </label>
                <input
                  type="text"
                  value={uploadForm.document_name}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      document_name: e.target.value,
                    })
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                  placeholder="e.g., ITP for Welding"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Document Number
                  </label>
                  <input
                    type="text"
                    value={uploadForm.document_number}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        document_number: e.target.value,
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                    placeholder="e.g., DOC-001"
                  />
                </div>
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Revision
                  </label>
                  <input
                    type="text"
                    value={uploadForm.revision}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, revision: e.target.value })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                    placeholder="e.g., Rev A"
                  />
                </div>
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  File *
                </label>
                <label
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
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
                        <p
                          className={`text-[10px] ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                        >
                          {(uploadForm.file.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl mb-1"></div>
                        <p
                          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Click to upload PDF or Word
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
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
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadForm({
                    document_type: "ITP",
                    document_name: "",
                    document_number: "",
                    revision: "",
                    file: null,
                  });
                }}
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
