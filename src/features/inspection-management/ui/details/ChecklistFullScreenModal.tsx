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
} from "../../domain/checklistTypes";
import type { NonConformityReport } from "../../repositories/NonConformityRepository";
import type { InspectionPhoto } from "../../repositories/InspectionPhotoRepository";

interface ChecklistFullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  equipmentId: string[];
  stages?: string[];
  methods?: string[];
}

type NonConformitySeverity = "MINOR" | "MAJOR" | "OBSERVATION" | "HOLD POINT";

interface ChecklistFullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  equipmentId: string[];
  stages?: string[];
  methods?: string[];
}

export function ChecklistFullScreenModal({
  isOpen,
  onClose,
  requestId,
  equipmentId = [],
  stages,
  methods,
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
  const [activeTab, setActiveTab] = useState<"ALL" | string>("ALL");
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeComment, setActiveComment] = useState("");
  const [NonConformitySeverity, setNonConformitySeverity] = useState<
    Map<string, NonConformitySeverity>
  >(new Map());
  const [NonConformitySubmitting, setNonConformitySubmitting] = useState<
    Set<string>
  >(new Set());
  const [photosByItem, setPhotosByItem] = useState<
    Map<string, InspectionPhoto[]>
  >(new Map());
  const [uploadingPhotos, setUploadingPhotos] = useState<Set<string>>(
    new Set(),
  );
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

  const loadSavedResults = async () => {
    try {
      const saved = await checklistAppService.getSavedResults(requestId);
      const map = new Map<string, ChecklistItemResult>();
      saved.forEach((r) => map.set(r.item_id, r));
      setResults(map);
    } catch (err) {
      console.error("Failed to load saved results:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAll();
      loadSavedResults();
    }
  }, [isOpen]);

  const activeItemData = (() => {
    if (!activeItemId) return null;
    for (const { eqId, data } of allData) {
      for (const group of data.groups) {
        const item = group.items.find((i) => i.id === activeItemId);
        if (item) return { item, eqId, method: group.method };
      }
    }
    return null;
  })();

  const flatItemList = useMemo(() => {
    return allData.flatMap(({ eqId, data }) =>
      data.groups.flatMap((group) =>
        group.items.map((item) => ({
          id: item.id,
          eqId,
          method: group.method,
        })),
      ),
    );
  }, [allData]);

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

  const navigateItem = (direction: "next" | "prev") => {
    if (!activeItemId || flatItemList.length === 0) return;
    const currentIndex = flatItemList.findIndex((i) => i.id === activeItemId);
    if (currentIndex === -1) return;

    const newIndex =
      direction === "next"
        ? Math.min(currentIndex + 1, flatItemList.length - 1)
        : Math.max(currentIndex - 1, 0);

    const nextItem = flatItemList[newIndex];
    setActiveItemId(nextItem.id);

    const existingResult = results.get(nextItem.id);
    setActiveComment(existingResult?.comment || "");
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

  const handleNonConformitySubmit = async (itemId: string) => {
    const result = results.get(itemId);
    if (!result || result.status !== "REJECT") return;

    const severity = NonConformitySeverity.get(itemId) || "MINOR";
    const comment = activeComment.trim();

    if (!comment) {
      showToast(
        "warning",
        "Description of Non-Conformity is Required",
        "Please add a description for Non-Conformity",
      );
      return;
    }

    setNonConformitySubmitting((prev) => new Set(prev).add(itemId));

    try {
      await checklistAppService.createNonConformityFromReject(
        { ...result, request_id: requestId },
        `Non-Conformity - ${result.inspection_method}`,
        comment,
        severity,
        result.inspection_method,
        user?.id || "unknown",
      );

      showToast(
        "success",
        "Non-Conformity Created",
        `Non-Conformity reported with severity: ${severity}`,
      );

      // Clear severity after successful submission
      setNonConformitySeverity((prev) => {
        const next = new Map(prev);
        next.delete(itemId);
        return next;
      });
    } catch (err: any) {
      showToast(
        "error",
        "Non-Conformity Failed",
        err.message || "Could not create Non-Conformity",
      );
    } finally {
      setNonConformitySubmitting((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleObservationAutoSave = async (itemId: string, comment: string) => {
    const result = results.get(itemId);
    if (!result || result.status !== "NOTE") return;

    try {
      await checklistAppService.createObservationFromNote(
        { ...result, request_id: requestId },
        comment,
        result.inspection_method,
        user?.id || "unknown",
      );
      showToast(
        "success",
        "Observation Saved",
        "Observation recorded automatically",
      );
    } catch (err: any) {
      console.error("Failed to save observation:", err);
    }
  };

  const handlePhotoUpload = async (
    itemId: string,
    eqId: string,
    method: string,
    file: File,
  ) => {
    const result = results.get(itemId);
    const status = result?.status || "PENDING";

    // Map N/A to PENDING for photo status
    const photoStatus =
      status === "N/A"
        ? "PENDING"
        : (status as "PENDING" | "PASS" | "REJECT" | "NOTE" | "HOLD");

    setUploadingPhotos((prev) => new Set(prev).add(itemId));

    try {
      const photo = await checklistAppService.uploadInspectionPhoto({
        requestId,
        equipmentId: eqId,
        checklistItemId: itemId,
        file,
        status: photoStatus,
        description: result?.comment || `${method} - ${status}`,
        uploadedBy: user?.id || "unknown",
      });

      // Update photos list
      setPhotosByItem((prev) => {
        const next = new Map(prev);
        const current = next.get(itemId) || [];
        next.set(itemId, [...current, photo]);
        return next;
      });

      showToast("success", "Photo Uploaded", "Photo saved successfully");
    } catch (err: any) {
      console.error("Failed to upload photo:", err);
      showToast(
        "error",
        "Upload Failed",
        err.message || "Could not upload photo",
      );
    } finally {
      setUploadingPhotos((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const loadPhotosForItem = async (itemId: string) => {
    try {
      const photos = await checklistAppService.getPhotosByChecklistItem(itemId);
      setPhotosByItem((prev) => new Map(prev).set(itemId, photos));
    } catch (err: any) {
      console.error("Failed to load photos:", err);
    }
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
    try {
      const sessionMap = new Map<string, ChecklistItemResult[]>();
      results.forEach((result) => {
        const key = `${result.equipment_id}__${result.inspection_method}`;
        if (!sessionMap.has(key)) sessionMap.set(key, []);
        sessionMap.get(key)!.push(result);
      });

      for (const [key, sessionResults] of sessionMap.entries()) {
        const [eq_id, insp_method] = key.split("__");
        await checklistAppService.saveResults({
          id: `${requestId}_${eq_id}_${insp_method}`,
          request_id: requestId,
          equipment_id: eq_id,
          inspection_method: insp_method,
          results: sessionResults,
          total_items: sessionResults.length,
          completed_items: sessionResults.filter((r) => r.status !== "PENDING")
            .length,
          status: "SUBMITTED",
          created_by: user?.id || "unknown",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      showToast("success", "Submitted", "Checklist submitted successfully");
      onClose();
    } catch (err: any) {
      showToast(
        "error",
        "Submit Failed",
        err.message || "Could not submit checklist",
      );
    } finally {
      setSubmitting(false);
    }
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

  const activeResult = activeItemId ? results.get(activeItemId) : undefined;
  const activeStatus = (activeResult?.status ??
    "PENDING") as ChecklistItemStatus;

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

        {activeItemData && (
          <div
            className={`px-4 py-3 border-t ${isDark ? "border-slate-800 bg-indigo-950/30" : "border-slate-200 bg-indigo-50/50"}`}
          >
            <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone="indigo" className="text-[10px]">
                    {activeItemData.eqId}
                  </Badge>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                  >
                    {activeItemData.method}
                  </span>
                </div>
                <p
                  className={`text-xs font-medium leading-snug ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  <span
                    className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                  >
                    {activeItemData.item.sequence}.
                  </span>{" "}
                  {activeItemData.item.checklist_text}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {(
                  ["PASS", "REJECT", "NOTE", "N/A"] as ChecklistItemStatus[]
                ).map((s) => {
                  const sMeta = getStatusMetadata(s);
                  const isActive = activeStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        handleStatusChange(
                          activeItemData.item.id,
                          activeItemData.eqId,
                          activeItemData.method,
                          s,
                          s === "PASS" ? undefined : activeComment,
                        );
                        if (s !== "PASS" && s !== "N/A") {
                          // فوکوس روی کامنت
                        } else {
                          setActiveComment("");
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                        isActive
                          ? `text-white shadow-md scale-105`
                          : isDark
                            ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                      style={isActive ? { backgroundColor: sMeta.color } : {}}
                    >
                      <span className="text-sm">{sMeta.icon}</span>{" "}
                      {sMeta.label}
                    </button>
                  );
                })}
              </div>

              <div
                className={`flex items-center gap-1 shrink-0 border-l pl-3 ml-2 ${isDark ? "border-slate-700" : "border-slate-300"}`}
              >
                <button
                  onClick={() => navigateItem("prev")}
                  className={`p-1.5 rounded ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-600"}`}
                  title="Previous Item"
                >
                  ↑
                </button>
                <button
                  onClick={() => navigateItem("next")}
                  className={`p-1.5 rounded ${isDark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-600"}`}
                  title="Next Item"
                >
                  ↓
                </button>
              </div>
            </div>

            {activeStatus !== "PASS" && activeStatus !== "N/A" && (
              <div className="mt-2">
                <input
                  type="text"
                  value={activeComment}
                  onChange={(e) => setActiveComment(e.target.value)}
                  onBlur={() => {
                    const statusStr = activeStatus as string;
                    if (statusStr !== "PASS" && statusStr !== "N/A") {
                      handleStatusChange(
                        activeItemData.item.id,
                        activeItemData.eqId,
                        activeItemData.method,
                        activeStatus,
                        activeComment,
                      );
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const statusStr = activeStatus as string;
                      if (statusStr !== "PASS" && statusStr !== "N/A") {
                        handleStatusChange(
                          activeItemData.item.id,
                          activeItemData.eqId,
                          activeItemData.method,
                          activeStatus,
                          activeComment,
                        );
                      }
                    }
                  }}
                  placeholder="Add observation, Non-Conformity detail, or note here... (Auto-saves on blur or Enter)"
                  className={`w-full text-xs px-3 py-2 rounded-lg border ${isDark ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  autoFocus
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p
              className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              No items found for this selection.
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
                  {activeTab === "ALL" && (
                    <div
                      className={`px-4 py-2 border-b flex items-center justify-between ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}
                    >
                      <h3
                        className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {getMethodMetadata(group.groupName).icon}{" "}
                        {group.groupName}
                      </h3>
                      <Badge tone="slate" className="text-[10px]">
                        {groupCompleted}/{group.items.length}
                      </Badge>
                    </div>
                  )}

                  {activeTab !== "ALL" && (
                    <div
                      className={`px-4 py-2 border-b flex items-center justify-between ${isDark ? "bg-indigo-900/30 border-indigo-800" : "bg-indigo-50 border-indigo-200"}`}
                    >
                      <h3
                        className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                      >
                        📦 Equipment: {activeTab}
                      </h3>
                      <Badge tone="indigo" className="text-[10px]">
                        {groupCompleted}/{group.items.length} completed
                      </Badge>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {group.items.map((item) => {
                      const result = results.get(item.id);
                      const status = result?.status || "PENDING";
                      const config = getStatusMetadata(status);
                      const isActive = activeItemId === item.id;
                      const isReject = status === "REJECT";
                      const isNote = status === "NOTE";
                      const itemNonConformitySeverity =
                        NonConformitySeverity.get(item.id) || "MINOR";
                      const isNonConformitySubmitting =
                        NonConformitySubmitting.has(item.id);

                      return (
                        <div
                          key={item.id}
                          id={`checklist-item-${item.id}`}
                          onClick={() => handleItemSelect(item.id)}
                          className={`p-3 transition-all cursor-pointer ${
                            isActive
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
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.stopPropagation();
                                          handleNonConformitySubmit(item.id);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="Enter NonConformity description..."
                                      className={`w-full text-xs px-3 py-2 rounded-lg border mb-0 ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-300 text-slate-800"} focus:outline-none focus:ring-1 focus:ring-red-500`}
                                    />
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNonConformitySubmit(item.id);
                                      }}
                                      disabled={
                                        isNonConformitySubmitting ||
                                        !result?.comment
                                      }
                                      className="w-[200px] text-xs px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold"
                                    >
                                      {isNonConformitySubmitting
                                        ? "Submitting..."
                                        : "📝 Submit"}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Observation auto-save indicator for NOTE status */}
                              {isNote && (
                                <div
                                  className={`mt-2 p-2 rounded-lg border ${isDark ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs font-semibold ${isDark ? "text-blue-400" : "text-blue-700"}`}
                                    >
                                      ℹ️ Observation (Auto-saved as NOTE)
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
                                    onBlur={(e) => {
                                      e.stopPropagation();
                                      if (e.target.value.trim()) {
                                        handleObservationAutoSave(
                                          item.id,
                                          e.target.value.trim(),
                                        );
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.stopPropagation();
                                        const val = (
                                          e.target as HTMLInputElement
                                        ).value.trim();
                                        if (val) {
                                          handleObservationAutoSave(
                                            item.id,
                                            val,
                                          );
                                        }
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Enter observation details (auto-saved on blur/Enter)..."
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
                                    disabled={uploadingPhotos.has(item.id)}
                                    className={`text-[10px] px-2 py-1 rounded border transition-all ${
                                      uploadingPhotos.has(item.id)
                                        ? isDark
                                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : isDark
                                          ? "bg-indigo-900/30 border-indigo-700 text-indigo-400 hover:bg-indigo-900/50"
                                          : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                                    }`}
                                  >
                                    {uploadingPhotos.has(item.id)
                                      ? "⏳ Uploading..."
                                      : "➕ Upload Photo"}
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
                                        handlePhotoUpload(
                                          item.id,
                                          group.eqId,
                                          group.groupName,
                                          file,
                                        );
                                      }
                                      e.target.value = "";
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hidden"
                                  />
                                </div>

                                {/* Display uploaded photos */}
                                {photosByItem.get(item.id) &&
                                  photosByItem.get(item.id)!.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {photosByItem
                                        .get(item.id)!
                                        .map((photo) => (
                                          <div
                                            key={photo.id}
                                            className={`relative group w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
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
                                              window.open(
                                                photo.file_path,
                                                "_blank",
                                              );
                                            }}
                                          >
                                            <img
                                              src={photo.file_path}
                                              alt={photo.file_name}
                                              className="w-full h-full object-cover"
                                            />
                                            <div
                                              className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[8px] truncate ${
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
                                      if (isActiveStatus && s !== "PENDING") {
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
                                    className={`w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold transition-all ${
                                      isActiveStatus
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
                                    title={sMeta.label}
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
    </Modal>
  );
}
