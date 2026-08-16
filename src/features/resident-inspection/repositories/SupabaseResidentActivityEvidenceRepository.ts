// src/features/resident-inspection/repositories/SupabaseResidentActivityEvidenceRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ResidentActivityEvidence } from "../domain/types";
import type { IResidentActivityEvidenceRepository } from "./IResidentActivityEvidenceRepository";

export class SupabaseResidentActivityEvidenceRepository implements IResidentActivityEvidenceRepository {
  private table() {
    return supabase.schema("tpi").from("resident_activity_evidence");
  }

  async getByActivityIds(
    activityIds: readonly string[],
  ): Promise<ResidentActivityEvidence[]> {
    if (activityIds.length === 0) return [];

    const { data, error } = await this.table()
      .select("*")
      .in("resident_daily_activity_id", [...activityIds])
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as ResidentActivityEvidence[]) || [];
  }
}

export const residentActivityEvidenceRepository =
  new SupabaseResidentActivityEvidenceRepository();
