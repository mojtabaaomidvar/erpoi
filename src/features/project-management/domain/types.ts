// src/features/project-management/domain/types.ts

export type ProjectRole = "PROJECT_MANAGER" | "COORDINATOR" | "INSPECTOR";

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  user?: {
    id: string;
    full_name?: string;
    username?: string;
    email?: string;
    role?: string;
  };
}

export interface ProjectClient {
  id: string;
  name_en: string;
  name_fa?: string;
}

export interface Project {
  id: string;
  name: string;
  client_id: string;
  contract_id: string;
  service_types: string[];
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  department?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;

  project_manager_id?: string | null;
  coordinator_id?: string | null;
  members?: ProjectMember[];
  client?: ProjectClient | null;
}
