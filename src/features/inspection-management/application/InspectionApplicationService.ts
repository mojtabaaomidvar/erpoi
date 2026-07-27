// src/features/inspection-management/application/InspectionApplicationService.ts

import type { IInspectionRepository } from "../repositories/IInspectionRepository";
import type { Inspection, EnrichedInspector } from "../domain/types";
import { inspectorAppService } from "@/features/inspector-managment/application";
import type { Inspector } from "@/features/inspector-managment/domain";

import {
  CreateInspectionSchema,
  type CreateInspectionCommand,
} from "./dto/InspectionCommand";

import { inspectionRepository } from "../repositories/SupabaseInspectionRepository";

class InspectionApplicationService {
  constructor(private repository: IInspectionRepository) {}

  async getAll(): Promise<Inspection[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<Inspection | null> {
    return await this.repository.getById(id);
  }

  async getByInspectionRequest(requestId: string): Promise<Inspection[]> {
    return await this.repository.getByInspectionRequest(requestId);
  }

  async create(command: CreateInspectionCommand): Promise<Inspection> {
    const validatedData = CreateInspectionSchema.parse(command);
    return await this.repository.create({
      ...validatedData,
      assigned_at: new Date().toISOString(),
      status: "SCHEDULED",
    });
  }

  async update(id: string, data: Partial<Inspection>): Promise<Inspection> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async startInspection(id: string): Promise<Inspection> {
    return await this.repository.update(id, {
      status: "IN_PROGRESS",
      actual_start_time: new Date().toISOString(),
    });
  }

  async completeInspection(id: string, remarks?: string): Promise<Inspection> {
    return await this.repository.update(id, {
      status: "COMPLETED",
      actual_end_time: new Date().toISOString(),
      general_remarks: remarks,
    });
  }

  async cancelInspection(
    id: string,
    cancelledBy: string,
    reason?: string,
    relatedInspectionId?: string,
    newScheduledDate?: string,
    dateIsUnknown?: boolean,
    newScopes?: string[],
    cancellationNotes?: string,
  ): Promise<Inspection> {
    return await this.repository.cancelInspection(
      id,
      cancelledBy,
      reason as any,
      relatedInspectionId,
      newScheduledDate,
      dateIsUnknown,
      newScopes,
      cancellationNotes,
    );
  }

  async getInspectionWithDetails(id: string): Promise<any> {
    return await this.repository.getInspectionWithDetails(id);
  }

  async getSuitableInspectors(
    requiredDisciplines: string[],
    targetDate: string,
  ): Promise<EnrichedInspector[]> {
    const allInspectors: Inspector[] = await inspectorAppService.getAll();
    const allInspections: Inspection[] = await this.repository.getAll();

    const normalizedRequired = requiredDisciplines.map((d) =>
      d.trim().toLowerCase(),
    );

    const scheduledInspectionsOnDate = allInspections.filter(
      (insp) =>
        insp.execution_date === targetDate && insp.status !== "CANCELLED",
    );

    const suitableInspectors: EnrichedInspector[] = [];

    for (const inspector of allInspectors) {
      const hasMatchingSpecialty = inspector.specialties.some(
        (specialty: string) =>
          normalizedRequired.includes(specialty.trim().toLowerCase()),
      );

      if (hasMatchingSpecialty) {
        const conflicts = scheduledInspectionsOnDate.filter(
          (insp) => insp.inspector_id === inspector.id,
        );

        suitableInspectors.push({
          inspector,
          isMatch: true,
          isAvailable: conflicts.length === 0,
          conflictingInspections: conflicts,
        });
      }
    }

    return suitableInspectors.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return 0;
    });
  }
}

export const inspectionAppService = new InspectionApplicationService(
  inspectionRepository,
);

export { InspectionApplicationService };
