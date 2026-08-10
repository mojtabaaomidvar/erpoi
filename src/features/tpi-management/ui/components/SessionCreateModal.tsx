// src/features/tpi-management/ui/components/SessionCreateModal.tsx

import { useState, useEffect, useMemo } from "react";
import { Modal, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { JalaaliDatePicker } from "@/shared/ui/JalaaliDatePicker";
import { METHOD_METADATA } from "@/features/inspection-management/constants";
import { showToast } from "@/shared/ui/ToastContainer";
import { getTodayJalali } from "@/shared/utils/dateUtils";
import { masterDataAppService } from "@/shared/application/MasterDataApplicationService";
import type { SystemListItem } from "@/shared/repositories/MasterDataRepository";
import { tpiRequestAppService } from "../../application";
import { equipmentAppService } from "../../application/EquipmentApplicationService";
import type { DisciplineGroup } from "../../application/EquipmentApplicationService";
import { InspectionStageSelector } from "./InspectionStageSelector";
import { InspectionMethodSelector } from "./InspectionMethodSelector";
import { GroupedEquipmentSelect } from "./GroupedEquipmentSelect";
import { EquipmentFreeSearch } from "./EquipmentFreeSearch";
import { VendorAutocomplete } from "../VendorAutocomplete";
import type { TPIRequest } from "../../domain/types";

interface SessionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: TPIRequest;
  existingStages: string[]; // all stages from all existing sessions (to suggest)
  existingMethods: string[]; // all methods from all existing sessions
  existingSubVendors?: string[]; // sub-vendors used in previous sessions
  onSubmit: (data: {
    session_date: string;
    stages: string[];
    methods: string[];
    equipment_ids: string[];
    sub_vendor: string;
    notes: string;
  }) => Promise<void>;
}

