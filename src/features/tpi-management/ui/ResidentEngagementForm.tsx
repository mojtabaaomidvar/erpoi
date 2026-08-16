// src/features/tpi-management/ui/ResidentEngagementForm.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@design-system";
import { FileText, Trash2, Upload } from "lucide-react";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { Modal } from "@shared/ui/Modal";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { compareJalaliDates } from "@shared/utils/dateUtils";
import { userAppService, type User } from "@shared/authorization";
import { tpiEngagementAppService } from "../application";
import { projectAppService, type Project } from "@/features/project-management";
import type { ResidentEngagement } from "../domain/models/ResidentEngagement";

export interface ResidentDocumentUpload {
  file: File;
  document_name: string;
}

interface ResidentEngagementFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  clientId?: string;
  contractId?: string;
  department?: string;
  onSuccess: () => void | Promise<void>;
  onUploadDocuments: (
    engagementId: string,
    documents: readonly ResidentDocumentUpload[],
  ) => Promise<void>;
  initialData?: ResidentEngagement | null;
}

interface ResidentFormData {
  siteRepresentativeId: string;
  plannedStartDate: string;
  plannedEndDate: string;
}

interface PendingResidentDocument {
  id: string;
  file: File;
  displayName: string;
}

type FormErrors = Partial<
  Record<
    | "projectId"
    | "siteRepresentativeId"
    | "plannedStartDate"
    | "plannedEndDate",
    string
  >
>;

const EMPTY_FORM: ResidentFormData = {
  siteRepresentativeId: "",
  plannedStartDate: "",
  plannedEndDate: "",
};

const normalizeDate = (value?: string | null) =>
  value ? value.replace(/-/g, "/") : "";

const getUserLabel = (candidate: User) =>
  candidate.fullName?.trim() || candidate.username || candidate.email;

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1.5 text-[11px] text-rose-600">{message}</p>
  ) : null;
}

