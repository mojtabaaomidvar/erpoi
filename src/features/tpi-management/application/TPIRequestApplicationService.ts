//src/features/tpi-management/application/TPIRequestApplicationService.ts

import type { ITPIRequestRepository } from "../repositories/ITPIRequestRepository";
import { tpiRequestRepository } from "../repositories/SupabaseTPIRequestRepository";
import type { TPIRequest, InspectionItem, SourceFile } from "../domain/types";

// ✅ ایمپورت سرویس‌های خارجی برای ساخت DTO (الگوی Read-Side Aggregation)
import { clientAppService } from "@/features/client-management/application";
import { projectAppService } from "@/features/project-management";
import { vendorAppService } from "./VendorApplicationService";

// ✅ تعریف DTO برای انتقال داده‌های تجمیع‌شده به UI
export interface TPIRequestDetailsDTO {
  clientName: string;
  projectName: string;
  vendorName: string | null;
  items: InspectionItem[];
  sourceFiles: SourceFile[];
}

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

  async getTPIRequestDetails(requestId: string): Promise<TPIRequestDetailsDTO> {
    const request = await this.getById(requestId);
    if (!request) {
      throw new Error("TPI Request not found");
    }

    const [client, project, vendor, itemsData, filesData] = await Promise.all([
      request.client_id ? clientAppService.getById(request.client_id) : null,
      request.project_id
        ? projectAppService.getProjectById(request.project_id)
        : null,
      request.vendor_id ? vendorAppService.getById(request.vendor_id) : null,
      this.getInspectionItems(requestId),
      this.getSourceFiles(requestId),
    ]);

    return {
      clientName:
        (client as any)?.name_en || (client as any)?.name || "Unknown Client",
      projectName: (project as any)?.name || "Unknown Project",
      vendorName: (vendor as any)?.name || null,
      items: itemsData || [],
      sourceFiles: filesData || [],
    };
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
    userDepartment?: string,
  ): Promise<TPIRequest> {
    const payload = {
      ...command,
      requested_by: userId,
      status: "NEW",
      department: command.department || userDepartment || "GENERAL",
    };

    const request = await this.repository.create(payload);
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
        uploaded_at: new Date().toISOString(),
      });
    }

    if (dbFiles.length > 0) {
      await this.repository.createSourceFiles(requestId, dbFiles);
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

    if (dbItems.length > 0) {
      await this.repository.createInspectionItems(requestId, dbItems);
    }

    return request;
  }

  async updateWithDetails(
    id: string,
    command: any,
    items: any[],
    userId: string,
    userDepartment?: string,
  ): Promise<TPIRequest> {
    const payload = {
      ...command,
      department: command.department || userDepartment || "GENERAL",
    };
    const updatedRequest = await this.repository.update(id, payload);

    await this.repository.deleteInspectionItems(id);

    if (items.length > 0) {
      const dbItems = items.map((item, index) => ({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        tpi_request_id: id,
        item_name: item.item_name,
        tag_number: item.tag_number || null,
        description: item.description || null,
        quantity: item.quantity,
        unit: item.unit,
        manufacturer: item.manufacturer || null,
        source_type: "MANUAL",
        row_index: index,
      }));

      await this.repository.createInspectionItems(id, dbItems);
    }

    return updatedRequest;
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
