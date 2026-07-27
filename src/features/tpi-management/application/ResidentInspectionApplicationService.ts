// src/features/tpi-management/application/ResidentInspectionApplicationService.ts
import { residentInspectionRepository } from "../repositories/SupabaseResidentInspectionRepository";
import type { ResidentInspection } from "../domain/types";

class ResidentInspectionApplicationService {
  private repository = residentInspectionRepository;

  async getAll(): Promise<ResidentInspection[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<ResidentInspection | null> {
    return await this.repository.getById(id);
  }

  async getByTPIRequest(tpiRequestId: string): Promise<ResidentInspection[]> {
    return await this.repository.getByTPIRequest(tpiRequestId);
  }

  async create(data: Omit<ResidentInspection, "id" | "created_at" | "updated_at">): Promise<ResidentInspection> {
    return await this.repository.create(data);
  }

  async update(id: string, data: Partial<ResidentInspection>): Promise<ResidentInspection> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async complete(id: string, endDate: string): Promise<ResidentInspection> {
    return await this.repository.update(id, {
      status: "COMPLETED",
      end_date: endDate,
    });
  }

  async suspend(id: string): Promise<ResidentInspection> {
    return await this.repository.update(id, {
      status: "SUSPENDED",
    });
  }
}

export const residentInspectionAppService = new ResidentInspectionApplicationService();