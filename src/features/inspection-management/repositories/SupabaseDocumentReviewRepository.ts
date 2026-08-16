// src/features/inspection-management/repositories/SupabaseDocumentReviewRepository.ts

import { supabase } from "@shared/database/supabase";
import type { DocumentReview } from "../domain/types";
import type { IDocumentReviewRepository } from "./IDocumentReviewRepository";

export class SupabaseDocumentReviewRepository implements IDocumentReviewRepository {
  async getAll(): Promise<DocumentReview[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("document_reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<DocumentReview | null> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("document_reviews")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as DocumentReview;
  }

  async getByInspectionRequest(requestId: string): Promise<DocumentReview[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("document_reviews")
      .select("*")
      .eq("inspection_request_id", requestId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getByResidentEngagement(
    engagementId: string,
  ): Promise<DocumentReview[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("document_reviews")
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: Omit<DocumentReview, "id" | "created_at" | "updated_at">,
  ): Promise<DocumentReview> {
    const id = `doc_rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .schema("inspection")
      .from("document_reviews")
      .insert({
        id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return newRecord as DocumentReview;
  }

  async update(
    id: string,
    data: Partial<DocumentReview>,
  ): Promise<DocumentReview> {
    const { data: updatedRecord, error } = await supabase
      .schema("inspection")
      .from("document_reviews")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updatedRecord as DocumentReview;
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("document_reviews")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      throw new Error(error.message);
    }
  }

  async verifyDocument(
    id: string,
    verifiedBy: string,
    letterNumber: string,
    verificationDate: string,
  ): Promise<DocumentReview> {
    const { data: updatedRecord, error } = await supabase
      .schema("inspection")
      .from("document_reviews")
      .update({
        verified_by_ics: true,
        verification_letter_number: letterNumber,
        verification_date: verificationDate,
        verified_by: verifiedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updatedRecord as DocumentReview;
  }

  async unverifyDocument(id: string): Promise<DocumentReview> {
    const { data: updatedRecord, error } = await supabase
      .schema("inspection")
      .from("document_reviews")
      .update({
        verified_by_ics: false,
        verification_letter_number: null,
        verification_date: null,
        verified_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updatedRecord as DocumentReview;
  }

  async uploadFile(file: File, ownerId: string): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${ownerId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `inspection-documents/${fileName}`;

    const { error } = await supabase.storage
      .from("documents")
      .upload(filePath, file);
    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async uploadResidentFile(file: File, engagementId: string): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}.${fileExt}`;
    const filePath = `resident-documents/${engagementId}/${fileName}`;

    const { error } = await supabase.storage
      .from("documents")
      .upload(filePath, file);
    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async deleteFileFromStorage(fileUrl: string): Promise<void> {
    try {
      const urlObj = new URL(fileUrl);
      const pathParts = urlObj.pathname.split("/");
      const documentsIndex = pathParts.indexOf("documents");
      const filePath =
        documentsIndex >= 0
          ? pathParts.slice(documentsIndex + 1).join("/")
          : pathParts.slice(-2).join("/");

      await supabase.storage.from("documents").remove([filePath]);
    } catch (error) {
      console.warn("Failed to delete file from storage:", error);
    }
  }
}

export const documentReviewRepository = new SupabaseDocumentReviewRepository();
