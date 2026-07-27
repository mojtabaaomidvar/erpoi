//src/features/tpi-management/application/TPIRequestApplicationService.ts

import type { ITPIRequestRepository } from "../repositories/ITPIRequestRepository";
import { tpiRequestRepository } from "../repositories/SupabaseTPIRequestRepository";
import type { TPIRequest } from "../domain/types";

export class TPIRequestApplicationService {
  constructor(private repository: ITPIRequestRepository) {}

  async getAll() {
    return this.repository.getAll();
  }

  async getById(id: string) {
    return this.repository.getById(id);
  }

  async create(data: any) {
    return this.repository.create(data);
  }

  async update(id: string, data: any) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }

  async createWithDetails(
    command: any,
    items: any[],
    files: {
      file: File;
      file_name: string;
      file_type: string;
      file_size: number;
    }[],
    userId: string,
  ): Promise<TPIRequest> {
    const request = await this.repository.create({
      ...command,
      requested_by: userId,
      status: "NEW",
    });
    const requestId = request.id;

    const dbFiles = [];
    for (const f of files) {
      const fileUrl = await this.repository.uploadFile(f.file, requestId);
      dbFiles.push({
        id: `sf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        tpi_request_id: requestId,
        file_name: f.file_name,
        file_url: fileUrl,
        file_type: f.file_type,
        file_size: f.file_size,
        uploaded_by: userId,
      });
    }

    const dbItems = items.map((item, index) => ({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tpi_request_id: requestId,
      item_name: item.item_name,
      tag_number: item.tag_number || null,
      description: item.description || null,
      quantity: item.quantity,
      unit: item.unit,
      manufacturer: item.manufacturer || null,
      source_type: "MANUAL",
      row_index: index,
    }));

    await this.repository.createInspectionItems(requestId, dbItems);
    await this.repository.createSourceFiles(requestId, dbFiles);

    return request;
  }
  async getInspectionItems(requestId: string) {
    return this.repository.getInspectionItems(requestId);
  }

  async getSourceFiles(requestId: string) {
    return this.repository.getSourceFiles(requestId);
  }
}

export const tpiRequestAppService = new TPIRequestApplicationService(
  tpiRequestRepository,
);
