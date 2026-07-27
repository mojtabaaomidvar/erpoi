// src/features/inspection-management/ui/details/DocumentReviewSection.tsx

import { useState, useEffect, useMemo } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { getTodayJalali } from "@shared/utils/dateUtils";
import { documentReviewAppService } from "../../application/DocumentReviewApplicationService";
import type {
  DocumentReview,
  InspectionCategory,
} from "@/features/inspection-management/domain/types";
import {
  MWS_DOCUMENT_TYPE_CONFIG,
  TPI_DOCUMENT_TYPE_CONFIG,
} from "../../constants";

interface DocumentReviewSectionProps {
  requestId: string;
  category: InspectionCategory;
}

type UploadFileItem = {
  id: string;
  file: File;
  document_name: string;
  document_number: string;
  revision: string;
  document_type: string;
};

type UploadingFileItem = {
  id: string;
  file: File;
  document_name: string;
  document_number: string;
  revision: string;
  document_type: string;
  status: "uploading" | "success" | "failed";
  error?: string;
};

export function DocumentReviewSection({
  requestId,
  category,
}: DocumentReviewSectionProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const DOCUMENT_TYPE_CONFIG =
    category === "TPI" ? TPI_DOCUMENT_TYPE_CONFIG : MWS_DOCUMENT_TYPE_CONFIG;
  const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_CONFIG);

  const [documents, setDocuments] = useState<DocumentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showBulkVerifyModal, setShowBulkVerifyModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentReview | null>(null);

  const [uploadFiles, setUploadFiles] = useState<UploadFileItem[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFileItem[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkVerifyForm, setBulkVerifyForm] = useState({
    letter_number: "",
    verification_date: "",
  });
  const [verifyForm, setVerifyForm] = useState({
    letter_number: "",
    verification_date: "",
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(documents.map((d) => d.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const isAllSelected =
    documents.length > 0 && selectedIds.size === documents.length;
  const isSomeSelected =
    selectedIds.size > 0 && selectedIds.size < documents.length;

  const selectedDocs = useMemo(
    () => documents.filter((d) => selectedIds.has(d.id)),
    [documents, selectedIds],
  );
  const allSelectedAreVerified =
    selectedDocs.length > 0 && selectedDocs.every((d) => d.verified_by_ics);
  const hasMixedVerification =
    selectedDocs.some((d) => d.verified_by_ics) &&
    selectedDocs.some((d) => !d.verified_by_ics);

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
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newItems: UploadFileItem[] = Array.from(files).map((file) => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      document_name: file.name.replace(/\.[^/.]+$/, ""),
      document_number: "",
      revision: "",
      document_type: "OTHER",
    }));
    setUploadFiles((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const updateUploadFile = (
    id: string,
    field: keyof UploadFileItem,
    value: any,
  ) => {
    setUploadFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeUploadFile = (id: string) =>
    setUploadFiles((prev) => prev.filter((item) => item.id !== id));
  const clearUploadFiles = () => setUploadFiles([]);

  // ✅ آپلود از طریق Application Service
  const handleUpload = async () => {
    if (uploadFiles.length === 0)
      return showToast("error", "Error", "Please select at least one file");

    const backgroundFiles: UploadingFileItem[] = uploadFiles.map((item) => ({
      ...item,
      status: "uploading" as const,
    }));
    setUploadingFiles((prev) => [...prev, ...backgroundFiles]);
    setShowUploadModal(false);
    clearUploadFiles();
    showToast(
      "info",
      "Uploading",
      `${backgroundFiles.length} file(s) uploading in background...`,
    );

    try {
      const filePayloads = uploadFiles.map((f) => ({
        file: f.file,
        document_name: f.document_name,
        document_number: f.document_number,
        revision: f.revision,
        document_type: f.document_type,
      }));

      await documentReviewAppService.uploadDocuments(
        requestId,
        filePayloads,
        user?.id || "unknown",
      );

      setUploadingFiles((prev) =>
        prev.map((f) => ({ ...f, status: "success" })),
      );
      setTimeout(() => {
        setUploadingFiles([]);
        loadDocuments();
      }, 1500);
    } catch (err: any) {
      setUploadingFiles((prev) =>
        prev.map((f) => ({ ...f, status: "failed", error: err.message })),
      );
      showToast("error", "Upload Failed", err.message);
      setTimeout(() => setUploadingFiles([]), 5000);
    }
  };

  const handleBulkSubmit = async () => {
    if (hasMixedVerification) {
      showToast(
        "warning",
        "Mixed Selection",
        "Some selected documents are already approved by ICS and will be skipped.",
      );
    }
    const toSubmit = selectedDocs.filter((d) => d.review_status === "INITIAL");
    if (toSubmit.length === 0) {
      showToast(
        "info",
        "Skipped",
        "All selected documents are already submitted or processed.",
      );
      return;
    }
    showToast(
      "info",
      "Coming Soon",
      `Bulk submit for ${toSubmit.length} document(s) will be developed later.`,
    );
  };

  const handleVerifyClick = (doc: DocumentReview) => {
    setSelectedDoc(doc);
    setVerifyForm({
      letter_number: doc.verification_letter_number || "",
      verification_date: doc.verification_date || "",
    });
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async () => {
    if (!verifyForm.letter_number.trim() || !verifyForm.verification_date) {
      return showToast("error", "Error", "Letter number and date are required");
    }
    const previousDocuments = [...documents];
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === selectedDoc!.id
          ? {
              ...d,
              verified_by_ics: true,
              verification_letter_number: verifyForm.letter_number,
              verification_date: verifyForm.verification_date,
              verified_by: user?.id || "",
            }
          : d,
      ),
    );
    showToast("success", "Verifying", "Document verified by ICS");
    setShowVerifyModal(false);
    setSelectedDoc(null);

    try {
      await documentReviewAppService.verifyDocument(
        selectedDoc!.id,
        user?.id || "",
        verifyForm.letter_number,
        verifyForm.verification_date,
      );
    } catch (err: any) {
      setDocuments(previousDocuments);
      showToast("error", "Verification Failed", err.message);
    }
  };

  const handleUnverify = async (doc: DocumentReview) => {
    if (
      !(await confirmDialog({
        title: "Remove Verification",
        message: `Remove ICS verification from "${doc.document_name}"?`,
        confirmText: "Remove",
        variant: "danger",
      }))
    )
      return;

    const previousDocuments = [...documents];
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? {
              ...d,
              verified_by_ics: false,
              verification_letter_number: undefined,
              verification_date: undefined,
              verified_by: undefined,
            }
          : d,
      ),
    );
    showToast("success", "Removing", "Verification removed");

    try {
      await documentReviewAppService.unverifyDocument(doc.id);
    } catch (err: any) {
      setDocuments(previousDocuments);
      showToast("error", "Failed", err.message);
    }
  };

  // ✅ حذف از طریق Application Service
  const handleDelete = async (doc: DocumentReview) => {
    if (
      !(await confirmDialog({
        title: "Delete Document",
        message: `Delete "${doc.document_name}" from storage and database?`,
        confirmText: "Delete",
        variant: "danger",
      }))
    )
      return;

    const previousDocuments = [...documents];
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    showToast("success", "Deleting", "Document removed");

    try {
      await documentReviewAppService.deleteDocument(doc.id, doc.document_url);
    } catch (err: any) {
      setDocuments(previousDocuments);
      showToast("error", "Delete Failed", err.message);
    }
  };

  // ✅ حذف دسته‌جمعی از طریق Application Service
  const handleBulkDelete = async () => {
    if (
      !(await confirmDialog({
        title: "Bulk Delete",
        message: `Delete ${selectedIds.size} document(s)?`,
        confirmText: "Delete All",
        variant: "danger",
      }))
    )
      return;

    const previousDocuments = [...documents];
    const docsToDelete = documents.filter((d) => selectedIds.has(d.id));

    setDocuments((prev) => prev.filter((d) => !selectedIds.has(d.id)));
    showToast(
      "success",
      "Deleting",
      `${docsToDelete.length} document(s) removed`,
    );
    deselectAll();

    try {
      const payloads = docsToDelete.map((d) => ({
        id: d.id,
        fileUrl: d.document_url,
      }));
      await documentReviewAppService.bulkDeleteDocuments(payloads);
    } catch (err: any) {
      setDocuments(previousDocuments);
      showToast("error", "Delete Failed", err.message);
    }
  };

  const handleBulkVerifySubmit = async () => {
    if (
      !bulkVerifyForm.letter_number.trim() ||
      !bulkVerifyForm.verification_date
    ) {
      return showToast("error", "Error", "Letter number and date are required");
    }
    if (hasMixedVerification) {
      showToast(
        "warning",
        "Mixed Selection",
        "Some selected documents are already approved by ICS and will be skipped.",
      );
    }

    const toVerify = selectedDocs.filter((d) => !d.verified_by_ics);
    if (toVerify.length === 0) {
      showToast(
        "info",
        "Skipped",
        "All selected documents are already verified by ICS.",
      );
      setShowBulkVerifyModal(false);
      deselectAll();
      return;
    }

    const previousDocuments = [...documents];
    setDocuments((prev) =>
      prev.map((d) =>
        toVerify.some((v) => v.id === d.id)
          ? {
              ...d,
              verified_by_ics: true,
              verification_letter_number: bulkVerifyForm.letter_number,
              verification_date: bulkVerifyForm.verification_date,
              verified_by: user?.id || "",
            }
          : d,
      ),
    );
    showToast(
      "success",
      "Verifying",
      `${toVerify.length} document(s) verified by ICS`,
    );
    setShowBulkVerifyModal(false);
    deselectAll();

    try {
      for (const doc of toVerify) {
        await documentReviewAppService.verifyDocument(
          doc.id,
          user?.id || "",
          bulkVerifyForm.letter_number,
          bulkVerifyForm.verification_date,
        );
      }
    } catch (err: any) {
      setDocuments(previousDocuments);
      showToast("error", "Verification Failed", err.message);
    }
  };

  const getTypeConfig = (type: string) =>
    DOCUMENT_TYPE_CONFIG[type as keyof typeof DOCUMENT_TYPE_CONFIG] || {
      label: type,
      icon: "📄",
    };

  return (
    <div className="space-y-3">
      {/* Header & Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="select-all-docs"
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isSomeSelected;
            }}
            onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
            disabled={documents.length === 0}
            className="w-4 h-4 rounded cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Total Documents ({documents.length})
            </span>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-300 dark:border-slate-700">
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mr-1">
                {selectedIds.size} selected
              </span>
              {allSelectedAreVerified ? (
                <div className="px-2 py-1 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-1 cursor-default">
                  ✓ ICS Approved
                </div>
              ) : (
                <>
                  <button
                    onClick={handleBulkSubmit}
                    className="px-2 py-1 rounded text-[11px] font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 transition-colors"
                    title="Submit selected"
                  >
                    📤 Submit
                  </button>
                  <button
                    onClick={() => {
                      if (hasMixedVerification)
                        showToast(
                          "warning",
                          "Mixed Selection",
                          "Some selected documents are already approved by ICS.",
                        );
                      setShowBulkVerifyModal(true);
                    }}
                    className="px-2 py-1 rounded text-[11px] font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 transition-colors"
                    title="Verify selected"
                  >
                    ✓ {selectedIds.size > 1 ? "Have" : "Has"} ICS Approved?
                  </button>
                </>
              )}
              <button
                onClick={handleBulkDelete}
                className="px-2 py-1 rounded text-[11px] font-medium bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 transition-colors"
                title="Delete selected"
              >
                🗑️ Delete
              </button>
              <button
                onClick={deselectAll}
                className="px-2 py-1 rounded text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                title="Clear selection"
              >
                ✕ Clear
              </button>
            </div>
          )}
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
          <div className="text-2xl mb-2 animate-pulse">⏳</div>
          <p
            className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Loading...
          </p>
        </div>
      ) : documents.length === 0 && uploadingFiles.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📄</div>
          <p
            className={`text-xs font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No documents uploaded
          </p>
          <p
            className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Upload{" "}
            {category === "TPI"
              ? "ITP, procedures, or certificates"
              : "MWS plans, vessel certificates, or procedures"}{" "}
            to start
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {uploadingFiles.map((item) => {
            const typeConfig = getTypeConfig(item.document_type);
            return (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all ${item.status === "uploading" ? (isDark ? "bg-indigo-900/10 border-indigo-700" : "bg-indigo-50 border-indigo-300") : item.status === "failed" ? (isDark ? "bg-rose-900/10 border-rose-700" : "bg-rose-50 border-rose-300") : isDark ? "bg-emerald-900/10 border-emerald-700" : "bg-emerald-50 border-emerald-300"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center text-base shrink-0 ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                  >
                    {item.status === "uploading" ? (
                      <span className="animate-spin">⏳</span>
                    ) : item.status === "failed" ? (
                      "❌"
                    ) : (
                      "✅"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4
                        className={`text-xs font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        {item.document_name || item.file.name}
                      </h4>
                      <Badge
                        tone={
                          item.status === "failed"
                            ? "danger"
                            : item.status === "uploading"
                              ? "indigo"
                              : "emerald"
                        }
                        className="text-[10px]"
                      >
                        {item.status === "uploading"
                          ? "Uploading..."
                          : item.status === "failed"
                            ? "Failed"
                            : "Uploaded"}
                      </Badge>
                    </div>
                    <div
                      className={`flex items-center gap-2 text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      <span>{typeConfig.label}</span>
                      {item.revision && <span>Rev {item.revision}</span>}
                      <span>{(item.file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    {item.status === "failed" && item.error && (
                      <p className="text-[10px] text-rose-600 mt-1">
                        ⚠️ {item.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {documents.map((doc) => {
            const typeConfig = getTypeConfig(doc.document_type);
            return (
              <div
                key={doc.id}
                className={`p-3 rounded-lg border transition-all ${selectedIds.has(doc.id) ? (isDark ? "bg-indigo-900/10 border-indigo-600 ring-1 ring-indigo-500/30" : "bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300/50") : doc.verified_by_ics ? (isDark ? "bg-emerald-900/10 border-emerald-700" : "bg-emerald-50 border-emerald-300") : isDark ? "bg-slate-800/50 border-slate-700 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(doc.id)}
                    onChange={() => toggleSelect(doc.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-3 h-3 rounded cursor-pointer accent-indigo-600 shrink-0"
                  />
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center text-base shrink-0 ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                  >
                    {typeConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4
                        className={`text-xs font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        {doc.document_name}
                      </h4>
                      {!doc.verified_by_ics &&
                        doc.review_status === "INITIAL" && (
                          <Badge tone="slate" className="text-[9px]">
                            📝 Initial
                          </Badge>
                        )}
                      {doc.verified_by_ics && (
                        <Badge tone="emerald" className="text-[11px]">
                          ✓ Approved by ICS According to{" "}
                          {doc.verification_letter_number} on{" "}
                          {doc.verification_date}
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`flex items-center gap-2 text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      <span>{typeConfig.label}</span>
                      {doc.document_number && (
                        <span>#{doc.document_number}</span>
                      )}
                      {doc.revision && <span>Rev {doc.revision}</span>}
                      <span>
                        📅{" "}
                        {new Date(doc.created_at).toLocaleDateString(
                          "fa-IR-u-nu-latn",
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded text-xs transition-colors ${isDark ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                      title="View"
                    >
                      👁️ Download
                    </a>
                    {!doc.verified_by_ics &&
                      doc.review_status === "INITIAL" && (
                        <button
                          onClick={() =>
                            showToast(
                              "info",
                              "Coming Soon",
                              "Single submit will be developed later",
                            )
                          }
                          className={`p-1.5 rounded text-xs transition-colors ${isDark ? "bg-amber-900/30 text-amber-300 hover:bg-amber-900/50" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                          title="Submit"
                        >
                          📤 Submit
                        </button>
                      )}
                    {doc.verified_by_ics ? (
                      <button
                        onClick={() => handleUnverify(doc)}
                        className="p-1.5 rounded text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        title="Remove Verification"
                      >
                        ✓ ICS Approved
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerifyClick(doc)}
                        className={`p-1.5 rounded text-xs transition-colors ${isDark ? "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                        title="Verify"
                      >
                        ✓ has ICS Approval?
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(doc)}
                      className={`p-1.5 rounded text-xs transition-colors ${isDark ? "bg-rose-900/30 text-rose-300 hover:bg-rose-900/50" : "bg-rose-50 text-rose-600 hover:bg-rose-100"}`}
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
            className={`w-full max-w-2xl rounded-xl shadow-2xl flex flex-col ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white"}`}
            style={{ maxHeight: "85vh" }}
          >
            <div
              className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <div>
                <h3
                  className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  📤 Upload Documents
                </h3>
                <p
                  className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Select multiple files and configure details
                </p>
              </div>
              {uploadFiles.length > 0 && (
                <Badge tone="indigo" className="text-[10px]">
                  {uploadFiles.length} file(s)
                </Badge>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <label
                className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all ${uploadFiles.length > 0 ? (isDark ? "border-slate-600 bg-slate-800/30 hover:border-indigo-500" : "border-slate-300 bg-slate-50 hover:border-indigo-400") : isDark ? "border-slate-600 bg-slate-800/50 hover:border-indigo-500" : "border-slate-300 bg-slate-50 hover:border-indigo-400"}`}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="text-2xl mb-1">
                    {uploadFiles.length > 0 ? "➕" : "📂"}
                  </div>
                  <p
                    className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    {uploadFiles.length > 0
                      ? "Add more files"
                      : "Click to browse files"}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  onChange={handleFileChange}
                />
              </label>
              {uploadFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadFiles.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200 shadow-sm"}`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center text-sm shrink-0 ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                          >
                            📎
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                            >
                              {item.file.name}
                            </p>
                            <p
                              className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {(item.file.size / 1024).toFixed(1)} KB • File{" "}
                              {index + 1}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeUploadFile(item.id)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${isDark ? "bg-rose-900/30 text-rose-300 hover:bg-rose-900/50" : "bg-rose-50 text-rose-600 hover:bg-rose-100"}`}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={item.document_type}
                          onChange={(e) =>
                            updateUploadFile(
                              item.id,
                              "document_type",
                              e.target.value,
                            )
                          }
                          className="col-span-2 rounded px-2 py-1.5 text-xs input-themed"
                        >
                          {DOCUMENT_TYPES.map((type) => {
                            const config = getTypeConfig(type);
                            return (
                              <option key={type} value={type}>
                                {config.icon} {config.label}
                              </option>
                            );
                          })}
                        </select>
                        <input
                          type="text"
                          value={item.document_name}
                          onChange={(e) =>
                            updateUploadFile(
                              item.id,
                              "document_name",
                              e.target.value,
                            )
                          }
                          className="rounded px-2 py-1.5 text-xs input-themed"
                          placeholder="Document Name"
                        />
                        <input
                          type="text"
                          value={item.document_number}
                          onChange={(e) =>
                            updateUploadFile(
                              item.id,
                              "document_number",
                              e.target.value,
                            )
                          }
                          className="rounded px-2 py-1.5 text-xs input-themed"
                          placeholder="Code (Opt)"
                        />
                        <input
                          type="text"
                          value={item.revision}
                          onChange={(e) =>
                            updateUploadFile(
                              item.id,
                              "revision",
                              e.target.value,
                            )
                          }
                          className="col-span-2 rounded px-2 py-1.5 text-xs input-themed"
                          placeholder="Revision (Opt)"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              className={`px-5 py-3 border-t flex items-center justify-between shrink-0 ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              {uploadFiles.length > 0 && (
                <button
                  onClick={clearUploadFiles}
                  className={`text-xs font-medium ${isDark ? "text-slate-400 hover:text-rose-400" : "text-slate-500 hover:text-rose-600"}`}
                >
                  🗑️ Clear all
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUploadModal(false);
                    clearUploadFiles();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploadFiles.length === 0}
                >
                  📤 Upload ({uploadFiles.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Verify Modal */}
      {showVerifyModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-md rounded-xl shadow-2xl ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white"}`}
          >
            <div
              className={`px-5 py-3 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <h3
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                ✓ Verify Document by ICS
              </h3>
              <p
                className={`text-xs mt-1 truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {selectedDoc.document_name}
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Verification Letter Number *
                </label>
                <input
                  type="text"
                  value={verifyForm.letter_number}
                  onChange={(e) =>
                    setVerifyForm({
                      ...verifyForm,
                      letter_number: e.target.value,
                    })
                  }
                  className="w-full rounded px-3 py-2 text-sm input-themed"
                  placeholder="e.g., ICS-VER-2024-001"
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Verification Date *
                </label>
                <JalaaliDatePicker
                  value={verifyForm.verification_date}
                  onChange={(date) =>
                    setVerifyForm({ ...verifyForm, verification_date: date })
                  }
                  placeholder="Select date"
                />
              </div>
            </div>
            <div
              className={`px-5 py-3 border-t flex justify-end gap-2 ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedDoc(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleVerifySubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                ✓ Verify
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Verify Modal */}
      {showBulkVerifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-md rounded-xl shadow-2xl ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white"}`}
          >
            <div
              className={`px-5 py-3 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <h3
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                ✓ Bulk Verify by ICS
              </h3>
              <p
                className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Total: <strong>{selectedIds.size} document(s)</strong>
              </p>
            </div>
            <div className="p-5 space-y-4">
              {selectedDocs.some((d) => d.verified_by_ics) && (
                <div
                  className={`p-3 rounded-lg border ${isDark ? "bg-emerald-900/10 border-emerald-800/30" : "bg-emerald-50 border-emerald-200"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✅</span>
                    <h4
                      className={`text-xs font-bold uppercase ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                    >
                      Already Approved by ICS (
                      {selectedDocs.filter((d) => d.verified_by_ics).length})
                    </h4>
                  </div>
                  <div
                    className={`max-h-20 overflow-y-auto space-y-1 ${isDark ? "scrollbar-thin scrollbar-thumb-emerald-700" : "scrollbar-thin scrollbar-thumb-emerald-300"}`}
                  >
                    {selectedDocs
                      .filter((d) => d.verified_by_ics)
                      .map((d) => (
                        <div
                          key={d.id}
                          className={`text-[10px] flex items-center gap-2 truncate ${isDark ? "text-emerald-200" : "text-emerald-800"}`}
                        >
                          <span>✓</span>
                          <span className="truncate font-medium">
                            {d.document_name}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {selectedDocs.some((d) => !d.verified_by_ics) && (
                <div
                  className={`p-3 rounded-lg border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⏳</span>
                    <h4
                      className={`text-xs font-bold uppercase ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Pending for Approval (
                      {selectedDocs.filter((d) => !d.verified_by_ics).length})
                    </h4>
                  </div>
                  <div
                    className={`max-h-20 overflow-y-auto space-y-1 mb-3 ${isDark ? "scrollbar-thin scrollbar-thumb-slate-600" : "scrollbar-thin scrollbar-thumb-slate-300"}`}
                  >
                    {selectedDocs
                      .filter((d) => !d.verified_by_ics)
                      .map((d) => {
                        const config = getTypeConfig(d.document_type);
                        return (
                          <div
                            key={d.id}
                            className={`text-[10px] flex items-center gap-2 truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            <span>{config.icon}</span>
                            <span className="truncate">{d.document_name}</span>
                          </div>
                        );
                      })}
                  </div>
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        Approval Document (letter, N.O.D.A, ...) Number *
                      </label>
                      <input
                        type="text"
                        value={bulkVerifyForm.letter_number}
                        onChange={(e) =>
                          setBulkVerifyForm({
                            ...bulkVerifyForm,
                            letter_number: e.target.value,
                          })
                        }
                        className="w-full rounded px-3 py-2 text-sm input-themed"
                        placeholder="e.g., ICS-VER-2024-001"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        Date *
                      </label>
                      <JalaaliDatePicker
                        value={bulkVerifyForm.verification_date}
                        onChange={(date) =>
                          setBulkVerifyForm({
                            ...bulkVerifyForm,
                            verification_date: date,
                          })
                        }
                        placeholder="Select date"
                        maxDate={getTodayJalali()}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div
              className={`px-5 py-3 border-t flex justify-end gap-2 ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBulkVerifyModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkVerifySubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!selectedDocs.some((d) => !d.verified_by_ics)}
              >
                ✓ Approve{" "}
                {selectedDocs.filter((d) => !d.verified_by_ics).length}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
