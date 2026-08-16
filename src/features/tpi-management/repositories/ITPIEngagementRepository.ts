// src/features/tpi-management/repositories/ITPIEngagementRepository.ts

import type {
  TPIEngagement,
  TPIEngagementMode,
} from "../domain/models/TPIEngagement";
import type { TPIRequest } from "../domain/types";
import type { ResidentEngagement } from "../domain/models/ResidentEngagement";

export type NewTPIEngagement =
  | {
      mode: "SPOT";
      request: Omit<TPIRequest, "id" | "created_at" | "updated_at">;
    }
  | {
      mode: "RESIDENT";
      engagement: Omit<ResidentEngagement, "id" | "created_at" | "updated_at">;
    };

/**
 * Filter criteria for querying TPI engagements.
 */
export interface TPIEngagementFilter {
  mode?: TPIEngagementMode;
  status?: string;
  customerId?: string;
  projectId?: string;
  contractId?: string;
  search?: string;
}

/**
 * Canonical repository interface for TPI Engagement persistence.
 *
 * This interface abstracts the underlying database tables and provides
 * a unified access point for both SPOT and RESIDENT TPI engagements.
 *
 * Implementations may internally delegate to existing SupabaseTPIRequestRepository
 * or SupabaseResidentInspectionRepository during the migration phase.
 */
export interface ITPIEngagementRepository {
  /**
   * Retrieve all engagements, optionally filtered by mode or other criteria.
   */
  getAll(filter?: TPIEngagementFilter): Promise<TPIEngagement[]>;

  /**
   * Retrieve a single engagement by its ID.
   */
  getById(id: string): Promise<TPIEngagement | null>;

  /**
   * Persist a new engagement.
   */
  create(engagement: NewTPIEngagement): Promise<TPIEngagement>;

  /**
   * Update an existing engagement.
   */
  update(engagement: TPIEngagement): Promise<TPIEngagement>;

  /**
   * Soft-delete or remove an engagement.
   */
  delete(id: string): Promise<void>;
}
