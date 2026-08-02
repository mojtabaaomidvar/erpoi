// src/features/inspection-management/repositories/InspectionPhotoRepository.ts

import { supabase } from "@shared/database/supabase";

export interface InspectionPhoto {
  id: string;
  request_id: string;
  equipment_id: string;
  checklist_item_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: "PENDING" | "PASS" | "REJECT" | "NOTE" | "HOLD";
  description?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface UploadPhotoParams {
  requestId: string;
  equipmentId: string;
  checklistItemId: string;
  file: File;
  status: "PENDING" | "PASS" | "REJECT" | "NOTE" | "HOLD";
  description?: string;
  uploadedBy: string;
}

export class InspectionPhotoRepository {
  /**
   * Upload a photo to Supabase Storage and create database record
   */
  async uploadPhoto(params: UploadPhotoParams): Promise<InspectionPhoto> {
    const {
      requestId,
      equipmentId,
      checklistItemId,
      file,
      status,
      description,
      uploadedBy,
    } = params;

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `inspection-photos/${requestId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("inspection-storage")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("❌ Photo upload failed:", uploadError);
      throw new Error(`Failed to upload photo: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("inspection-storage")
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl || "";

    // Create database record
    const { data: dbData, error: dbError } = await supabase
      .schema("inspection")
      .from("inspection_photos")
      .insert({
        request_id: requestId,
        equipment_id: equipmentId,
        checklist_item_id: checklistItemId,
        file_name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        status: status,
        description: description || null,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ Database insert failed:", dbError);
      // Try to delete the uploaded file if database insert fails
      await supabase.storage.from("inspection-storage").remove([filePath]);
      throw new Error(`Failed to save photo record: ${dbError.message}`);
    }

    return {
      id: dbData.id,
      request_id: dbData.request_id,
      equipment_id: dbData.equipment_id,
      checklist_item_id: dbData.checklist_item_id,
      file_name: dbData.file_name,
      file_path: dbData.file_path,
      file_size: dbData.file_size,
      mime_type: dbData.mime_type,
      status: dbData.status,
      description: dbData.description,
      uploaded_by: dbData.uploaded_by,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at,
    };
  }

  /**
   * Get all photos for a specific checklist item
   */
  async getPhotosByChecklistItem(
    checklistItemId: string,
  ): Promise<InspectionPhoto[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspection_photos")
      .select("*")
      .eq("checklist_item_id", checklistItemId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Failed to fetch photos:", error);
      throw new Error(error.message);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      request_id: row.request_id,
      equipment_id: row.equipment_id,
      checklist_item_id: row.checklist_item_id,
      file_name: row.file_name,
      file_path: row.file_path,
      file_size: row.file_size,
      mime_type: row.mime_type,
      status: row.status,
      description: row.description,
      uploaded_by: row.uploaded_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  /**
   * Get all photos for a request
   */
  async getPhotosByRequestId(requestId: string): Promise<InspectionPhoto[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspection_photos")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Failed to fetch photos:", error);
      throw new Error(error.message);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      request_id: row.request_id,
      equipment_id: row.equipment_id,
      checklist_item_id: row.checklist_item_id,
      file_name: row.file_name,
      file_path: row.file_path,
      file_size: row.file_size,
      mime_type: row.mime_type,
      status: row.status,
      description: row.description,
      uploaded_by: row.uploaded_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  /**
   * Delete a photo (both from storage and database)
   */
  async deletePhoto(photoId: string): Promise<void> {
    // Get photo record first
    const { data: photo, error: fetchError } = await supabase
      .schema("inspection")
      .from("inspection_photos")
      .select("file_path")
      .eq("id", photoId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch photo: ${fetchError.message}`);
    }

    // Extract file path from URL if it's a full URL
    let filePath = photo.file_path;
    if (filePath.includes("/object/public/")) {
      filePath = filePath.split("/object/public/")[1];
    } else if (filePath.startsWith("http")) {
      // Extract path from full URL
      try {
        const url = new URL(filePath);
        filePath =
          url.pathname.split("/object/public/")[1] || url.pathname.substring(1);
      } catch (e) {
        // If URL parsing fails, use as is
      }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("inspection-storage")
      .remove([filePath]);

    if (storageError) {
      console.error("⚠️ Storage deletion warning:", storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .schema("inspection")
      .from("inspection_photos")
      .delete()
      .eq("id", photoId);

    if (dbError) {
      console.error("❌ Database deletion failed:", dbError);
      throw new Error(dbError.message);
    }
  }

  /**
   * Update photo description
   */
  async updatePhotoDescription(
    photoId: string,
    description: string,
  ): Promise<void> {
    const { error } = await supabase
      .schema("inspection")
      .from("inspection_photos")
      .update({
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", photoId);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const inspectionPhotoRepository = new InspectionPhotoRepository();
