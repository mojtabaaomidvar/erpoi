// src/features/inspection-management/application/NCRApplicationService.ts

import { ncrRepository } from "../repositories/SupabaseNCRRepository";
import type { NonConformity } from "../domain/types";
import { CreateNCRSchema, type CreateNCRCommand } from "./dto/NCRCommand";

class NCRApplicationService {
  private repository = ncrRepository;

  async getAll(): Promise<NonConformity[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<NonConformity | null> {
    return await this.repository.getById(id);
  }

  async getByInspection(inspectionId: string): Promise<NonConformity[]> {
    return await this.repository.getByInspection(inspectionId);
  }

  async create(command: CreateNCRCommand): Promise<NonConformity> {
    const validatedData = CreateNCRSchema.parse(command);

    return await this.repository.create({
      ...validatedData,
      status: "OPEN",
      photos: validatedData.photos || [],
    });
  }

  async update(
    id: string,
    data: Partial<NonConformity>,
  ): Promise<NonConformity> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async addCorrectiveAction(
    id: string,
    action: string,
  ): Promise<NonConformity> {
    return await this.repository.update(id, {
      corrective_action: action,
      status: "CORRECTIVE_ACTION",
    });
  }

  async closeNCR(id: string, closedBy: string): Promise<NonConformity> {
    return await this.repository.update(id, {
      status: "CLOSED",
      closed_by: closedBy,
      closed_at: new Date().toISOString(),
    });
  }

  async reopenNCR(id: string): Promise<NonConformity> {
    return await this.repository.update(id, {
      status: "OPEN",
      closed_by: undefined,
      closed_at: undefined,
    });
  }
}

export const ncrAppService = new NCRApplicationService();
