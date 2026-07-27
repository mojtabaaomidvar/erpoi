// src/features/inspection-management/application/InspectionRequestApplicationService.ts

import { inspectionRequestRepository } from "../repositories/SupabaseInspectionRequestRepository";
import type { BaseInspectionRequest } from "../domain/types";
import {
  CreateInspectionRequestSchema,
  type CreateInspectionRequestCommand,
} from "./dto/CreateInspectionRequestCommand";

class InspectionRequestApplicationService {
  private repository = inspectionRequestRepository;

  async getAll(): Promise<BaseInspectionRequest[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<BaseInspectionRequest | null> {
    return await this.repository.getById(id);
  }

  async getByProject(projectId: string): Promise<BaseInspectionRequest[]> {
    return await this.repository.getByProject(projectId);
  }

  async create(
    command: CreateInspectionRequestCommand,
    userId: string,
  ): Promise<BaseInspectionRequest> {
    const validatedData = CreateInspectionRequestSchema.parse(command);

    const newRequest = await this.repository.create({
      ...validatedData,
      requested_by: userId,
    });

    return newRequest;
  }

  async update(
    id: string,
    data: Partial<BaseInspectionRequest>,
    userId: string,
  ): Promise<BaseInspectionRequest> {
    return await this.repository.update(id, data);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.repository.delete(id);
  }
}

export const inspectionRequestAppService =
  new InspectionRequestApplicationService();
