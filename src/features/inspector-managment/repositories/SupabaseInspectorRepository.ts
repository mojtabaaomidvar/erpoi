//src/features/inspector-managment/repositories/SupabaseInspectorRepository.ts

import { supabase } from "@shared/database/supabase";
import type { Inspector, IInspectorRepository } from "../domain";

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

  async uploadResume(
    file: File,
    inspectorId: string,
    customName?: string,
  ): Promise<{ url: string; name: string; size: number; uploadedAt: string }> {
    const originalExt = file.name.split(".").pop() || "pdf";
    const customExt = customName?.split(".").pop() || originalExt;
    const fileName = customName
      ? `${inspectorId}_${Date.now()}.${customExt}`
      : `${inspectorId}_${Date.now()}.${originalExt}`;
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

  async create(
    inspector: Omit<Inspector, "id" | "created_at" | "updated_at">,
  ): Promise<Inspector> {
    const id = `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payload = {
      id,
      name_en: inspector.name_en,
      name_fa: inspector.name_fa || null,
      inspector_type: inspector.inspector_type,
      status: inspector.status,
      specialties: inspector.specialties || [],
      phone: inspector.phone,
      email: inspector.email || null,
      location_base: inspector.location_base || null,
      personnel_code: inspector.personnel_code || null,
      user_id: inspector.user_id || null,
      resume_name: null,
      resume_url: null,
      resume_size: null,
      rating: inspector.rating || 0,
      completed_inspections: inspector.completed_inspections || 0,
      active_missions: inspector.active_missions || 0,
      current_contract_id: inspector.current_contract_id || null,
    };

    const { data, error } = await supabase
      .schema("inspection")
      .from("inspectors")
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Inspector;
  }

  async update(id: string, inspector: Partial<Inspector>): Promise<Inspector> {
    const payload = {
      ...inspector,
      updated_at: new Date().toISOString(),

      ...(inspector.specialties ? { specialties: inspector.specialties } : {}),
    };

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

  async delete(id: string): Promise<void> {
    const inspector = await this.getById(id);
    if (inspector?.resume_url) await this.deleteResume(inspector.resume_url);
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
