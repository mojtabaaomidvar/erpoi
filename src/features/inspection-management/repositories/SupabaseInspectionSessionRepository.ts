// src/features/inspection-management/repositories/SupabaseInspectionSessionRepository.ts

import { supabase } from "@shared/database/supabase";
import type {
  InspectionSession,
  CreateSessionCommand,
  DeleteInspectionSessionCommand,
} from "../domain/models/InspectionSession";
import type { IInspectionSessionRepository } from "./IInspectionSessionRepository";

export class SupabaseInspectionSessionRepository implements IInspectionSessionRepository {
  async getByRequestId(requestId: string): Promise<InspectionSession[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspection_sessions")
      .select("*")
      .eq("tpi_request_id", requestId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const rows = (data || []) as any[];

    // Some environments may not have the session_number column yet.
    // Derive it from the array index (1-based) when it's missing.
    return rows.map((row, index) => ({
      ...row,
      session_number:
        typeof row.session_number === "number" && row.session_number > 0
          ? row.session_number
          : index + 1,
    })) as InspectionSession[];
  }

  async getById(sessionId: string): Promise<InspectionSession | null> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspection_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("is_deleted", false)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    const row = data as any;
    return {
      ...row,
      session_number:
        typeof row?.session_number === "number" && row.session_number > 0
          ? row.session_number
          : 1,
    } as InspectionSession;
  }

  async getNextSessionNumber(requestId: string): Promise<number> {
    // Prefer the dedicated column when available
    try {
      const { data, error } = await supabase
        .schema("inspection")
        .from("inspection_sessions")
        .select("session_number")
        .eq("tpi_request_id", requestId)
        .order("session_number", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const num = (data[0] as any)?.session_number;
        if (typeof num === "number" && num > 0) return num + 1;
      }
    } catch {
      // column missing → fall through to count-based fallback
    }

    // Fallback: count existing sessions + 1 (works without session_number column)
    const { count, error } = await supabase
      .schema("inspection")
      .from("inspection_sessions")
      .select("*", { count: "exact", head: true })
      .eq("tpi_request_id", requestId);

    if (error) throw new Error(error.message);
    return (count || 0) + 1;
  }

  async create(
    command: CreateSessionCommand & { id: string; session_number: number },
  ): Promise<InspectionSession> {
    const now = new Date().toISOString();
    const row = {
      id: command.id,
      tpi_request_id: command.tpi_request_id,
      session_number: command.session_number,
      session_date: command.session_date,
      stages: command.stages,
      methods: command.methods,
      equipment_ids: command.equipment_ids,
      status: "SCHEDULED",
      is_deleted: false,
      sub_vendor: command.sub_vendor || null,
      notes: command.notes || null,
      created_at: now,
      updated_at: now,
    };

    // Try inserting with session_number; if the column is missing, retry without it
    const insert = async (withNumber: boolean) => {
      const payload: Record<string, unknown> = withNumber
        ? { ...row }
        : (() => {
            const { session_number: _sessionNumber, ...rest } = row;
            return { ...rest };
          })();
      return supabase
        .schema("inspection")
        .from("inspection_sessions")
        .insert(payload as any)
        .select()
        .single();
    };

    let result = await insert(true);
    if (result.error && /session_number/.test(result.error.message)) {
      result = await insert(false);
    }

    if (result.error) throw new Error(result.error.message);

    const data = result.data as any;
    return {
      ...data,
      session_number:
        typeof data?.session_number === "number" && data.session_number > 0
          ? data.session_number
          : command.session_number,
    } as InspectionSession;
  }

  async update(
    sessionId: string,
    data: Partial<
      Pick<
        InspectionSession,
        | "status"
        | "notes"
        | "session_date"
        | "stages"
        | "methods"
        | "equipment_ids"
        | "sub_vendor"
      >
    >,
  ): Promise<InspectionSession> {
    const { data: updated, error } = await supabase
      .schema("inspection")
      .from("inspection_sessions")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as InspectionSession;
  }

  async cancel(sessionId: string): Promise<void> {
    const { error } = await supabase
      .schema("inspection")
      .from("inspection_sessions")
      .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) throw new Error(error.message);
  }

  async softDelete(
    sessionId: string,
    command: DeleteInspectionSessionCommand,
  ): Promise<void> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspection_sessions")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: command.deleted_by,
        deletion_reason: command.reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("is_deleted", false)
      .select("id");

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      throw new Error("Inspection session not found or already deleted");
    }
  }
}

export const inspectionSessionRepository =
  new SupabaseInspectionSessionRepository();
