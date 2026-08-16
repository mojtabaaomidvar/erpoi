import { supabase } from "@shared/database/supabase";
import type { ChecklistItemResult } from "../domain/checklistTypes";
import type {
  Finding,
  FindingDocumentReference,
  FindingKind,
  FindingStatus,
  FindingUpdate,
} from "../domain/models/Finding";
import { normalizeFindingClassification } from "../domain/models/Finding";
import type {
  CreateNcrFindingCommand,
  CreateObservationFindingCommand,
  FindingTransitionPersistence,
  IFindingRepository,
} from "./IFindingRepository";

type FindingRow = Record<string, any>;

const tableFor = (kind: FindingKind) =>
  kind === "NCR" ? "non_conformities" : "observations";

const optional = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const documentReferences = (value: unknown): FindingDocumentReference[] =>
  Array.isArray(value) ? (value as FindingDocumentReference[]) : [];

function mapRow(row: FindingRow, kind: FindingKind): Finding {
  const description = kind === "NCR" ? row.description : row.observation_text;
  const rawClassification =
    kind === "NCR"
      ? row.severity || "MINOR"
      : row.classification || "OBSERVATION";

  return {
    id: row.id,
    kind,
    number: optional(row.ncr_number),
    revision: row.revision || "0",
    requestId: row.request_id || row.inspection_id || "",
    sessionId: row.session_id,
    equipmentId: optional(row.equipment_id),
    inspectionMethod: optional(row.inspection_method),
    checklistItemId: optional(row.checklist_item_id),
    checklistText: optional(row.checklist_text),
    title: row.title || (kind === "NCR" ? "Non-Conformity" : "Observation"),
    description: description || "",
    classification: normalizeFindingClassification(rawClassification),
    category: optional(row.category),
    locationFound: optional(row.location_found),
    evidence: optional(row.evidence),
    photos: Array.isArray(row.photos) ? row.photos : [],
    documentReferences: documentReferences(row.document_references),
    immediateContainment: optional(row.immediate_containment),
    correctiveAction: optional(row.corrective_action),
    targetCompletionDate: optional(row.target_completion_date),
    responsiblePerson: optional(row.responsible_person),
    rootCause: optional(row.root_cause),
    preventiveAction: optional(row.preventive_action),
    verification: optional(row.verification),
    closeoutDecision: row.closeout_decision || undefined,
    closeoutNote: optional(row.closeout_note),
    closeoutDate: optional(row.closeout_date),
    status: (row.status || "OPEN") as FindingStatus,
    closedBy: optional(row.closed_by),
    closedAt: optional(row.closed_at),
    createdBy: row.created_by || "unknown",
    createdAt: row.created_at || new Date(0).toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date(0).toISOString(),
  };
}

function mapUpdate(update: FindingUpdate, kind: FindingKind): FindingRow {
  const row: FindingRow = {};
  if (update.title !== undefined) row.title = update.title;
  if (update.description !== undefined) {
    row[kind === "NCR" ? "description" : "observation_text"] =
      update.description;
  }
  if (update.classification !== undefined) {
    row[kind === "NCR" ? "severity" : "classification"] = update.classification;
  }
  if (update.category !== undefined) row.category = update.category;
  if (update.locationFound !== undefined)
    row.location_found = update.locationFound;
  if (update.evidence !== undefined) row.evidence = update.evidence;
  if (update.photos !== undefined) row.photos = update.photos;
  if (update.documentReferences !== undefined) {
    row.document_references = update.documentReferences;
  }
  if (update.immediateContainment !== undefined) {
    row.immediate_containment = update.immediateContainment;
  }
  if (update.correctiveAction !== undefined)
    row.corrective_action = update.correctiveAction;
  if (update.targetCompletionDate !== undefined) {
    row.target_completion_date = update.targetCompletionDate || null;
  }
  if (update.responsiblePerson !== undefined) {
    row.responsible_person = update.responsiblePerson;
  }
  if (update.rootCause !== undefined && kind === "NCR")
    row.root_cause = update.rootCause;
  if (update.preventiveAction !== undefined && kind === "NCR") {
    row.preventive_action = update.preventiveAction;
  }
  if (update.verification !== undefined) row.verification = update.verification;
  if (update.closeoutDecision !== undefined) {
    row.closeout_decision = update.closeoutDecision;
  }
  if (update.closeoutNote !== undefined)
    row.closeout_note = update.closeoutNote;
  if (update.closeoutDate !== undefined)
    row.closeout_date = update.closeoutDate || null;
  return row;
}

