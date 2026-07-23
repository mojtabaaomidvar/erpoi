// src/features/project-management/application/ProjectStatsApplicationService.ts

import { supabase } from "@shared/database/supabase";

export interface ProjectStats {
  total_inspections: number;
  tpi_spot_count: number;
  tpi_resident_count: number;
  mws_count: number;
  tpi_spot_man_days: number;
  tpi_resident_man_days: number;
  mws_man_days: number;
  total_man_days: number;
  completed_inspections: number;
  pending_inspections: number;
  in_progress_inspections: number;
}

class ProjectStatsApplicationService {
  async getProjectStats(projectId: string): Promise<ProjectStats> {
    const { data: inspections, error } = await supabase
      .from('inspection.inspection_requests')
      .select("*")
      .eq("project_id", projectId);

    if (error) throw new Error(error.message);

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

export const projectStatsAppService = new ProjectStatsApplicationService();
