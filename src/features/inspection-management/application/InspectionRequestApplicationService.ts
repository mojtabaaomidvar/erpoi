// src/features/inspection-management/application/InspectionRequestApplicationService.ts

import { inspectionRequestRepository } from "../repositories/SupabaseInspectionRequestRepository";
import type { InspectionRequest } from "../domain/types";

import {
  CreateInspectionRequestSchema,
  type CreateInspectionRequestCommand,
} from "./dto/CreateInspectionRequestCommand";

// TODO: Import publishEvent and auditLogService here when ready

class InspectionRequestApplicationService {
  private repository = inspectionRequestRepository;

  async getAll(): Promise<InspectionRequest[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<InspectionRequest | null> {
    return await this.repository.getById(id);
  }

  async getByProject(projectId: string): Promise<InspectionRequest[]> {
    return await this.repository.getByProject(projectId);
  }

  // ✅ قانون ۱، ۳ و ۹ در اینجا اعمال می‌شود
  async create(
    command: CreateInspectionRequestCommand,
    userId: string,
  ): Promise<InspectionRequest> {
    // ۱. اعتبارسنجی سخت‌گیرانه
    const validatedData = CreateInspectionRequestSchema.parse(command);

    // ۲. اجرای عملیات از طریق Repository
    const newRequest = await this.repository.create({
      ...validatedData,
      requested_by: userId,
    });

    // ۳. (آینده) انتشار ایونت: publishEvent('inspection.created', { ... }, userId);
    // ۴. (آینده) ثبت آدیت: await auditLogService.log({ ... });

    return newRequest;
  }

  async update(
    id: string,
    data: Partial<InspectionRequest>,
    userId: string,
  ): Promise<InspectionRequest> {
    // TODO: Add Authorization check here (e.g., is user allowed to update this request?)
    return await this.repository.update(id, data);
  }

  async delete(id: string, userId: string): Promise<void> {
    // TODO: Add Authorization check here
    await this.repository.delete(id);
  }
}

export const inspectionRequestAppService =
  new InspectionRequestApplicationService();
