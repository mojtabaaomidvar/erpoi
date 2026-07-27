//src/features/inspector-managment/domain/models/Inspector.ts

export type InspectorType = "ICS_MEMBER" | "FREELANCE";
export type InspectorStatus =
  | "AVAILABLE"
  | "ON_MISSION"
  | "ON_LEAVE"
  | "INACTIVE";

export interface Inspector {
  id: string;
  name_en: string;
  name_fa?: string;
  inspector_type: InspectorType;
  status: InspectorStatus;
  specialties: InspectorSpecialty[];
  phone: string;
  email?: string;
  location_base?: string;
  user_id?: string;
  personnel_code?: string;
  resume_name?: string;
  resume_url?: string;
  resume_size?: number;
  resumeFile?: File | null;
  resume_uploaded_at?: string;
  rating: number;
  completed_inspections: number;
  active_missions: number;
  current_contract_id?: string;
  created_at?: string;
  updated_at?: string;
}

export type InspectorSpecialty =
  // --- TPI Specialties ---
  | "General"
  | "Mechanical"
  | "Dimensional"
  | "Welding"
  | "Paint & Coating"
  | "Civil"
  | "Piping"
  | "Electrical"
  | "Instrumentation"
  | "Structure"
  | "Process"
  | "Safety"
  | "Material"
  | "HVAC"
  | "Architecture"
  | "Telecommunication"
  // --- MWS Specialties ---
  | "MWS";
export const INSPECTOR_SPECIALTY_OPTIONS: InspectorSpecialty[] = [
  "General",
  "Mechanical",
  "Dimensional",
  "Welding",
  "Paint & Coating",
  "Civil",
  "Piping",
  "Electrical",
  "Instrumentation",
  "Structure",
  "Process",
  "Safety",
  "Material",
  "HVAC",
  "Architecture",
  "Telecommunication",
  "MWS",
];
