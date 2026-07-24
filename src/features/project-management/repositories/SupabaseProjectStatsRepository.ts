//src/features/project-management/repositories/SupabaseProjectStatsRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ProjectStats } from "../domain/models/ProjectStats";
import type { IProjectStatsRepository } from "../repositories/IProjectStatsRepository";

export class SupabaseProjectStatsRepository implements IProjectStatsRepository {
  async getProjectStats(projectId: string): Promise<ProjectStats> {
    const { data: inspections, error } = await supabase
      .schema("inspection")
      .from("inspection_requests")
      .select("category, inspection_mode, status")
      .eq("project_id", projectId);

    if (error) {
      throw new Error(`Failed to fetch project stats: ${error.message}`);
    }

    const stats: ProjectStats = {
      total_inspections: inspections?.length || 0,
      tpi_spot_count: 0,
      tpi_resident_count: 0,
      mws_count: 0,
      tpi_spot_man_days: 0,
      tpi_resident_man_days: 0,
      mws_man_days: 0,
      total_man_days: 0,
      completed_inspections: 0,
      pending_inspections: 0,
      in_progress_inspections: 0,
    };

    inspections?.forEach((insp: any) => {
      if (insp.category === "TPI" && insp.inspection_mode === "SPOT") {
        stats.tpi_spot_count++;
        stats.tpi_spot_man_days += 1;
      } else if (
        insp.category === "TPI" &&
        insp.inspection_mode === "RESIDENT"
      ) {
        stats.tpi_resident_count++;
        stats.tpi_resident_man_days += 1;
      } else if (insp.category === "MWS") {
        stats.mws_count++;
        stats.mws_man_days += 1;
      }

      stats.total_man_days += 1;

      if (insp.status === "COMPLETED") {
        stats.completed_inspections++;
      } else if (
        insp.status === "PENDING" ||
        insp.status === "DOCUMENT_REVIEW"
      ) {
        stats.pending_inspections++;
      } else if (insp.status === "IN_PROGRESS" || insp.status === "APPROVED") {
        stats.in_progress_inspections++;
      }
    });

    return stats;
  }
}
