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
    const { error } = await supabase
      .schema("inspection")
      .from("document_reviews")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const documentReviewRepository = new SupabaseDocumentReviewRepository();
