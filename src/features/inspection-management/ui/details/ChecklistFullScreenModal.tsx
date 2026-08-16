// src/features/inspection-management/ui/details/ChecklistFullScreenModal.tsx

import { useState, useEffect, useMemo, useRef } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@/shared/ui/ToastContainer";
import { checklistAppService } from "../../application/ChecklistApplicationService";
import { getMethodMetadata, getStatusMetadata } from "../../constants";
import type {
  ChecklistData,
  ChecklistItem,
  ChecklistItemResult,
  ChecklistItemStatus,
  InheritedChecklistResult,
} from "../../domain/checklistTypes";
import type { InspectionPhoto } from "../../repositories/InspectionPhotoRepository";

interface ChecklistFullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  equipmentId: string[];
  stages?: string[];
  methods?: string[];
  sessionId?: string;
}

type NonConformitySeverity = "MINOR" | "MAJOR" | "OBSERVATION" | "HOLD POINT";

type ResolutionFinding = Awaited<
  ReturnType<typeof checklistAppService.getFindingForChecklistResult>
>;

type ResolutionGateState = {
  itemId: string;
  sourceSessionNumber: number;
  sourceResult: ChecklistItemResult;
  finding: ResolutionFinding;
  loading: boolean;
};

export function ChecklistFullScreenModal({
  isOpen,
  onClose,
  requestId,
  equipmentId = [],
  stages,
  methods,
  sessionId,
}: ChecklistFullScreenModalProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [allData, setAllData] = useState<
    { eqId: string; eqName: string; data: ChecklistData }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Map<string, ChecklistItemResult>>(
    new Map(),
  );
  const [inheritedResults, setInheritedResults] = useState<
    Map<string, InheritedChecklistResult>
  >(new Map());
  const [resolutionGate, setResolutionGate] =
    useState<ResolutionGateState | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | string>("ALL");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeComment, setActiveComment] = useState("");
  const [NonConformitySeverity, setNonConformitySeverity] = useState<
    Map<string, NonConformitySeverity>
  >(new Map());

  const [photosByItem, setPhotosByItem] = useState<
    Map<string, InspectionPhoto[]>
  >(new Map());
  const [pendingPhotos, setPendingPhotos] = useState<
    Map<string, { file: File; previewUrl: string }[]>
  >(new Map());
  // In-page photo preview (lightbox) — replaces window.open
  const [photoPreview, setPhotoPreview] = useState<{
    url: string;
    name: string;
    status?: string;
  } | null>(null);
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // ✅ لیست تمام equipmentها برای تب‌ها
  const equipmentList = useMemo(() => {
    return allData.map(({ eqId, eqName }) => ({
      eqId,
      eqName,
    }));
  }, [allData]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const promises = equipmentId.map(async (eqId) => {
        const data = await checklistAppService.getChecklist({
          equipmentId: [eqId],
          stages,
          methods,
        });
        return { eqId, eqName: eqId, data };
      });
      const loaded = await Promise.all(promises);
      const valid = loaded.filter(
        (r) => r.data.template && r.data.groups.length > 0,
      );
      setAllData(valid);
    } catch (err) {
      console.error("Failed to load checklists:", err);
      showToast("error", "Load Failed", "Could not load checklist data");
    } finally {
      setLoading(false);
    }
  };

  const loadSessionContext = async () => {
    try {
      const ctx = await checklistAppService.getChecklistSessionContext({
        requestId,
        sessionId,
        equipmentId,
        stages,
        methods,
      });

      // 1) This session's own results always win.
      const map = new Map<string, ChecklistItemResult>();
      ctx.currentResults.forEach((r) => map.set(r.item_id, r));

      setResults(map);
      setInheritedResults(
        new Map(
          ctx.inherited
            .filter(({ result }) => !map.has(result.item_id))
            .map((inherited) => [inherited.result.item_id, inherited]),
        ),
      );
    } catch (err) {
      console.error("Failed to load session checklist context:", err);
    }
  };

  const loadAllPhotos = async () => {
    try {
      const photos = await checklistAppService.getPhotosByRequestId(requestId);
      const map = new Map<string, InspectionPhoto[]>();
      photos.forEach((photo) => {
        const current = map.get(photo.checklist_item_id) || [];
        current.push(photo);
        map.set(photo.checklist_item_id, current);
      });
      setPhotosByItem(map);
    } catch (err: any) {
      console.error("Failed to load all photos:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAll();
      loadSessionContext();
      loadAllPhotos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, requestId, sessionId, equipmentId, stages, methods]);

  // Clear the lightbox when the modal closes
  useEffect(() => {
    if (!isOpen) setPhotoPreview(null);
  }, [isOpen]);

  // Close the lightbox with the Escape key
  useEffect(() => {
    if (!photoPreview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhotoPreview(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [photoPreview]);

  const handleStatusChange = (
    itemId: string,
    eqId: string,
    method: string,
    status: ChecklistItemStatus,
    comment?: string,
  ) => {
    setResults((prev) => {
      const next = new Map(prev);
      next.set(itemId, {
        item_id: itemId,
        request_id: requestId,
        session_id: sessionId,
        equipment_id: eqId,
        inspection_method: method,
        status,
        comment,
        checked_by: user?.id,
        checked_at: new Date().toISOString(),
      });
      return next;
    });
  };

  const handleInheritedStatusChange = async (
    inherited: InheritedChecklistResult,
    itemId: string,
    eqId: string,
    method: string,
    targetStatus: ChecklistItemStatus,
  ) => {
    const decision = checklistAppService.evaluateInheritedTransition(
      inherited.result.status,
      targetStatus,
    );

    if (decision.kind === "LOCKED" || decision.kind === "BLOCKED") {
      showToast("warning", "Result Locked", decision.reason);
      return;
    }

    if (decision.kind === "REQUIRES_RESOLUTION") {
      setResolutionGate({
        itemId,
        sourceSessionNumber: inherited.sourceSessionNumber,
        sourceResult: inherited.result,
        finding: null,
        loading: true,
      });
      try {
        const finding = await checklistAppService.getFindingForChecklistResult(
          requestId,
          inherited.result,
        );
        setResolutionGate((current) =>
          current?.itemId === itemId
            ? { ...current, finding, loading: false }
            : current,
        );
      } catch (err: any) {
        setResolutionGate((current) =>
          current?.itemId === itemId
            ? { ...current, finding: null, loading: false }
            : current,
        );
        showToast(
          "error",
          "Finding Load Failed",
          err.message || "Could not load the previous finding",
        );
      }
      return;
    }

    handleStatusChange(
      itemId,
      eqId,
      method,
      targetStatus,
      inherited.result.comment,
    );
  };

  const handleItemSelect = (itemId: string) => {
    setActiveItemId(itemId);
    const existingResult = results.get(itemId);
    setActiveComment(existingResult?.comment || "");

    setTimeout(() => {
      const el = document.getElementById(`checklist-item-${itemId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  /**
   * Select a photo for deferred upload.
   * Only shows a preview in the UI - actual upload happens on Submit.
   */
  const handlePhotoSelect = (itemId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPendingPhotos((prev) => {
      const next = new Map(prev);
      const current = next.get(itemId) || [];
      next.set(itemId, [...current, { file, previewUrl }]);
      return next;
    });
  };

  const handleSubmit = async () => {
    const completedCount = Array.from(results.values()).filter(
      (r) => r.status !== "PENDING",
    ).length;
    if (completedCount === 0) {
      showToast(
        "warning",
        "Incomplete",
        "Please complete at least one checklist item",
      );
      return;
    }
    setSubmitting(true);

    // استخراج داده‌ها قبل از بستن مودال
    const sessionResults = new Map(results);
    const pending = new Map(pendingPhotos);
    const allDataSnapshot = allData;
    const severitiesSnapshot = new Map(NonConformitySeverity);

    // بستن فوری مودال
    onClose();

    // انجام عملیات در پس‌زمینه
    void (async () => {
      try {
        // ۱. ذخیره نتایج چک‌لیست
        const sessionMap = new Map<string, ChecklistItemResult[]>();
        sessionResults.forEach((result) => {
          const key = `${result.equipment_id}__${result.inspection_method}`;
          if (!sessionMap.has(key)) sessionMap.set(key, []);
          sessionMap.get(key)!.push(result);
        });

        // یافتن eqId و method برای هر item (برای آپلود عکس)
        const itemMeta = new Map<
          string,
          { eqId: string; method: string; checklistText?: string }
        >();
        allDataSnapshot.forEach(({ eqId, data }) => {
          data.groups.forEach((group) => {
            group.items.forEach((item) => {
              itemMeta.set(item.id, {
                eqId,
                method: group.method,
                checklistText: item.checklist_text,
              });
            });
          });
        });

        for (const [key, sessionResultsList] of sessionMap.entries()) {
          const [eq_id, insp_method] = key.split("__");
          await checklistAppService.saveResults({
            id: `${requestId}_${eq_id}_${insp_method}`,
            session_id: sessionId,
            request_id: requestId,
            equipment_id: eq_id,
            inspection_method: insp_method,
            results: sessionResultsList.map((r) => ({
              ...r,
              checklist_text:
                itemMeta.get(r.item_id)?.checklistText || r.checklist_text,
            })),
            total_items: sessionResultsList.length,
            completed_items: sessionResultsList.filter(
              (r) => r.status !== "PENDING",
            ).length,
            status: "SUBMITTED",
            created_by: user?.id || "unknown",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // ۱.۵ ثبت Non-Conformity و Observation برای آیتم‌های مربوطه
        const ncPromises: Promise<unknown>[] = [];
        sessionResults.forEach((result) => {
          const comment = (result.comment || "").trim();

          if (result.status === "REJECT") {
            if (!comment) {
              showToast(
                "warning",
                "Description of Non-Conformity is Required",
                `Please add a description for ${result.item_id}`,
              );
              return;
            }
            const severity = severitiesSnapshot.get(result.item_id) || "MINOR";
            ncPromises.push(
              checklistAppService
                .createNonConformityFromReject(
                  { ...result, request_id: requestId },
                  `Non-Conformity - ${result.inspection_method}`,
                  comment,
                  severity,
                  result.inspection_method,
                  user?.id || "unknown",
                )
                .catch((err: any) => {
                  console.error(
                    `Failed to create Non-Conformity for ${result.item_id}:`,
                    err,
                  );
                  showToast(
                    "error",
                    "Non-Conformity Failed",
                    err.message || "Could not create Non-Conformity",
                  );
                }),
            );
          } else if (result.status === "NOTE") {
            if (!comment) return;
            ncPromises.push(
              checklistAppService
                .createObservationFromNote(
                  { ...result, request_id: requestId },
                  comment,
                  result.inspection_method,
                  user?.id || "unknown",
                )
                .catch((err: any) => {
                  console.error(
                    `Failed to create Observation for ${result.item_id}:`,
                    err,
                  );
                }),
            );
          }
        });
        await Promise.allSettled(ncPromises);

        // ۲. آپلود عکس‌های pending در پس‌زمینه

        for (const [itemId, photos] of pending.entries()) {
          const meta = itemMeta.get(itemId);
          const result = sessionResults.get(itemId);
          const status = result?.status || ("PENDING" as ChecklistItemStatus);
          const photoStatus =
            status === "N/A"
              ? "PENDING"
              : (status as string as
                  | "PENDING"
                  | "PASS"
                  | "REJECT"
                  | "NOTE"
                  | "HOLD");

          for (const { file } of photos) {
            try {
              await checklistAppService.uploadInspectionPhoto({
                requestId,
                equipmentId: meta?.eqId || equipmentId[0],
                checklistItemId: itemId,
                file,
                status: photoStatus,
                description:
                  result?.comment ||
                  `${meta?.method || "Checklist"} - ${status}`,
                uploadedBy: user?.id || "unknown",
              });
            } catch (err: any) {
              console.error(`Failed to upload photo for item ${itemId}:`, err);
            }
          }

          // آزادسازی URLهای پیش‌نمایش
          photos.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
        }

        showToast("success", "Submitted", "Checklist submitted successfully");
      } catch (err: any) {
        console.error("Background submit failed:", err);
        showToast(
          "error",
          "Submit Failed",
          err.message || "Could not submit checklist",
        );
      } finally {
        setSubmitting(false);
        setPendingPhotos(new Map());
      }
    })();
  };

  const filteredGroups = useMemo(() => {
    const groups: {
      eqId: string;
      groupName: string;
      items: ChecklistItem[];
    }[] = [];
    allData.forEach(({ eqId, data }) => {
      data.groups.forEach((group) => {
        // فیلتر بر اساس equipment فعال در تب‌ها
        if (activeTab === "ALL") {
          groups.push({ eqId, groupName: group.method, items: group.items });
        } else if (activeTab === eqId) {
          // activeTab حالا eqId است، پس تمام آیتم‌های آن equipment را نشان بده
          groups.push({ eqId, groupName: group.method, items: group.items });
        }
        // اگر activeTab با eqId مطابقت نداشته باشد، چیزی اضافه نمی‌شود
      });
    });
    return groups;
  }, [allData, activeTab]);

  const totalItems = useMemo(
    () =>
      allData.reduce(
        (s, { data }) =>
          s + data.groups.reduce((ss, g) => ss + g.items.length, 0),
        0,
      ),
    [allData],
  );

  const completedItems = useMemo(
    () =>
      Array.from(results.values()).filter((r) => r.status !== "PENDING").length,
    [results],
  );

  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const modalFooter = (
    <div className="flex items-center justify-between w-full">
      <div
        className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
      >
        {completedItems === totalItems && totalItems > 0 ? (
          <span className="text-emerald-500 font-bold flex items-center gap-2">
            ✓ All items completed
          </span>
        ) : (
          <span>
            {totalItems - completedItems} item
            {totalItems - completedItems !== 1 ? "s" : ""} remaining
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || completedItems === 0}
          className={
            completedItems === totalItems && totalItems > 0
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold"
              : "text-white font-bold"
          }
        >
          {submitting ? "Submitting..." : "✓ Submit Checklist"}
        </Button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📋 Inspection Checklist"
      size="full"
      showCloseButton={true}
      footer={modalFooter}
      contentClassName="p-0"
    >
      <div
        className={`flex-shrink-0 border-b ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? "bg-indigo-900/50 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}
            >
              {equipmentId.length}
            </div>
            <div>
              <h2
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Inspection Checklist
              </h2>
              <p
                className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {totalItems} Total Items
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-24 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
            >
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span
              className={`text-xs font-bold tabular-nums ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              {progress.toFixed(0)}%
            </span>
          </div>
        </div>

        <div
          className={`px-4 py-2 border-t overflow-x-auto no-scrollbar ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}
        >
          <div className="flex gap-2 min-w-max">
            {["ALL", ...equipmentList.map((eq) => eq.eqId)].map((tabId) => {
              const isActive = activeTab === tabId;
              const eqData =
                tabId !== "ALL"
                  ? equipmentList.find((e) => e.eqId === tabId)
                  : null;

              return (
                <button
                  key={tabId}
                  onClick={() => {
                    setActiveTab(tabId);
                    if (tabId !== "ALL") {
                      // When switching to an equipment tab, show all items for that equipment
                      setActiveItemId(null);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md"
                      : isDark
                        ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {tabId === "ALL" ? (
                    <>📋 All Equipment</>
                  ) : (
                    <>
                      <span>🔧</span>
                      <span className="max-w-[200px] truncate">
                        {eqData?.eqName || eqData?.eqId}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="text-3xl mb-2">📭</div>
            <p
              className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              No items found for this selection.
            </p>
            <p
              className={`text-[10px] mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Try a different equipment, stage or method.
            </p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-4 space-y-4">
            {filteredGroups.map((group, idx) => {
              const groupCompleted = group.items.filter((i) => {
                const r = results.get(i.id);
                return r && r.status !== "PENDING";
              }).length;

              return (
                <div
                  key={idx}
                  className={`rounded-xl border overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
                >
                  <div
                    className={`px-4 py-2 border-b flex items-center justify-between ${
                      activeTab === "ALL"
                        ? isDark
                          ? "bg-slate-800/50 border-slate-800"
                          : "bg-slate-50 border-slate-200"
                        : isDark
                          ? "bg-indigo-900/30 border-indigo-800"
                          : "bg-indigo-50 border-indigo-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <h3
                        className={`text-xs font-bold uppercase tracking-wider truncate ${
                          activeTab === "ALL"
                            ? isDark
                              ? "text-slate-300"
                              : "text-slate-700"
                            : isDark
                              ? "text-indigo-300"
                              : "text-indigo-700"
                        }`}
                      >
                        {getMethodMetadata(group.groupName).icon}{" "}
                        {group.groupName}
                      </h3>
                    </div>
                    <Badge
                      tone={activeTab === "ALL" ? "slate" : "indigo"}
                      className="text-[10px] shrink-0"
                    >
                      {groupCompleted}/{group.items.length}
                      {activeTab !== "ALL" ? " completed" : ""}
                    </Badge>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {group.items.map((item) => {
                      const currentResult = results.get(item.id);
                      const inherited = inheritedResults.get(item.id);
                      const result = currentResult || inherited?.result;
                      const status = result?.status || "PENDING";
                      const config = getStatusMetadata(status);
                      const isActive = activeItemId === item.id;
                      const isReject = status === "REJECT";
                      const isNote = status === "NOTE";
                      const itemNonConformitySeverity =
                        NonConformitySeverity.get(item.id) || "MINOR";
                      const sourceSession = inherited?.sourceSessionNumber;
                      const isHistoricalInherited = Boolean(
                        inherited && !currentResult,
                      );
                      const isLockedInherited =
                        !currentResult && inherited?.locked === true;

                      return (
                        <div
                          key={item.id}
                          id={`checklist-item-${item.id}`}
                          onClick={() => handleItemSelect(item.id)}
                          className={`p-3 transition-all cursor-pointer ${
                            isLockedInherited
                              ? isDark
                                ? "bg-slate-900/60 opacity-80"
                                : "bg-slate-50 opacity-80"
                              : isActive
                                ? isDark
                                  ? "bg-indigo-900/20 ring-1 ring-indigo-500/50"
                                  : "bg-indigo-50 ring-1 ring-indigo-200"
                                : isDark
                                  ? "hover:bg-slate-800/50"
                                  : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                              style={{ background: config.color }}
                            >
                              {config.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs leading-snug ${status === "PASS" ? "line-through text-slate-400" : isDark ? "text-slate-200" : "text-slate-800"}`}
                              >
                                <span className="font-bold opacity-50">
                                  {item.sequence}.
                                </span>{" "}
                                {item.checklist_text}
                              </p>

                              {/* Inherited-from-previous-session indicator */}
                              {sourceSession && (
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-semibold ${isDark ? "bg-indigo-900/40 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
                                    title="Loaded from a previous session because item, method and stage match"
                                  >
                                    ↩️ Session #{sourceSession}
                                  </span>
                                  {isLockedInherited && (
                                    <span
                                      className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-semibold ${isDark ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}
                                    >
                                      Locked approved result
                                    </span>
                                  )}
                                </div>
                              )}

                              {result?.comment &&
                                status !== "PASS" &&
                                status !== "N/A" && (
                                  <p
                                    className={`mt-1 text-[10px] italic ${isDark ? "text-slate-500" : "text-slate-500"}`}
                                  >
                                    💬 {result.comment}
                                  </p>
                                )}

                              {/* Non-Conformity Box for REJECT status */}
                              {isReject && (
                                <div
                                  className={`mt-2 p-2 rounded-lg border ${isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"}`}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span
                                      className={`text-xs font-bold ${isDark ? "text-red-400" : "text-red-700"}`}
                                    >
                                      ⚠️ Non-Conformity Report
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <label
                                      className={`text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                    >
                                      Severity:
                                    </label>
                                    <select
                                      value={itemNonConformitySeverity}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        setNonConformitySeverity((prev) =>
                                          new Map(prev).set(
                                            item.id,
                                            e.target
                                              .value as NonConformitySeverity,
                                          ),
                                        );
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={isHistoricalInherited}
                                      className={`text-xs px-2 py-2 rounded border ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"} focus:outline-none focus:ring-1 focus:ring-red-500`}
                                    >
                                      <option value="MINOR">Minor</option>
                                      <option value="MAJOR">Major</option>
                                      <option value="OBSERVATION">
                                        Observation
                                      </option>
                                      <option value="HOLD POINT">
                                        Hold Point
                                      </option>
                                    </select>
                                    <input
                                      type="text"
                                      value={result?.comment || ""}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(
                                          item.id,
                                          group.eqId,
                                          group.groupName,
                                          status,
                                          e.target.value,
                                        );
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={isHistoricalInherited}
                                      placeholder="Enter NonConformity description (will be submitted with the form)..."
                                      className={`w-full text-xs px-3 py-2 rounded-lg border mb-0 ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"} focus:outline-none focus:ring-1 focus:ring-red-500`}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Observation box for NOTE status — saved on form submit */}
                              {isNote && (
                                <div
                                  className={`mt-2 p-2 rounded-lg border ${isDark ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs font-semibold ${isDark ? "text-blue-400" : "text-blue-700"}`}
                                    >
                                      ℹ️ Observation (will be saved with the
                                      form)
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={result?.comment || ""}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(
                                        item.id,
                                        group.eqId,
                                        group.groupName,
                                        status,
                                        e.target.value,
                                      );
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    disabled={isHistoricalInherited}
                                    placeholder="Enter observation details (will be saved with the form)..."
                                    className={`w-full text-xs px-3 py-2 rounded-lg border mt-1 ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                  />
                                </div>
                              )}

                              {/* Photo Upload Section */}
                              <div className="mt-2">
                                <div
                                  className={`flex items-center gap-2 mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                >
                                  <span className="text-[10px] font-semibold">
                                    📷 Photos:
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      fileInputRefs.current
                                        .get(item.id)
                                        ?.click();
                                    }}
                                    className={`text-[10px] px-2 py-1 rounded border transition-all ${
                                      isDark
                                        ? "bg-indigo-900/30 border-indigo-700 text-indigo-400 hover:bg-indigo-900/50"
                                        : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                                    }`}
                                    disabled={isHistoricalInherited}
                                  >
                                    ➕ Add Photo
                                  </button>
                                  <input
                                    ref={(el) => {
                                      if (el)
                                        fileInputRefs.current.set(item.id, el);
                                    }}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handlePhotoSelect(item.id, file);
                                      }
                                      e.target.value = "";
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hidden"
                                  />
                                </div>

                                {/* Display pending photos (deferred upload) */}
                                {pendingPhotos.get(item.id) &&
                                  pendingPhotos.get(item.id)!.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {pendingPhotos
                                        .get(item.id)!
                                        .map((pending, pIdx) => (
                                          <div
                                            key={`pending-${pIdx}`}
                                            className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 border-dashed border-blue-400 cursor-zoom-in bg-blue-50 dark:bg-blue-950/40 transition-transform hover:scale-105`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPhotoPreview({
                                                url: pending.previewUrl,
                                                name: `Pending ${pIdx + 1}`,
                                                status: "NEW",
                                              });
                                            }}
                                            title="Click to preview"
                                          >
                                            <img
                                              src={pending.previewUrl}
                                              alt={`Pending ${pIdx + 1}`}
                                              className="w-full h-full object-cover"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 px-0.5 py-px text-[7px] truncate bg-blue-600 text-white">
                                              NEW
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  )}

                                {/* Display uploaded photos */}
                                {photosByItem.get(item.id) &&
                                  photosByItem.get(item.id)!.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {photosByItem
                                        .get(item.id)!
                                        .map((photo) => (
                                          <div
                                            key={photo.id}
                                            className={`relative group w-10 h-10 rounded-lg overflow-hidden border-2 cursor-zoom-in transition-all ${
                                              photo.status === "PASS"
                                                ? "border-emerald-500"
                                                : photo.status === "REJECT"
                                                  ? "border-red-500"
                                                  : photo.status === "NOTE"
                                                    ? "border-blue-500"
                                                    : "border-slate-300"
                                            } ${isDark ? "hover:opacity-80" : "hover:opacity-75"}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPhotoPreview({
                                                url: photo.file_path,
                                                name: photo.file_name,
                                                status: photo.status,
                                              });
                                            }}
                                            title="Click to preview"
                                          >
                                            <img
                                              src={photo.file_path}
                                              alt={photo.file_name}
                                              className="w-full h-full object-cover"
                                            />
                                            <div
                                              className={`absolute bottom-0 left-0 right-0 px-0.5 py-px text-[7px] truncate ${
                                                photo.status === "PASS"
                                                  ? "bg-emerald-600"
                                                  : photo.status === "REJECT"
                                                    ? "bg-red-600"
                                                    : photo.status === "NOTE"
                                                      ? "bg-blue-600"
                                                      : "bg-slate-600"
                                              } text-white`}
                                            >
                                              {photo.status}
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {(
                                [
                                  "PASS",
                                  "REJECT",
                                  "NOTE",
                                  "N/A",
                                ] as ChecklistItemStatus[]
                              ).map((s) => {
                                const sMeta = getStatusMetadata(s);
                                const isActiveStatus = status === s;
                                return (
                                  <button
                                    key={s}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (inherited && !currentResult) {
                                        void handleInheritedStatusChange(
                                          inherited,
                                          item.id,
                                          group.eqId,
                                          group.groupName,
                                          s,
                                        );
                                      } else if (
                                        isActiveStatus &&
                                        s !== "PENDING"
                                      ) {
                                        setResults((prev) => {
                                          const n = new Map(prev);
                                          n.delete(item.id);
                                          return n;
                                        });
                                      } else {
                                        handleStatusChange(
                                          item.id,
                                          group.eqId,
                                          group.groupName,
                                          s,
                                          result?.comment,
                                        );
                                      }
                                    }}
                                    title={sMeta.label}
                                    disabled={isLockedInherited}
                                    className={`w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${
                                      isLockedInherited
                                        ? "cursor-not-allowed opacity-50"
                                        : isActiveStatus
                                          ? `text-white shadow-sm scale-110`
                                          : isDark
                                            ? "bg-slate-800 text-slate-500 hover:bg-slate-700"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                    }`}
                                    style={
                                      isActiveStatus
                                        ? { backgroundColor: sMeta.color }
                                        : {}
                                    }
                                  >
                                    {s === "PASS"
                                      ? "✓"
                                      : s === "REJECT"
                                        ? "✗"
                                        : s === "NOTE"
                                          ? "!"
                                          : "–"}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {resolutionGate && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-lg border shadow-2xl ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Previous finding must be resolved
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                This item was recorded as {resolutionGate.sourceResult.status}{" "}
                in Session #{resolutionGate.sourceSessionNumber}. It cannot be
                changed to PASS until the linked finding is formally closed.
              </p>
            </div>
            <div className="p-5">
              {resolutionGate.loading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  Loading linked finding...
                </div>
              ) : resolutionGate.finding ? (
                <div
                  className={`rounded-lg border p-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {resolutionGate.finding.type === "NCR"
                        ? resolutionGate.finding.number
                        : "Observation"}
                    </span>
                    <Badge tone="danger" className="text-[9px]">
                      {resolutionGate.finding.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {resolutionGate.finding.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    {resolutionGate.finding.description}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  No linked finding was found. The PASS transition remains
                  blocked to protect inspection history.
                </div>
              )}
              <p className="mt-4 text-[11px] text-slate-500">
                Finding closure and checklist approval will be implemented as
                one atomic workflow when the NCR/Observation resolution design
                is finalized.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setResolutionGate(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* In-page photo preview (lightbox) */}
      {photoPreview && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPhotoPreview(null)}
        >
          <div
            className="relative max-w-[92vw] max-h-[88vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photoPreview.url}
              alt={photoPreview.name}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-3 flex items-center gap-2 max-w-full">
              {photoPreview.status && (
                <Badge
                  tone={
                    photoPreview.status === "PASS"
                      ? "emerald"
                      : photoPreview.status === "REJECT"
                        ? "danger"
                        : photoPreview.status === "NOTE" ||
                            photoPreview.status === "NEW"
                          ? "indigo"
                          : "slate"
                  }
                  className="text-[10px] shrink-0"
                >
                  {photoPreview.status}
                </Badge>
              )}
              <span
                className={`text-[11px] truncate ${isDark ? "text-slate-300" : "text-slate-200"}`}
              >
                {photoPreview.name}
              </span>
            </div>
            <button
              onClick={() => setPhotoPreview(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-900 font-bold shadow-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
              title="Close preview (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