export function ResidentEngagementForm({
  isOpen,
  onClose,
  projectId,
  clientId,
  contractId,
  department,
  onSuccess,
  onUploadDocuments,
  initialData,
}: ResidentEngagementFormProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [siteRepresentatives, setSiteRepresentatives] = useState<User[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [formData, setFormData] = useState<ResidentFormData>(EMPTY_FORM);
  const [pendingDocuments, setPendingDocuments] = useState<
    PendingResidentDocument[]
  >([]);
  const [isDocumentReviewOpen, setIsDocumentReviewOpen] = useState(false);
  const [areDocumentsFinalized, setAreDocumentsFinalized] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadError, setLoadError] = useState("");
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isStartDateDirty, setIsStartDateDirty] = useState(false);
  const [isEndDateDirty, setIsEndDateDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const initialProjectId = initialData?.project_id || projectId || "";
    setSelectedProjectId(initialProjectId);
    setFormData({
      siteRepresentativeId: initialData?.site_representative_id || "",
      plannedStartDate: normalizeDate(initialData?.planned_start_date),
      plannedEndDate: normalizeDate(initialData?.planned_end_date),
    });
    setPendingDocuments([]);
    setIsDocumentReviewOpen(false);
    setAreDocumentsFinalized(true);
    setErrors({});
    setLoadError("");
    setIsStartDateDirty(Boolean(initialData));
    setIsEndDateDirty(Boolean(initialData));

    let cancelled = false;
    setIsLoadingInitialData(true);
    Promise.all([
      projectAppService.getAllProjects(),
      userAppService.getAllUsers(),
    ])
      .then(([loadedProjects, loadedUsers]) => {
        if (cancelled) return;
        setProjects(loadedProjects);
        setSiteRepresentatives(
          loadedUsers.filter(
            (candidate) =>
              candidate.id === initialData?.site_representative_id ||
              (candidate.status !== "inactive" &&
                candidate.status !== "suspended"),
          ),
        );
        if (!initialData && initialProjectId) {
          const project = loadedProjects.find(
            (candidate) => candidate.id === initialProjectId,
          );
          setFormData((current) => ({
            ...current,
            plannedStartDate: normalizeDate(project?.start_date),
            plannedEndDate: normalizeDate(project?.end_date),
          }));
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Could not load Resident form data";
        setLoadError(message);
        showToast("error", "Load Failed", message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingInitialData(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialData, isOpen, projectId]);

  const availableProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (project.id === selectedProjectId) return true;
        return (
          project.status?.toUpperCase() === "ACTIVE" &&
          project.service_types?.some(
            (service) => service.toUpperCase() === "TPI",
          )
        );
      }),
    [projects, selectedProjectId],
  );

  const clearError = (field: keyof FormErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleProjectChange = (nextProjectId: string) => {
    const project = projects.find(
      (candidate) => candidate.id === nextProjectId,
    );
    setSelectedProjectId(nextProjectId);
    clearError("projectId");
    clearError("plannedStartDate");
    clearError("plannedEndDate");
    // A date follows project defaults only until the user edits that date.
    setFormData((current) => ({
      ...current,
      plannedStartDate: isStartDateDirty
        ? current.plannedStartDate
        : normalizeDate(project?.start_date),
      plannedEndDate: isEndDateDirty
        ? current.plannedEndDate
        : normalizeDate(project?.end_date),
    }));
  };

  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;

    const selectedAt = Date.now();
    setPendingDocuments((current) => [
      ...current,
      ...files.map((file, index) => ({
        id: `resident_doc_${selectedAt}_${index}_${Math.random().toString(36).slice(2, 8)}`,
        file,
        displayName: file.name,
      })),
    ]);
    setAreDocumentsFinalized(false);
    setIsDocumentReviewOpen(true);
  };

  const updateDocumentName = (id: string, displayName: string) => {
    setAreDocumentsFinalized(false);
    setPendingDocuments((current) =>
      current.map((document) =>
        document.id === id ? { ...document, displayName } : document,
      ),
    );
  };

  const removeDocument = (id: string) => {
    setAreDocumentsFinalized(false);
    setPendingDocuments((current) =>
      current.filter((document) => document.id !== id),
    );
  };

  const finalizeDocuments = () => {
    if (pendingDocuments.some((document) => !document.displayName.trim())) {
      return;
    }
    setAreDocumentsFinalized(true);
    setIsDocumentReviewOpen(false);
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!selectedProjectId) nextErrors.projectId = "Project is required";
    if (!formData.siteRepresentativeId) {
      nextErrors.siteRepresentativeId = "Site Representative is required";
    }
    if (!formData.plannedStartDate) {
      nextErrors.plannedStartDate = "Start Date is required";
    }
    if (!formData.plannedEndDate) {
      nextErrors.plannedEndDate = "End Date is required";
    } else if (
      formData.plannedStartDate &&
      compareJalaliDates(formData.plannedEndDate, formData.plannedStartDate) < 0
    ) {
      nextErrors.plannedEndDate = "End Date cannot be earlier than Start Date";
    }
    setErrors(nextErrors);
    const firstInvalidField = Object.keys(nextErrors)[0] as
      | keyof FormErrors
      | undefined;
    if (firstInvalidField) {
      requestAnimationFrame(() => {
        const field = formRef.current?.querySelector<HTMLElement>(
          `[data-field="${firstInvalidField}"]`,
        );
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        field
          ?.querySelector<HTMLElement>(
            "select, input, textarea, button, [tabindex]",
          )
          ?.focus();
      });
    }
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmittingRef.current || !validate()) return;
    const selectedProject = projects.find(
      (project) => project.id === selectedProjectId,
    );
    const selectedRepresentative = siteRepresentatives.find(
      (candidate) => candidate.id === formData.siteRepresentativeId,
    );
    if (!selectedProject) {
      setErrors((current) => ({
        ...current,
        projectId: "The selected project is unavailable",
      }));
      return;
    }

    isSubmittingRef.current = true;
    setIsSaving(true);
    try {
      const payload = {
        project_id: selectedProject.id,
        client_id:
          selectedProject.client_id || initialData?.client_id || clientId || "",
        contract_id:
          selectedProject.contract_id ||
          initialData?.contract_id ||
          contractId ||
          "",
        department:
          selectedProject.department ||
          initialData?.department ||
          department ||
          undefined,
        title:
          initialData?.title || `${selectedProject.name} Resident Inspection`,
        site_representative_id: formData.siteRepresentativeId,
        client_representative: selectedRepresentative
          ? getUserLabel(selectedRepresentative)
          : initialData?.client_representative,
        planned_start_date: formData.plannedStartDate,
        planned_end_date: formData.plannedEndDate,
      };

      if (initialData) {
        await tpiEngagementAppService.update({
          mode: "RESIDENT",
          engagement: { ...initialData, ...payload },
        });
        showToast("success", "Updated", "Resident engagement updated");
        onSuccess();
        onClose();
      } else {
        const created = await tpiEngagementAppService.createResident({
          ...payload,
          created_by: user?.id,
          is_deleted: false,
        });
        if (created.mode !== "RESIDENT") {
          throw new Error("Resident creation returned an invalid engagement");
        }

        const documentsToUpload = pendingDocuments.map((document) => ({
          file: document.file,
          document_name: document.displayName.trim(),
        }));
        onClose();
        showToast("success", "Created", "Resident engagement created");

        try {
          void Promise.resolve(onSuccess()).catch((error) => {
            console.error("Resident list refresh failed:", error);
            showToast(
              "error",
              "Refresh Failed",
              "Resident was created, but the inspection list could not be refreshed",
            );
          });
        } catch (error) {
          console.error("Resident list refresh failed:", error);
          showToast(
            "error",
            "Refresh Failed",
            "Resident was created, but the inspection list could not be refreshed",
          );
        }

        if (documentsToUpload.length > 0) {
          showToast(
            "info",
            "Uploading Documents",
            `${documentsToUpload.length} document(s) are uploading in the background`,
          );
          void onUploadDocuments(created.engagement.id, documentsToUpload)
            .then(() => {
              showToast(
                "success",
                "Documents Uploaded",
                `${documentsToUpload.length} document(s) uploaded successfully`,
              );
            })
            .catch((error) => {
              console.error("Resident document upload failed:", error);
              showToast(
                "error",
                "Document Upload Failed",
                error instanceof Error
                  ? error.message
                  : "Resident was created, but documents could not be uploaded",
              );
            });
        }
      }
    } catch (error) {
      showToast(
        "error",
        "Save Failed",
        error instanceof Error ? error.message : "Failed to save engagement",
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  };

  const isDataLoading = isLoadingInitialData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title={initialData ? "Edit RESIDENT Inspection" : "New TPI Inspection"}
      size="xl"
      closeOnBackdrop={!isSaving}
      closeOnEscape={!isSaving}
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col"
        style={{ maxHeight: "calc(90vh - 72px)" }}
      >
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="border-b border-[var(--color-border)] pb-3">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Resident Engagement
            </h4>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Project context and long-running inspection coverage
            </p>
          </div>

          {loadError && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
              {loadError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div data-field="projectId">
              <label className="mb-1.5 block text-xs font-semibold text-primary">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(event) => handleProjectChange(event.target.value)}
                disabled={isLoadingInitialData || Boolean(projectId)}
                className={`input-themed w-full rounded-lg px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${errors.projectId ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
              >
                <option value="">
                  {isLoadingInitialData
                    ? "Loading projects..."
                    : availableProjects.length === 0
                      ? "No active TPI projects available"
                      : "Select a TPI project"}
                </option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.projectId} />
            </div>

            <div data-field="siteRepresentativeId">
              <label className="mb-1.5 block text-xs font-semibold text-primary">
                Site Representative <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.siteRepresentativeId}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    siteRepresentativeId: event.target.value,
                  }));
                  clearError("siteRepresentativeId");
                }}
                disabled={isLoadingInitialData}
                className={`input-themed w-full rounded-lg px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${errors.siteRepresentativeId ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
              >
                <option value="">
                  {isLoadingInitialData
                    ? "Loading Site Representatives..."
                    : siteRepresentatives.length === 0
                      ? "No Site Representatives available"
                      : "Select a Site Representative"}
                </option>
                {siteRepresentatives.map((representative) => (
                  <option key={representative.id} value={representative.id}>
                    {getUserLabel(representative)}
                    {representative.email ? ` (${representative.email})` : ""}
                  </option>
                ))}
              </select>
              <FieldError message={errors.siteRepresentativeId} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div data-field="plannedStartDate">
              <label className="mb-1.5 block text-xs font-semibold text-primary">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <JalaaliDatePicker
                value={formData.plannedStartDate}
                onChange={(plannedStartDate) => {
                  setIsStartDateDirty(true);
                  setFormData((current) => ({
                    ...current,
                    plannedStartDate,
                  }));
                  clearError("plannedStartDate");
                  clearError("plannedEndDate");
                }}
                placeholder="Select start date"
                disabled={isLoadingInitialData}
                className={
                  errors.plannedStartDate
                    ? "rounded-lg border border-rose-500 ring-1 ring-rose-500"
                    : ""
                }
              />
              <FieldError message={errors.plannedStartDate} />
            </div>

            <div data-field="plannedEndDate">
              <label className="mb-1.5 block text-xs font-semibold text-primary">
                End Date <span className="text-rose-500">*</span>
              </label>
              <JalaaliDatePicker
                value={formData.plannedEndDate}
                onChange={(plannedEndDate) => {
                  setIsEndDateDirty(true);
                  setFormData((current) => ({
                    ...current,
                    plannedEndDate,
                  }));
                  clearError("plannedEndDate");
                }}
                placeholder="Select end date"
                disabled={isLoadingInitialData}
                className={
                  errors.plannedEndDate
                    ? "rounded-lg border border-rose-500 ring-1 ring-rose-500"
                    : ""
                }
              />
              <FieldError message={errors.plannedEndDate} />
            </div>
          </div>

          {!initialData && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-primary">
                Documents
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] px-4 py-5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)]">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Select documents
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={handleDocumentSelect}
                  disabled={isSaving}
                />
              </label>
              {pendingDocuments.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsDocumentReviewOpen(true)}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Review {pendingDocuments.length} selected document(s)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isSaving ||
              isDataLoading ||
              Boolean(loadError) ||
              (pendingDocuments.length > 0 && !areDocumentsFinalized) ||
              pendingDocuments.some((document) => !document.displayName.trim())
            }
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isSaving
              ? "Saving..."
              : initialData
                ? "Update Engagement"
                : "Create Engagement"}
          </Button>
        </div>
      </form>

      <Modal
        isOpen={isDocumentReviewOpen}
        onClose={() => setIsDocumentReviewOpen(false)}
        title="Review Documents"
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={finalizeDocuments}
              disabled={pendingDocuments.some(
                (document) => !document.displayName.trim(),
              )}
            >
              Finalize Files
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {pendingDocuments.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-text-secondary)]">
              No documents selected
            </p>
          ) : (
            pendingDocuments.map((document) => (
              <div
                key={document.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 rounded-lg border border-[var(--color-border)] p-3"
              >
                <div className="min-w-0">
                  <label
                    htmlFor={`document-name-${document.id}`}
                    className="mb-1.5 block text-xs font-semibold text-primary"
                  >
                    Display name
                  </label>
                  <input
                    id={`document-name-${document.id}`}
                    type="text"
                    value={document.displayName}
                    onChange={(event) =>
                      updateDocumentName(document.id, event.target.value)
                    }
                    className="input-themed w-full rounded-lg px-3 py-2 text-sm"
                  />
                  <p className="mt-1 truncate text-[11px] text-[var(--color-text-secondary)]">
                    {document.file.name} ·{" "}
                    {Math.max(1, Math.round(document.file.size / 1024))} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(document.id)}
                  className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  aria-label={`Remove ${document.displayName || document.file.name}`}
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </Modal>
  );
}
