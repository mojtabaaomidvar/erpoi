// src/features/inspection-management/application/ReportApplicationService.ts

import { reportRepository } from "../repositories/SupabaseReportRepository";
import type { InspectionReport } from "../domain/types";
import {
  CreateReportSchema,
  type CreateReportCommand,
} from "./dto/ReportCommand";

class ReportApplicationService {
  private repository = reportRepository;

  async getAll(): Promise<InspectionReport[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<InspectionReport | null> {
    return await this.repository.getById(id);
  }

  async getByInspection(inspectionId: string): Promise<InspectionReport[]> {
    return await this.repository.getByInspection(inspectionId);
  }

  async create(command: CreateReportCommand): Promise<InspectionReport> {
    const validatedData = CreateReportSchema.parse(command);
    return await this.repository.create(validatedData);
  }

  async update(
    id: string,
    data: Partial<InspectionReport>,
  ): Promise<InspectionReport> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async sendToClient(id: string): Promise<InspectionReport> {
    return await this.repository.update(id, {
      sent_to_client: true,
      sent_at: new Date().toISOString(),
    });
  }

  async uploadReport(data: {
    inspection_id: string;
    report_type: any;
    report_url: string;
    issued_by: string;
    issued_at: string;
    sent_to_client?: boolean;
  }): Promise<any> {
    return await this.repository.create({
      ...data,
      sent_to_client: data.sent_to_client ?? false,
    });
  }
}

export const reportAppService = new ReportApplicationService();
