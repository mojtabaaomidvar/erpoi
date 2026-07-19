// src/features/inspection-management/application/DocumentReviewApplicationService.ts

import { documentReviewRepository } from "../repositories/SupabaseDocumentReviewRepository";
import type { DocumentReview } from "../domain/types";
import {
  CreateDocumentReviewSchema,
  type CreateDocumentReviewCommand,
} from "./dto/DocumentReviewCommand";

class DocumentReviewApplicationService {
  private repository = documentReviewRepository;

  async getAll(): Promise<DocumentReview[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<DocumentReview | null> {
    return await this.repository.getById(id);
  }

  async getByInspectionRequest(requestId: string): Promise<DocumentReview[]> {
    return await this.repository.getByInspectionRequest(requestId);
  }

  async create(command: CreateDocumentReviewCommand): Promise<DocumentReview> {
    const validatedData = CreateDocumentReviewSchema.parse(command);

    return await this.repository.create({
      ...validatedData,
      review_status: "PENDING",
    });
  }

  async update(
    id: string,
    data: Partial<DocumentReview>,
  ): Promise<DocumentReview> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async approveDocument(
    id: string,
    reviewedBy: string,
  ): Promise<DocumentReview> {
    return await this.repository.update(id, {
      review_status: "APPROVED",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    });
  }

  async rejectDocument(
    id: string,
    reviewedBy: string,
    comments: string,
  ): Promise<DocumentReview> {
    return await this.repository.update(id, {
      review_status: "REJECTED",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      comments,
    });
  }

  async commentDocument(
    id: string,
    reviewedBy: string,
    comments: string,
  ): Promise<DocumentReview> {
    return await this.repository.update(id, {
      review_status: "COMMENTED",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      comments,
    });
  }

  async uploadDocument(data: {
    inspection_request_id: string;
    document_type: any;
    document_name: string;
    document_url: string;
    document_number?: string;
    revision?: string;
  }): Promise<any> {
    return await this.repository.create({
      ...data,
      review_status: "PENDING",
    });
  }
}

export const documentReviewAppService = new DocumentReviewApplicationService();