export class SupabaseFindingRepository implements IFindingRepository {
  private async generateNcrNumber(projectCode?: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = projectCode ? `${projectCode}NC` : `NCR-${year}-`;
    const padding = projectCode ? 2 : 4;
    const { data, error } = await supabase
      .schema("inspection")
      .from("non_conformities")
      .select("ncr_number")
      .like("ncr_number", `${prefix}%`)
      .order("ncr_number", { ascending: false })
      .limit(1);

    if (error) throw new Error(error.message);
    const last = data?.[0]?.ncr_number as string | undefined;
    const parsed = last ? Number.parseInt(last.slice(prefix.length), 10) : 0;
    const sequence = Number.isFinite(parsed) ? parsed + 1 : 1;
    return `${prefix}${sequence.toString().padStart(padding, "0")}`;
  }

  async createNcr(command: CreateNcrFindingCommand): Promise<Finding> {
    const existing = await this.getByChecklistSource(
      command.result.request_id || "",
      "NCR",
      command.result,
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const requestId = command.result.request_id || "";
    const row = {
      id: `ncr_${crypto.randomUUID()}`,
      // Legacy column kept in sync for backward compatibility with the live
      // database schema, where inspection_id is still NOT NULL.
      inspection_id: requestId,
      request_id: requestId,
      session_id: command.result.session_id || null,
      ncr_number: await this.generateNcrNumber(command.projectCode),
      revision: "0",
      equipment_id: command.result.equipment_id,
      inspection_method: command.result.inspection_method,
      checklist_item_id: command.result.item_id,
      checklist_text: command.result.checklist_text || "",
      title: command.title,
      description: command.description,
      severity: command.classification,
      category: command.category,
      status: "OPEN",
      photos: command.result.photo_urls || [],
      created_by: command.createdBy,
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await supabase
      .schema("inspection")
      .from("non_conformities")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data, "NCR");
  }

  async createObservation(
    command: CreateObservationFindingCommand,
  ): Promise<Finding> {
    const existing = await this.getByChecklistSource(
      command.result.request_id || "",
      "OBSERVATION",
      command.result,
    );
    if (existing) {
      if (existing.description === command.observationText) return existing;
      return this.update(existing.id, "OBSERVATION", {
        description: command.observationText,
        category: command.category,
      });
    }

    const now = new Date().toISOString();
    const row = {
      id: `obs_${crypto.randomUUID()}`,
      request_id: command.result.request_id || "",
      session_id: command.result.session_id || null,
      equipment_id: command.result.equipment_id,
      inspection_method: command.result.inspection_method,
      checklist_item_id: command.result.item_id,
      checklist_text: command.result.checklist_text || "",
      title: command.category || "Observation",
      observation_text: command.observationText,
      classification: "OBSERVATION",
      category: command.category,
      status: "OPEN",
      photos: command.result.photo_urls || [],
      created_by: command.createdBy,
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await supabase
      .schema("inspection")
      .from("observations")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data, "OBSERVATION");
  }

  async getByRequestId(requestId: string): Promise<Finding[]> {
    const [ncrResult, observationResult] = await Promise.all([
      supabase
        .schema("inspection")
        .from("non_conformities")
        .select("*")
        .or(`request_id.eq.${requestId},inspection_id.eq.${requestId}`)
        .order("created_at", { ascending: false }),
      supabase
        .schema("inspection")
        .from("observations")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false }),
    ]);
    if (ncrResult.error) throw new Error(ncrResult.error.message);
    if (observationResult.error)
      throw new Error(observationResult.error.message);

    return [
      ...(ncrResult.data || []).map((row) => mapRow(row, "NCR")),
      ...(observationResult.data || []).map((row) =>
        mapRow(row, "OBSERVATION"),
      ),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getByChecklistSource(
    requestId: string,
    kind: FindingKind,
    result: ChecklistItemResult,
  ): Promise<Finding | null> {
    let query = supabase
      .schema("inspection")
      .from(tableFor(kind))
      .select("*")
      .eq("request_id", requestId)
      .eq("equipment_id", result.equipment_id)
      .eq("inspection_method", result.inspection_method)
      .eq("checklist_item_id", result.item_id);
    query = result.session_id
      ? query.eq("session_id", result.session_id)
      : query.is("session_id", null);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRow(data, kind) : null;
  }

  async update(
    findingId: string,
    kind: FindingKind,
    update: FindingUpdate,
  ): Promise<Finding> {
    const { data, error } = await supabase
      .schema("inspection")
      .from(tableFor(kind))
      .update({
        ...mapUpdate(update, kind),
        updated_at: new Date().toISOString(),
      })
      .eq("id", findingId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data, kind);
  }

  async transition(
    findingId: string,
    kind: FindingKind,
    transition: FindingTransitionPersistence,
  ): Promise<Finding> {
    const terminal =
      transition.status === "CLOSED" || transition.status === "REJECTED";
    const { data, error } = await supabase
      .schema("inspection")
      .from(tableFor(kind))
      .update({
        status: transition.status,
        closed_by: terminal ? transition.actorId : null,
        closed_at: terminal
          ? transition.closedAt || new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", findingId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapRow(data, kind);
  }
}

export const findingRepository = new SupabaseFindingRepository();
