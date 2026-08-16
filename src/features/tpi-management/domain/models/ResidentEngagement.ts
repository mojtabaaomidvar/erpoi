// src/features/tpi-management/domain/models/ResidentEngagement.ts

export type ResidentEngagementStatus =
  | "DRAFT"
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETED"
  | "CLOSED"
  | "SUSPENDED"
  | "CANCELLED";

export type ResidentAssignmentStatus =
  | "ASSIGNED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "RELIEVED";

export type ResidentActivityType =
  | "INSPECTION"
  | "SURVEILLANCE"
  | "MEETING"
  | "DOCUMENT_REVIEW"
  | "SITE_WALK"
  | "WITNESS_POINT"
  | "HOLD_POINT"
  | "TRAINING"
  | "OTHER";

export type ResidentActivityStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DEFERRED";

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "LEAVE"
  | "SICK"
  | "REMOTE";

export type ManDayActivityType =
  | "INSPECTION"
  | "DOCUMENTATION"
  | "MEETING"
  | "SITE_SUPERVISION"
  | "REPORTING"
  | "TRAVEL"
  | "OTHER";

export type QualityIssueSeverity = "MINOR" | "MAJOR" | "CRITICAL";

export type QualityIssueStatus =
  | "OPEN"
  | "CORRECTIVE_ACTION"
  | "VERIFICATION"
  | "CLOSED"
  | "REJECTED";

export type CorrectiveActionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "ACCEPTED"
  | "REJECTED"
  | "OVERDUE";

export type ITPPointType = "HOLD" | "WITNESS" | "SURVEILLANCE" | "REVIEW";

export type ITPMonitoringStatus =
  | "PENDING"
  | "SATISFIED"
  | "WAIVED"
  | "FAILED"
  | "DEFERRED";

export type LookaheadActivityStatus =
  | "PLANNED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "DEFERRED";

export type PeriodicReportStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export type PeriodicReportType = "DAILY" | "WEEKLY" | "MONTHLY" | "FINAL";

export type CloseoutStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface ResidentEngagement {
  id: string;
  project_id: string;
  client_id: string;
  contract_id: string;
  department?: string;
  title: string;
  site_representative_id?: string;
  disciplines: string[];
  inspection_scope_ids: string[];
  inspection_scopes: string[];
  description?: string;
  location?: string;
  site_address?: string;
  scope_of_work?: string;
  notes?: string;
  deliverables?: string[];
  planned_start_date: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status: ResidentEngagementStatus;
  lead_inspector_id?: string;
  client_representative?: string;
  client_contact_info?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  closed_by?: string;
  closed_at?: string;
  closure_reason?: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
  deletion_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResidentAssignment {
  id: string;
  resident_engagement_id: string;
  inspector_id: string;
  assignment_date: string;
  planned_start_date: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  planned_hours_per_day: number;
  status: ResidentAssignmentStatus;
  role_description?: string;
  disciplines: string[];
  location?: string;
  assigned_by?: string;
  assigned_at?: string;
  relieved_by?: string;
  relieved_at?: string;
  relieved_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ResidentDailyActivity {
  id: string;
  resident_engagement_id: string;
  resident_assignment_id?: string;
  inspector_id: string;
  activity_date: string;
  activity_type: ResidentActivityType;
  title: string;
  description?: string;
  location?: string;
  vendor_or_site?: string;
  reference_document?: string;
  planned_start_time?: string;
  planned_end_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  hours_spent: number;
  status: ResidentActivityStatus;
  outcome?: string;
  notes?: string;
  weather_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface ResidentManDay {
  id: string;
  resident_engagement_id: string;
  resident_assignment_id: string;
  inspector_id: string;
  work_date: string;
  attendance_status: AttendanceStatus;
  activity_type?: ManDayActivityType;
  hours_worked: number;
  overtime_hours?: number;
  travel_hours?: number;
  description?: string;
  notes?: string;
  is_billable: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResidentQualityIssue {
  id: string;
  resident_engagement_id: string;
  resident_daily_activity_id?: string;
  issue_number?: string;
  title: string;
  description?: string;
  severity: QualityIssueSeverity;
  status: QualityIssueStatus;
  location_found?: string;
  vendor_or_equipment?: string;
  raised_by?: string;
  raised_date: string;
  closed_by?: string;
  closed_date?: string;
  closed_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResidentCorrectiveAction {
  id: string;
  resident_quality_issue_id: string;
  action_number?: string;
  title: string;
  description?: string;
  responsible_party?: string;
  planned_completion_date?: string;
  actual_completion_date?: string;
  status: CorrectiveActionStatus;
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ResidentITPMonitoring {
  id: string;
  resident_engagement_id: string;
  itp_reference?: string;
  activity_description: string;
  point_type: ITPPointType;
  planned_date?: string;
  actual_date?: string;
  status: ITPMonitoringStatus;
  inspected_by?: string;
  result_notes?: string;
  documents_reviewed?: string[];
  created_at: string;
  updated_at: string;
}

export interface ResidentLookaheadActivity {
  id: string;
  resident_engagement_id: string;
  title: string;
  description?: string;
  planned_start_date: string;
  planned_end_date?: string;
  status: LookaheadActivityStatus;
  priority?: number;
  categories?: string[];
  vendor_or_site?: string;
  required_documents?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResidentPeriodicReport {
  id: string;
  resident_engagement_id: string;
  report_type: PeriodicReportType;
  report_period_start: string;
  report_period_end: string;
  title: string;
  summary: string;
  achievements?: string;
  issues_and_challenges?: string;
  recommendations?: string;
  man_days_summary?: string;
  quality_issues_summary?: string;
  status: PeriodicReportStatus;
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ResidentCloseout {
  id: string;
  resident_engagement_id: string;
  status: CloseoutStatus;
  punch_list_items?: string[];
  documentation_checklist?: Record<string, boolean>;
  final_report_id?: string;
  lessons_learned?: string;
  handover_notes?: string;
  prepared_by?: string;
  prepared_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
  approved_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResidentActivityEvidence {
  id: string;
  resident_daily_activity_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface ResidentTeamMember {
  assignment: ResidentAssignment;
  inspector_name?: string;
  inspector_email?: string;
  inspector_image?: string;
  specialties?: string[];
  status?: string;
}

export interface AttendanceSummary {
  inspector_id: string;
  inspector_name: string;
  discipline: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  leave_days: number;
  attendance_percentage: number;
}

export interface ResidentEngagementWithDetails extends ResidentEngagement {
  project_name?: string;
  client_name?: string;
  contract_name?: string;
  lead_inspector_name?: string;
  active_assignments?: number;
  total_man_days?: number;
  open_quality_issues?: number;
  planned_activities_today?: number;
}
