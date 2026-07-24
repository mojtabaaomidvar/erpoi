//src/features/project-management/domain/models/ProjectStats.ts

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