// src/features/project-management/index.ts

import { SupabaseProjectRepository } from "./repositories/SupabaseProjectRepository";
import { ProjectApplicationService } from "./application/ProjectApplicationService";
import { SupabaseProjectStatsRepository } from "./repositories/SupabaseProjectStatsRepository";
import { ProjectStatsApplicationService } from "./application/ProjectStatsApplicationService";

const projectRepository = new SupabaseProjectRepository();
const projectStatsRepository = new SupabaseProjectStatsRepository();

export const projectAppService = new ProjectApplicationService(
  projectRepository,
);
export const projectStatsAppService = new ProjectStatsApplicationService(
  projectStatsRepository,
);

export * from "./domain/types";
export * from "./repositories/IProjectRepository";
export * from "./application/dto/CreateProjectCommand";
export * from "./domain/models/ProjectStats";
export * from "./repositories/IProjectStatsRepository";
