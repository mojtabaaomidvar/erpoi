// src/features/resident-inspection/application/index.ts

export { ResidentEngagementApplicationService } from "./ResidentEngagementApplicationService";
export { ResidentAssignmentApplicationService } from "./ResidentAssignmentApplicationService";
export { ResidentActivityApplicationService } from "./ResidentActivityApplicationService";
export { ResidentManDayApplicationService } from "./ResidentManDayApplicationService";
export {
  ResidentEngagementDetailQueryService,
  type ResidentEngagementDetailSnapshot,
} from "./ResidentEngagementDetailQueryService";

import { residentEngagementRepository } from "../repositories/SupabaseResidentEngagementRepository";
import { residentAssignmentRepository } from "../repositories/SupabaseResidentAssignmentRepository";
import { residentActivityRepository } from "../repositories/SupabaseResidentActivityRepository";
import { residentActivityEvidenceRepository } from "../repositories/SupabaseResidentActivityEvidenceRepository";
import { residentManDayRepository } from "../repositories/SupabaseResidentManDayRepository";
import { residentQualityIssueRepository } from "../repositories/SupabaseResidentQualityIssueRepository";
import { residentCorrectiveActionRepository } from "../repositories/SupabaseResidentCorrectiveActionRepository";
import { residentITPMonitoringRepository } from "../repositories/SupabaseResidentITPMonitoringRepository";
import { residentLookaheadRepository } from "../repositories/SupabaseResidentLookaheadRepository";
import { residentPeriodicReportRepository } from "../repositories/SupabaseResidentPeriodicReportRepository";
import { residentCloseoutRepository } from "../repositories/SupabaseResidentCloseoutRepository";

import { ResidentEngagementApplicationService } from "./ResidentEngagementApplicationService";
import { ResidentAssignmentApplicationService } from "./ResidentAssignmentApplicationService";
import { ResidentActivityApplicationService } from "./ResidentActivityApplicationService";
import { ResidentManDayApplicationService } from "./ResidentManDayApplicationService";
import { ResidentEngagementDetailQueryService } from "./ResidentEngagementDetailQueryService";

export const residentEngagementAppService =
  new ResidentEngagementApplicationService(residentEngagementRepository);
export const residentAssignmentAppService =
  new ResidentAssignmentApplicationService(residentAssignmentRepository);
export const residentActivityAppService =
  new ResidentActivityApplicationService(
    residentActivityRepository,
    residentAssignmentRepository,
    residentEngagementRepository,
  );
export const residentManDayAppService = new ResidentManDayApplicationService(
  residentManDayRepository,
  residentAssignmentRepository,
  residentEngagementRepository,
);

export const residentEngagementDetailQueryService =
  new ResidentEngagementDetailQueryService(
    residentAssignmentRepository,
    residentActivityRepository,
    residentActivityEvidenceRepository,
    residentManDayRepository,
    residentQualityIssueRepository,
    residentCorrectiveActionRepository,
    residentITPMonitoringRepository,
    residentLookaheadRepository,
    residentPeriodicReportRepository,
    residentCloseoutRepository,
  );
