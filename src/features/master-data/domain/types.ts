//src/features/master-data/domain/types.ts

export type ApprovalFieldType =
  | "INSPECTOR_SPECIALTY"
  | "TPI_DISCIPLINE"
  | "TPI_INSPECTION_STAGE"
  | "TPI_INSPECTION_METHOD"
  | "TPI_INSPECTION_ITEM"
  | "TPI_CANCELLATION_REASON"
  | "TPI_REPORT_TYPE"
  | "TPI_DOCUMENT_TYPE"
  | "MWS_DISCIPLINE"
  | "MWS_INSPECTION_STAGE"
  | "MWS_INSPECTION_METHOD"
  | "MWS_CANCELLATION_REASON"
  | "MWS_REPORT_TYPE"
  | "MWS_DOCUMENT_TYPE";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PendingApproval {
  id: string;
  field_type: ApprovalFieldType;
  proposed_value: string;
  requested_by: string;
  requested_at: string;
  status: ApprovalStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  final_value?: string;
  created_at: string;
}
