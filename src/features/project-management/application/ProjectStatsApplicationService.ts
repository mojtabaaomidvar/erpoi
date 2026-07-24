// src/features/project-management/application/ProjectStatsApplicationService.ts

import type { IProjectStatsRepository } from "../repositories/IProjectStatsRepository";
import type { ProjectStats } from "./../domain/models/ProjectStats";

export class ProjectStatsApplicationService {
  constructor(private readonly statsRepository: IProjectStatsRepository) {}

  async getProjectStats(projectId: string): Promise<ProjectStats> {
    return await this.statsRepository.getProjectStats(projectId);
  }
}
