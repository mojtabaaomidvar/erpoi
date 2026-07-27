// src/features/inspection-management/application/DocumentReviewApplicationService.ts

import { documentReviewRepository } from "../repositories/SupabaseDocumentReviewRepository";
import type { DocumentReview, ReviewStatus } from "../domain/types";
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
      review_status: "INITIAL",
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
    document_type: string; // ✅ تغییر به string برای پشتیبانی از TPI و MWS
    document_name: string;
    document_url: string;
    document_number?: string;
    revision?: string;
    review_status?: ReviewStatus;
  }): Promise<DocumentReview> {
    return await this.repository.create({
      ...data,
      review_status: data.review_status || "INITIAL",
      reviewed_by: undefined,
      reviewed_at: undefined,
    });
  }

  async verifyDocument(
    id: string,
    verifiedBy: string,
    letterNumber: string,
    verificationDate: string,
  ): Promise<DocumentReview> {
    return await this.repository.verifyDocument(
      id,
      verifiedBy,
      letterNumber,
      verificationDate,
    );
  }

  async unverifyDocument(id: string): Promise<DocumentReview> {
    return await this.repository.unverifyDocument(id);
  }

  async uploadDocuments(requestId: string, files: any[], userId: string) {
    await Promise.all(
      files.map(async (f) => {
        const fileUrl = await this.repository.uploadFile(f.file, requestId);
        await this.repository.create({
          inspection_request_id: requestId,
          document_type: f.document_type,
          document_name: f.document_name,
          document_url: fileUrl,
          document_number: f.document_number || undefined,
          revision: f.revision || undefined,
          review_status: "INITIAL",
        });
      }),
    );
  }

  async deleteDocument(id: string, fileUrl: string) {
    await this.repository.deleteFileFromStorage(fileUrl);
    await this.repository.delete(id);
  }

  async bulkDeleteDocuments(docs: { id: string; fileUrl: string }[]) {
    for (const doc of docs) {
      await this.deleteDocument(doc.id, doc.fileUrl);
    }
  }
}

export const documentReviewAppService = new DocumentReviewApplicationService();
