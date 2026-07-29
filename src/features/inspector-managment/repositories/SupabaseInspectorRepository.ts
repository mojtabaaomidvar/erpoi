// src/features/inspector-management/repositories/SupabaseInspectorRepository.ts

import { supabase } from "@shared/database/supabase";
import type { Inspector, IInspectorRepository } from "../domain";
import { getTodayJalali } from "@/shared/utils/dateUtils";

type InspectorCreateDTO = Omit<
  Inspector,
  "id" | "created_at" | "updated_at"
> & { resumeFile?: File | null };
type InspectorUpdateDTO = Partial<Inspector> & { resumeFile?: File | null };

const parseToRealArray = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return data
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
};

export class SupabaseInspectorRepository implements IInspectorRepository {
  async getAll(): Promise<Inspector[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspectors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return [];

    return (data || []).map((item: any) => ({
      ...item,
      specialties: parseToRealArray(item.specialties),
      rating: Number(item.rating) || 0,
      completed_inspections: Number(item.completed_inspections) || 0,
      active_missions: Number(item.active_missions) || 0,
    })) as Inspector[];
  }

  async getById(id: string): Promise<Inspector | null> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspectors")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return {
      ...data,
      specialties: parseToRealArray(data.specialties),
      rating: Number(data.rating) || 0,
      completed_inspections: Number(data.completed_inspections) || 0,
      active_missions: Number(data.active_missions) || 0,
    } as Inspector;
  }

  async create(inspectorData: any): Promise<Inspector> {
    const id = `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payload: any = { ...inspectorData, id };

    // ✅ لاگ تشخیصی ۲: بررسی ورودی به Repository
    console.log("📦 [REPO] Received payload:", payload);
    console.log("📁 [REPO] resumeFile exists?", !!payload.resumeFile);
    console.log(
      "📁 [REPO] resumeFile type:",
      typeof payload.resumeFile,
      payload.resumeFile?.constructor?.name,
    );

    if (payload.resumeFile && payload.resumeFile instanceof File) {
      console.log(
        "🚀 [REPO] Attempting to upload file:",
        payload.resumeFile.name,
      );
      const file = payload.resumeFile;
      const fileExt = file.name.split(".").pop() || "pdf";
      const safeName = (payload.name_en || "Inspector").replace(/\s+/g, "_");
      const filePath = `resumes/${safeName}_CV_${Date.now()}.${fileExt}`;

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("inspector-resumes")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (uploadError) {
          console.error("❌ [REPO] Supabase Upload Error:", uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log("✅ [REPO] Upload successful. Path:", uploadData?.path);

        const { data: urlData } = supabase.storage
          .from("inspector-resumes")
          .getPublicUrl(filePath);

        payload.resume_url = urlData.publicUrl;
        payload.resume_name = payload.resume_name || file.name;
        payload.resume_size = payload.resume_size || file.size;
        payload.resume_uploaded_at = new Date().toISOString();
      } catch (error) {
        console.error("💥 [REPO] Critical error during upload:", error);
        throw error;
      }
    } else {
      console.log("⚠️ [REPO] No valid File object found. Skipping upload.");
    }

    delete payload.resumeFile;
    payload.created_at = new Date().toISOString();
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .schema("inspection")
      .from("inspectors")
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Inspector;
  }

  async update(id: string, inspectorData: any): Promise<Inspector> {
    const payload: any = {
      ...inspectorData,
      updated_at: new Date().toISOString(),
    };

    console.log(
      "📦 [REPO UPDATE] Received payload keys:",
      Object.keys(payload),
    );
    console.log("📁 [REPO UPDATE] resumeFile exists?", !!payload.resumeFile);
    console.log(
      "📁 [REPO UPDATE] resumeFile type:",
      payload.resumeFile?.constructor?.name,
    );

    const { data: currentData } = await supabase
      .schema("inspection")
      .from("inspectors")
      .select("resume_url, resume_name, resume_size, user_id")
      .eq("id", id)
      .single();

    if (payload.resumeFile && payload.resumeFile instanceof File) {
      console.log(
        "🚀 [REPO UPDATE] Attempting to upload file:",
        payload.resumeFile.name,
      );

      // حذف فایل قدیمی (اختیاری ولی توصیه‌شده)
      if (currentData?.resume_url) {
        await this.deleteResume(currentData.resume_url).catch(() => {});
      }

      const file = payload.resumeFile;
      const fileExt = file.name.split(".").pop() || "pdf";
      const safeName = (
        payload.name_en ||
        currentData?.resume_name?.split("_CV_")[0] ||
        "Inspector"
      ).replace(/\s+/g, "_");
      const filePath = `resumes/${safeName}_CV_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("inspector-resumes")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        console.error("❌ [REPO UPDATE] Supabase Upload Error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("✅ [REPO UPDATE] Upload successful. Path:", filePath);

      const { data: urlData } = supabase.storage
        .from("inspector-resumes")
        .getPublicUrl(filePath);

      payload.resume_url = urlData.publicUrl;
      payload.resume_name = payload.resume_name || file.name;
      payload.resume_size = payload.resume_size || file.size;
      payload.resume_uploaded_at = new Date().toISOString();
    } else {
      console.log(
        "⚠️ [REPO UPDATE] No valid File object found. Keeping existing resume data.",
      );

      payload.resume_url = currentData?.resume_url;
      payload.resume_name = currentData?.resume_name;
      payload.resume_size = currentData?.resume_size;
    }

    delete payload.resumeFile;
    if (payload.user_id === currentData?.user_id) {
      delete payload.user_id;
    }

    const { data, error } = await supabase
      .schema("inspection")
      .from("inspectors")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      ...data,
      specialties: parseToRealArray(data.specialties),
      rating: Number(data.rating) || 0,
      completed_inspections: Number(data.completed_inspections) || 0,
      active_missions: Number(data.active_missions) || 0,
    } as Inspector;
  }

  async uploadResume(
    file: File,
    inspectorId: string,
    customName?: string,
  ): Promise<{ url: string; name: string; size: number; uploadedAt: string }> {
    const originalExt = file.name.split(".").pop() || "pdf";
    const customExt = customName?.split(".").pop() || originalExt;
    const fileName = customName
      ? `${inspectorId}_${getTodayJalali()}.${customExt}`
      : `${inspectorId}_${getTodayJalali()}.${originalExt}`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("inspector-resumes")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage
      .from("inspector-resumes")
      .getPublicUrl(filePath);
    return {
      url: urlData.publicUrl,
      name: customName || file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }

  async deleteResume(resumeUrl: string): Promise<void> {
    try {
      const urlParts = resumeUrl.split("/");
      const filePath = urlParts.slice(-2).join("/");
      await supabase.storage.from("inspector-resumes").remove([filePath]);
    } catch (err) {}
  }

  async delete(id: string): Promise<void> {
    // ✅ ۱. بررسی تمام inspectionهای متصل (بدون فیلتر status)
    const { data: relatedInspections, error: checkError } = await supabase
      .schema("inspection")
      .from("inspections")
      .select("id, status, execution_date")
      .eq("inspector_id", id);

    if (checkError) {
      console.error("Error checking related inspections:", checkError);
      throw new Error("Failed to check related inspections");
    }

    // ✅ ۲. اگر هر inspection متصلی وجود دارد، خطای واضح بده
    if (relatedInspections && relatedInspections.length > 0) {
      const count = relatedInspections.length;
      const activeCount = relatedInspections.filter(
        (i) => i.status !== "CANCELLED",
      ).length;

      let message: string;
      if (count === 1) {
        message = `This inspector is assigned to 1 inspection. Please cancel or reassign it before deleting.`;
      } else {
        message = `This inspector is assigned to ${count} inspections (${activeCount} active). Please cancel or reassign them before deleting.`;
      }

      throw new Error(message);
    }

    // ✅ ۳. حذف فایل رزومه (اگر وجود دارد)
    const inspector = await this.getById(id);
    if (inspector?.resume_url) {
      await this.deleteResume(inspector.resume_url).catch(() => {});
    }

    // ✅ ۴. حذف بازرس از دیتابیس
    const { error } = await supabase
      .schema("inspection")
      .from("inspectors")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async getAvailableUsersForIcsMember(
    currentEditingUserId?: string | null,
  ): Promise<any[]> {
    const { data: allUsers, error: usersError } = await supabase
      .schema("core")
      .from("users")
      .select("id, username, email, full_name, department")
      .order("full_name", { ascending: true });
    if (usersError) throw new Error(usersError.message);

    const { data: existingInspectors, error: inspError } = await supabase
      .schema("inspection")
      .from("inspectors")
      .select("user_id")
      .eq("inspector_type", "ICS_MEMBER")
      .not("user_id", "is", null);
    if (inspError) throw new Error(inspError.message);

    const usedUserIds = new Set(
      existingInspectors?.map((i: any) => i.user_id).filter(Boolean) || [],
    );
    const availableUsers = (allUsers || []).filter(
      (user: any) =>
        user.id === currentEditingUserId || !usedUserIds.has(user.id),
    );

    return availableUsers.map((u: any) => ({
      id: u.id,
      name: u.full_name || u.username || u.email || "Unknown",
      email: u.email || "",
      department: u.department || "",
    }));
  }
}
