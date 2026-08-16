// src/features/tpi-management/application/TPIEngagementApplicationService.ts

import type { ITPIEngagementRepository } from "../repositories/ITPIEngagementRepository";
import type { TPIEngagementFilter } from "../repositories/ITPIEngagementRepository";
import type {
  TPIEngagement,
  TPIEngagementSummary,
} from "../domain/models/TPIEngagement";
import { toEngagementSummary } from "../domain/models/TPIEngagement";
import { TPIEngagementLifecyclePolicy } from "../domain/services/TPIEngagementLifecyclePolicy";
import type { TPIEngagementStatus } from "../domain/services/TPIEngagementLifecyclePolicy";
import type { TPIRequest } from "../domain/types";
import type { ResidentEngagement } from "../domain/models/ResidentEngagement";
import type { MasterDataApplicationService } from "@shared/application/MasterDataApplicationService";

export type CreateSpotEngagementCommand = Omit<
  TPIRequest,
  "id" | "created_at" | "updated_at" | "status"
>;

export type CreateResidentEngagementCommand = Omit<
  ResidentEngagement,
  | "id"
  | "created_at"
  | "updated_at"
  | "status"
  | "disciplines"
  | "inspection_scope_ids"
  | "inspection_scopes"
>;

/**
 * Canonical application service for TPI Engagements.
 *
 * Provides unified operations for both SPOT and RESIDENT modes.
 * During the migration phase, the underlying repository implementation
 * may delegate to existing SupabaseTPIRequestRepository or
 * SupabaseResidentInspectionRepository.
 */
export class TPIEngagementApplicationService {
  constructor(
    private readonly repository: ITPIEngagementRepository,
    private readonly masterDataService: Pick<
      MasterDataApplicationService,
      "getTPIDisciplines"
    >,
  ) {}

  /**
   * Retrieve all engagements, optionally filtered by mode or other criteria.
   */
  async getAll(filter?: TPIEngagementFilter): Promise<TPIEngagement[]> {
    return this.repository.getAll(filter);
  }

  /**
   * Retrieve engagement summaries for list views.
   */
  async getSummaries(
    filter?: TPIEngagementFilter,
  ): Promise<TPIEngagementSummary[]> {
    const engagements = await this.repository.getAll(filter);
    return engagements.map(toEngagementSummary);
  }

  /**
   * Retrieve a single engagement by its ID.
   */
  async getById(id: string): Promise<TPIEngagement | null> {
    return this.repository.getById(id);
  }

  /**
   * Persist a new engagement.
   */
  async createSpot(
    command: CreateSpotEngagementCommand,
  ): Promise<TPIEngagement> {
    return this.repository.create({
      mode: "SPOT",
      request: { ...command, status: "NEW" },
    });
  }

  async createResident(
    command: CreateResidentEngagementCommand,
  ): Promise<TPIEngagement> {
    const activeDisciplines = await this.masterDataService.getTPIDisciplines();

    return this.repository.create({
      mode: "RESIDENT",
      engagement: {
        ...command,
        disciplines: activeDisciplines.map((discipline) => discipline.value),
        inspection_scope_ids: [],
        inspection_scopes: [],
        status: "DRAFT",
      },
    });
  }

  /**
   * Update an existing engagement.
   */
  async update(engagement: TPIEngagement): Promise<TPIEngagement> {
    return this.repository.update(engagement);
  }

  /**
   * Soft-delete or remove an engagement.
   */
  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  /**
   * Validate whether a status transition is allowed for a given engagement.
   * Returns true if the transition is valid according to the lifecycle policy.
   */
  canTransitionStatus(
    engagement: TPIEngagement,
    targetStatus: TPIEngagementStatus,
  ): boolean {
    return TPIEngagementLifecyclePolicy.canTransition(engagement, targetStatus);
  }

  async transitionStatus(
    id: string,
    targetStatus: TPIEngagementStatus,
  ): Promise<TPIEngagement> {
    const engagement = await this.repository.getById(id);
    if (!engagement) throw new Error("TPI engagement not found");

    TPIEngagementLifecyclePolicy.assertTransition(engagement, targetStatus);

    if (engagement.mode === "SPOT") {
      return this.repository.update({
        mode: "SPOT",
        request: {
          ...engagement.request,
          status: targetStatus as TPIRequest["status"],
        },
      });
    }

    const patch: Partial<ResidentEngagement> = {
      status: targetStatus as ResidentEngagement["status"],
    };
    const today = new Date().toISOString().split("T")[0];
    if (targetStatus === "ACTIVE" && !engagement.engagement.actual_start_date) {
      patch.actual_start_date = today;
    }
    if (targetStatus === "COMPLETED") patch.actual_end_date = today;

    return this.repository.update({
      mode: "RESIDENT",
      engagement: { ...engagement.engagement, ...patch },
    });
  }
}
