// src/features/project-management/domain/types.ts

export type ProjectRole = "PROJECT_MANAGER" | "COORDINATOR" | "INSPECTOR";
export type InspectionCategory = "TPI" | "MWS";

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  assigned_at: string;
  user?: {
    id: string;
    full_name: string;
    username: string;
    email: string;
  };
}

export interface Project {
  id: string;
  name: string;
  contract_id: string;
  client_id: string;
  service_types: InspectionCategory[];
  description?: string;
  start_date?: string;
  end_date?: string;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";
  created_by?: string;
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  reason?: string;
  created_at: string;
}
