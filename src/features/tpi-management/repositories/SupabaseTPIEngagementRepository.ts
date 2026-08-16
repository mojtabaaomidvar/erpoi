// src/features/tpi-management/repositories/SupabaseTPIEngagementRepository.ts

/**
 * Adapter repository that implements the canonical ITPIEngagementRepository
 * by delegating to the existing SPOT (SupabaseTPIRequestRepository) and
 * RESIDENT (SupabaseResidentEngagementRepository) persistence implementations.
 *
 * This is a migration-phase artifact. It allows the canonical TPI domain to
 * coexist with the existing split persistence infrastructure without requiring
 * immediate database schema changes.
 */

import type {
  ITPIEngagementRepository,
  NewTPIEngagement,
  TPIEngagementFilter,
} from "./ITPIEngagementRepository";
import type { TPIEngagement } from "../domain/models/TPIEngagement";
import {
  createSpotEngagement,
  createResidentEngagement,
  inferModeFromId,
} from "../domain/models/TPIEngagement";
import type { ITPIRequestRepository } from "./ITPIRequestRepository";
import type { IResidentEngagementRepository } from "@/features/resident-inspection/repositories/IResidentEngagementRepository";
import { tpiRequestRepository } from "./SupabaseTPIRequestRepository";
import { residentEngagementRepository } from "@/features/resident-inspection/repositories/SupabaseResidentEngagementRepository";

export class SupabaseTPIEngagementRepository implements ITPIEngagementRepository {
  constructor(
    private readonly spotRepository: ITPIRequestRepository,
    private readonly residentRepository: IResidentEngagementRepository,
  ) {}

  async getAll(filter?: TPIEngagementFilter): Promise<TPIEngagement[]> {
    const mode = filter?.mode;

    if (mode === "SPOT") {
      return this.applyInMemoryFilters(await this.getAllSpot(), filter);
    }

    if (mode === "RESIDENT") {
      return this.applyInMemoryFilters(await this.getAllResident(), filter);
    }

    // No mode filter — fetch both and merge
    const [spot, resident] = await Promise.all([
      this.getAllSpot(),
      this.getAllResident(),
    ]);

    const merged = [...spot, ...resident];

    // Apply remaining filters in-memory (post-fetch).
    // For production-scale filtering, these should be pushed down to the
    // underlying repositories / database queries in a future iteration.
    return this.applyInMemoryFilters(merged, filter);
  }

  async getById(id: string): Promise<TPIEngagement | null> {
    const mode = inferModeFromId(id);

    if (mode === "SPOT") {
      const request = await this.spotRepository.getById(id);
      return request ? createSpotEngagement(request) : null;
    }

    if (mode === "RESIDENT") {
      const engagement = await this.residentRepository.getById(id);
      return engagement ? createResidentEngagement(engagement) : null;
    }

    // ID convention unknown — try both
    const request = await this.spotRepository.getById(id);
    if (request) return createSpotEngagement(request);

    const engagement = await this.residentRepository.getById(id);
    if (engagement) return createResidentEngagement(engagement);

    return null;
  }

  async create(engagement: NewTPIEngagement): Promise<TPIEngagement> {
    if (engagement.mode === "SPOT") {
      const created = await this.spotRepository.create(engagement.request);
      return createSpotEngagement(created);
    }

    const created = await this.residentRepository.create(engagement.engagement);
    return createResidentEngagement(created);
  }

  async update(engagement: TPIEngagement): Promise<TPIEngagement> {
    if (engagement.mode === "SPOT") {
      const updated = await this.spotRepository.update(
        engagement.request.id,
        engagement.request,
      );
      return createSpotEngagement(updated);
    }

    const updated = await this.residentRepository.update(
      engagement.engagement.id,
      engagement.engagement,
    );
    return createResidentEngagement(updated);
  }

  async delete(id: string): Promise<void> {
    let mode = inferModeFromId(id);

    if (!mode) {
      const engagement = await this.getById(id);
      mode = engagement?.mode;
    }

    if (mode === "SPOT") {
      await this.spotRepository.softDelete(id, {
        deletedBy: "system",
        reason: "Deleted via canonical TPI repository",
      });
      return;
    }

    if (mode === "RESIDENT") {
      // Resident repository does not currently expose a delete method.
      // This is a known gap to be addressed in a future iteration.
      throw new Error(
        "RESIDENT engagement deletion is not yet supported via the canonical repository.",
      );
    }

    throw new Error(`TPI engagement not found: ${id}`);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async getAllSpot(): Promise<TPIEngagement[]> {
    const requests = await this.spotRepository.getAll();
    return requests.map(createSpotEngagement);
  }

  private async getAllResident(): Promise<TPIEngagement[]> {
    const engagements = await this.residentRepository.getAll();
    return engagements.map(createResidentEngagement);
  }

  private applyInMemoryFilters(
    engagements: TPIEngagement[],
    filter?: TPIEngagementFilter,
  ): TPIEngagement[] {
    if (!filter) return engagements;

    let result = engagements;

    if (filter.mode) {
      result = result.filter((engagement) => engagement.mode === filter.mode);
    }

    if (filter.status) {
      const status = filter.status.toLowerCase();
      result = result.filter((e) => {
        const s =
          e.mode === "SPOT"
            ? e.request.status?.toLowerCase()
            : e.engagement.status?.toLowerCase();
        return s === status;
      });
    }

    if (filter.projectId) {
      result = result.filter((e) => {
        const pid =
          e.mode === "SPOT" ? e.request.project_id : e.engagement.project_id;
        return pid === filter.projectId;
      });
    }

    if (filter.customerId) {
      result = result.filter((e) => {
        const cid =
          e.mode === "SPOT" ? e.request.client_id : e.engagement.client_id;
        return cid === filter.customerId;
      });
    }

    if (filter.contractId) {
      result = result.filter((e) => {
        const cid =
          e.mode === "SPOT" ? e.request.contract_id : e.engagement.contract_id;
        return cid === filter.contractId;
      });
    }

    if (filter.search) {
      const term = filter.search.toLowerCase();
      result = result.filter((e) => {
        if (e.mode === "SPOT") {
          const r = e.request;
          return (
            r.category?.toLowerCase().includes(term) ||
            r.disciplines?.some((d) => d.toLowerCase().includes(term)) ||
            r.status?.toLowerCase().includes(term)
          );
        }
        const eng = e.engagement;
        return (
          eng.title?.toLowerCase().includes(term) ||
          eng.status?.toLowerCase().includes(term)
        );
      });
    }

    return result;
  }
}

export const tpiEngagementRepository = new SupabaseTPIEngagementRepository(
  tpiRequestRepository,
  residentEngagementRepository,
);
