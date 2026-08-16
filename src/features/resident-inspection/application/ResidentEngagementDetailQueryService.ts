// src/features/resident-inspection/application/ResidentEngagementDetailQueryService.ts

import type {
  ResidentActivityEvidence,
  ResidentAssignment,
  ResidentCloseout,
  ResidentCorrectiveAction,
  ResidentDailyActivity,
  ResidentITPMonitoring,
  ResidentLookaheadActivity,
  ResidentManDay,
  ResidentPeriodicReport,
  ResidentQualityIssue,
} from "../domain/types";
import type { IResidentActivityRepository } from "../repositories/IResidentActivityRepository";
import type { IResidentActivityEvidenceRepository } from "../repositories/IResidentActivityEvidenceRepository";
import type { IResidentAssignmentRepository } from "../repositories/IResidentAssignmentRepository";
import type { IResidentCloseoutRepository } from "../repositories/IResidentCloseoutRepository";
import type { IResidentCorrectiveActionRepository } from "../repositories/IResidentCorrectiveActionRepository";
import type { IResidentITPMonitoringRepository } from "../repositories/IResidentITPMonitoringRepository";
import type { IResidentLookaheadRepository } from "../repositories/IResidentLookaheadRepository";
import type { IResidentManDayRepository } from "../repositories/IResidentManDayRepository";
import type { IResidentPeriodicReportRepository } from "../repositories/IResidentPeriodicReportRepository";
import type { IResidentQualityIssueRepository } from "../repositories/IResidentQualityIssueRepository";

export interface ResidentEngagementDetailSnapshot {
  assignments: ResidentAssignment[];
  activities: ResidentDailyActivity[];
  evidence: ResidentActivityEvidence[];
  manDays: ResidentManDay[];
  qualityIssues: ResidentQualityIssue[];
  correctiveActions: ResidentCorrectiveAction[];
  itpMonitoring: ResidentITPMonitoring[];
  lookahead: ResidentLookaheadActivity[];
  reports: ResidentPeriodicReport[];
  closeout: ResidentCloseout | null;
}

/** Read-side orchestration for the complete Resident detail experience. */
export class ResidentEngagementDetailQueryService {
  constructor(
    private readonly assignmentRepository: IResidentAssignmentRepository,
    private readonly activityRepository: IResidentActivityRepository,
    private readonly activityEvidenceRepository: IResidentActivityEvidenceRepository,
    private readonly manDayRepository: IResidentManDayRepository,
    private readonly qualityIssueRepository: IResidentQualityIssueRepository,
    private readonly correctiveActionRepository: IResidentCorrectiveActionRepository,
    private readonly itpMonitoringRepository: IResidentITPMonitoringRepository,
    private readonly lookaheadRepository: IResidentLookaheadRepository,
    private readonly periodicReportRepository: IResidentPeriodicReportRepository,
    private readonly closeoutRepository: IResidentCloseoutRepository,
  ) {}

  async getSnapshot(
    engagementId: string,
  ): Promise<ResidentEngagementDetailSnapshot> {
    const [
      assignments,
      activities,
      manDays,
      qualityIssues,
      itpMonitoring,
      lookahead,
      reports,
      closeout,
    ] = await Promise.all([
      this.assignmentRepository.getByEngagement(engagementId),
      this.activityRepository.getByEngagement(engagementId),
      this.manDayRepository.getByEngagement(engagementId),
      this.qualityIssueRepository.getByEngagement(engagementId),
      this.itpMonitoringRepository.getByEngagement(engagementId),
      this.lookaheadRepository.getByEngagement(engagementId),
      this.periodicReportRepository.getByEngagement(engagementId),
      this.closeoutRepository.getByEngagement(engagementId),
    ]);

    const evidence = await this.activityEvidenceRepository.getByActivityIds(
      activities.map((activity) => activity.id),
    );

    const correctiveActions = await this.correctiveActionRepository.getByIssues(
      qualityIssues.map((issue) => issue.id),
    );

    return {
      assignments,
      activities,
      evidence,
      manDays,
      qualityIssues,
      correctiveActions,
      itpMonitoring,
      lookahead,
      reports,
      closeout,
    };
  }
}
