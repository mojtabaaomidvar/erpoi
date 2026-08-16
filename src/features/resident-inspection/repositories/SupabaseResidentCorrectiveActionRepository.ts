// src/features/resident-inspection/repositories/SupabaseResidentCorrectiveActionRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ResidentCorrectiveAction } from "../domain/types";
import type { IResidentCorrectiveActionRepository } from "./IResidentCorrectiveActionRepository";

export class SupabaseResidentCorrectiveActionRepository implements IResidentCorrectiveActionRepository {
  private table() {
    return supabase.schema("tpi").from("resident_corrective_actions");
  }

  async getById(id: string): Promise<ResidentCorrectiveAction | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as ResidentCorrectiveAction;
  }

  async getByIssue(issueId: string): Promise<ResidentCorrectiveAction[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_quality_issue_id", issueId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ResidentCorrectiveAction[]) || [];
  }

  async getByIssues(
    issueIds: readonly string[],
  ): Promise<ResidentCorrectiveAction[]> {
    if (issueIds.length === 0) return [];

    const { data, error } = await this.table()
      .select("*")
      .in("resident_quality_issue_id", [...issueIds])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ResidentCorrectiveAction[]) || [];
  }

  async getOverdue(): Promise<ResidentCorrectiveAction[]> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await this.table()
      .select("*")
      .lt("planned_completion_date", today)
      .in("status", ["PENDING", "IN_PROGRESS"])
      .order("planned_completion_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ResidentCorrectiveAction[]) || [];
  }

  async create(
    data: Omit<ResidentCorrectiveAction, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentCorrectiveAction> {
    const id = `res_ca_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: record, error } = await this.table()
      .insert({
        id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return record as ResidentCorrectiveAction;
  }

  async update(
    id: string,
    data: Partial<ResidentCorrectiveAction>,
  ): Promise<ResidentCorrectiveAction> {
    const { data: record, error } = await this.table()
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return record as ResidentCorrectiveAction;
  }
}

export const residentCorrectiveActionRepository =
  new SupabaseResidentCorrectiveActionRepository();
