//src/features/project-management/domain/repositories/IProjectStatsRepository.ts

import type { ProjectStats } from "../domain/models/ProjectStats";

export interface IProjectStatsRepository {
  getProjectStats(projectId: string): Promise<ProjectStats>;
}