export function SessionCreateModal({
  isOpen,
  onClose,
  request,
  existingStages,
  existingMethods,
  existingSubVendors = [],
  onSubmit,
}: SessionCreateModalProps) {
  const { isDark } = useTheme();
  const todayString = getTodayJalali();

  // ── Previous session info (client + vendors) ─────────────────────────────
  const [details, setDetails] = useState<{
    clientName: string;
    vendorName: string | null;
  } | null>(null);

  // ── Master data (stages / methods from InspectionStageSelector & InspectionMethodSelector)
  const [loadedStages, setLoadedStages] = useState<SystemListItem[]>([]);
  const [loadedMethods, setLoadedMethods] = useState<SystemListItem[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // ── Equipment grouped by the request's disciplines (searchable box like TPIRequestForm)
  const [disciplineGroups, setDisciplineGroups] = useState<DisciplineGroup[]>(
    [],
  );
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  // Form state
  const [sessionDate, setSessionDate] = useState(todayString);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  // Equipment is kept as item NAMES for the searchable box; ids are derived on submit
  const [selectedEquipmentNames, setSelectedEquipmentNames] = useState<
    string[]
  >([]);
  const [subVendor, setSubVendor] = useState("");
  const [subVendorId, setSubVendorId] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // All methods available in code (METHOD_METADATA) — like InspectionMethodSelector sources
  const allMethods = useMemo(() => Object.keys(METHOD_METADATA), []);

  // name → id map so we submit real equipment ids (used by checklists)
  const equipmentIdMap = useMemo(() => {
    const map: Record<string, string> = {};
    disciplineGroups.forEach((dg) =>
      dg.categories.forEach((cat) =>
        cat.items.forEach((item) => {
          map[item.name] = item.id;
        }),
      ),
    );
    return map;
  }, [disciplineGroups]);

  // Stage options for InspectionStageSelector (master data + request + previous sessions)
  const stageOptionsList = useMemo(() => {
    const map = new Map<string, SystemListItem>();
    loadedStages.forEach((s) => map.set(s.value, s));
    [...(request.stages || []), ...existingStages].forEach((v) => {
      if (v && !map.has(v)) {
        map.set(v, {
          id: `stage_${v}`,
          category: "TPI_INSPECTION_STAGE",
          value: v,
          is_active: true,
          created_at: "",
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.value.localeCompare(b.value),
    );
  }, [loadedStages, request.stages, existingStages]);

  // Method options for InspectionMethodSelector (master data + all code methods + previous sessions)
  const methodOptionsList = useMemo(() => {
    const map = new Map<string, SystemListItem>();
    loadedMethods.forEach((m) => map.set(m.value, m));
    [...allMethods, ...(request.methods || []), ...existingMethods].forEach(
      (v) => {
        if (v && !map.has(v)) {
          map.set(v, {
            id: `method_${v}`,
            category: "TPI_INSPECTION_METHOD",
            value: v,
            is_active: true,
            created_at: "",
          });
        }
      },
    );
    return Array.from(map.values()).sort((a, b) =>
      a.value.localeCompare(b.value),
    );
  }, [loadedMethods, allMethods, request.methods, existingMethods]);

  // Load everything when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    setSessionDate(todayString);
    setSelectedStages([...(request.stages || [])]);
    setSelectedMethods([...(request.methods || [])]);
    setSubVendor("");
    setSubVendorId("");
    setSessionNotes("");
    setDetails(null);

    // 1) Previous session info: client + vendor names
    tpiRequestAppService
      .getTPIRequestDetails(request.id)
      .then((d) =>
        setDetails({ clientName: d.clientName, vendorName: d.vendorName }),
      )
      .catch(() => setDetails({ clientName: "—", vendorName: null }));

    // 2) Master data for stages / methods selectors
    setLoadingMaster(true);
    Promise.all([
      masterDataAppService.getTPIInspectionStages(),
      masterDataAppService.getTPIInspectionMethods(),
    ])
      .then(([stages, methods]) => {
        setLoadedStages(stages);
        setLoadedMethods(methods);
      })
      .catch(() => {
        setLoadedStages([]);
        setLoadedMethods([]);
      })
      .finally(() => setLoadingMaster(false));

    // 3) Equipment grouped by the request's disciplines (e.g. Mechanical → all mechanical items)
    const disciplines = request.disciplines || [];
    setLoadingEquipment(true);
    equipmentAppService
      .getGroupedEquipmentByDisciplines(disciplines)
      .then((groups) => {
        setDisciplineGroups(groups);
        // Pre-select the request's equipment ids → names (reverse lookup)
        const nameById = new Map<string, string>();
        groups.forEach((g) =>
          g.categories.forEach((c) =>
            c.items.forEach((i) => nameById.set(i.id, i.name)),
          ),
        );
        const ids = (request as any).equipment_type_id;
        const names = Array.isArray(ids)
          ? ids.map((id: string) => nameById.get(id) || id)
          : [];
        setSelectedEquipmentNames([...new Set(names)]);
      })
      .catch(() => {
        setDisciplineGroups([]);
        setSelectedEquipmentNames([]);
      })
      .finally(() => setLoadingEquipment(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, request.id]);

  const handleSubmit = async () => {
    if (!sessionDate) {
      showToast("error", "Validation", "Session date is required");
      return;
    }
    if (selectedStages.length === 0) {
      showToast("error", "Validation", "At least one stage is required");
      return;
    }
    if (selectedMethods.length === 0) {
      showToast("error", "Validation", "At least one method is required");
      return;
    }

    // Map selected equipment names → real equipment ids
    const equipmentIds = selectedEquipmentNames.map(
      (name) => equipmentIdMap[name] || name,
    );

    setSubmitting(true);
    try {
      await onSubmit({
        session_date: sessionDate,
        stages: selectedStages,
        methods: selectedMethods,
        equipment_ids: equipmentIds,
        sub_vendor: subVendor.trim(),
        notes: sessionNotes,
      });
      showToast("success", "Created", "Session created successfully");
      onClose();
    } catch (err: any) {
      showToast("error", "Failed", err.message || "Could not create session");
    } finally {
      setSubmitting(false);
    }
  };

  const subVendors = useMemo(
    () => [...new Set(existingSubVendors.filter(Boolean))],
    [existingSubVendors],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🆕 New Inspection Session"
      size="xl"
    >
      <div className="space-y-5 p-2 max-h-[70vh] overflow-y-auto">
        {/* ── Previous Session Info (client + vendors) ── */}
        <div
          className={`rounded-xl border p-4 ${
            isDark
              ? "border-indigo-700/40 bg-indigo-900/10"
              : "border-indigo-200 bg-indigo-50/50"
          }`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
              isDark ? "text-indigo-300" : "text-indigo-600"
            }`}
          >
            📋 Previous Session Info
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Client */}
            <div>
              <p
                className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                🏢 Client
              </p>
              <p
                className={`text-sm font-semibold mt-0.5 ${
                  isDark ? "text-slate-100" : "text-slate-800"
                }`}
              >
                {details ? details.clientName : "…"}
              </p>
            </div>
            {/* Main vendor */}
            <div>
              <p
                className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                🏭 Vendor
              </p>
              <p
                className={`text-sm font-semibold mt-0.5 ${
                  isDark ? "text-slate-100" : "text-slate-800"
                }`}
              >
                {details ? details.vendorName || "—" : "…"}
              </p>
            </div>
            {/* Sub-vendors from previous sessions */}
            <div>
              <p
                className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                🏭 Sub-Vendors (previous)
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {subVendors.length === 0 ? (
                  <span
                    className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    —
                  </span>
                ) : (
                  subVendors.map((v) => (
                    <span
                      key={v}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                        isDark
                          ? "bg-amber-900/40 text-amber-300"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      🏭 {v}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Date */}
        <div>
          <label
            className={`text-xs font-semibold block mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            📅 Session Date *
          </label>
          <JalaaliDatePicker
            value={sessionDate}
            onChange={setSessionDate}
            placeholder="Select session date"
            minDate={request.inspection_date?.replace(/-/g, "/")}
          />
          <p
            className={`text-[10px] mt-1 ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Planned date: {request.inspection_date?.replace(/-/g, "/")}
          </p>
        </div>

        {/* Sub-vendor */}
        <div>
          <label
            className={`text-xs font-semibold block mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            🏭 Sub-Vendor{" "}
            <span className="font-normal opacity-70">(optional)</span>
          </label>
          <VendorAutocomplete
            value={subVendorId}
            onChange={(id: string) => {
              setSubVendorId(id);
              if (!id) setSubVendor("");
            }}
            onSelectVendor={(vendor) => setSubVendor(vendor.name)}
          />
          <p
            className={`text-[10px] mt-1 ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Pick a sub-vendor from the vendors list (or type to create a new
            vendor). Main vendor is fixed from the request — leave empty if no
            sub-vendor.
          </p>
        </div>

        {/* Stages — InspectionStageSelector (all stages, card grid) */}
        <div>
          <label
            className={`text-xs font-semibold block mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            ⚙️ Stages * ({selectedStages.length} selected)
          </label>
          <InspectionStageSelector
            options={stageOptionsList}
            value={selectedStages}
            onChange={setSelectedStages}
            isLoading={loadingMaster}
            compact
          />
        </div>

        {/* Methods — InspectionMethodSelector (all methods, card grid) */}
        <div>
          <label
            className={`text-xs font-semibold block mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            🔬 Methods * ({selectedMethods.length} selected)
          </label>
          <InspectionMethodSelector
            options={methodOptionsList}
            value={selectedMethods}
            onChange={setSelectedMethods}
            isLoading={loadingMaster}
            compact
          />
        </div>

        {/* Equipment — searchable box like TPIRequestForm, filtered by request disciplines */}
        <div>
          <label
            className={`text-xs font-semibold block mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            🔧 Equipment ({selectedEquipmentNames.length} selected)
          </label>
          <p
            className={`text-[10px] mb-1.5 ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {request.disciplines && request.disciplines.length > 0
              ? `All equipment of: ${request.disciplines.join(", ")}`
              : "💡 Start typing to search all equipment — discipline will be auto-detected"}
          </p>
          {request.disciplines && request.disciplines.length > 0 ? (
            <GroupedEquipmentSelect
              disciplineGroups={disciplineGroups}
              isLoading={loadingEquipment}
              value={selectedEquipmentNames}
              onChange={(names: string[]) => setSelectedEquipmentNames(names)}
            />
          ) : (
            <EquipmentFreeSearch
              value={selectedEquipmentNames}
              onChange={(names: string[]) => setSelectedEquipmentNames(names)}
            />
          )}
        </div>

        {/* Notes */}
        <div>
          <label
            className={`text-xs font-semibold block mb-1.5 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            📝 Notes
          </label>
          <textarea
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            rows={3}
            className={`w-full text-sm px-3 py-2 rounded-lg border resize-none ${
              isDark
                ? "bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-500"
                : "bg-white border-slate-300 text-slate-800 placeholder-slate-400"
            } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
            placeholder="Optional notes for this session..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t mt-2 border-slate-200 dark:border-slate-700">
        <Button
          variant="outline"
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
          disabled={
            submitting ||
            !sessionDate ||
            selectedStages.length === 0 ||
            selectedMethods.length === 0
          }
        >
          {submitting ? "⏳ Creating..." : "✅ Create Session"}
        </Button>
      </div>
    </Modal>
  );
}
