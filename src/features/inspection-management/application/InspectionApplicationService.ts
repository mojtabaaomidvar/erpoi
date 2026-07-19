// src/features/inspection-management/application/InspectionApplicationService.ts

import { inspectionRepository } from "../repositories/SupabaseInspectionRepository";
import type { Inspection } from "../domain/types";
import {
  CreateInspectionSchema,
  type CreateInspectionCommand,
} from "./dto/InspectionCommand";

class InspectionApplicationService {
  private repository = inspectionRepository;

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

  async cancelInspection(id: string): Promise<Inspection> {
    return await this.repository.update(id, {
      status: "CANCELLED",
    });
  }
}

export const inspectionAppService = new InspectionApplicationService();
