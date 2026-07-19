// src/features/audit-log/services/AuditLogService.ts

import { supabase } from "@shared/database/supabase";
import type { AuditLog, AuditLogEntry, AuditLogFilter } from "../domain/types";

class AuditLogService {
  async log(data: Omit<AuditLog, "id" | "created_at">): Promise<void> {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await supabase.from("audit_logs").insert({
      id,
      ...data,
      created_at: new Date().toISOString(),
    });
  }

  async getAll(): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*, user:users(full_name, username)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((log: any) => ({
      ...log,
      user_name: log.user?.full_name || log.user?.username || "Unknown",
    }));
  }

  async getFiltered(filter: AuditLogFilter): Promise<AuditLogEntry[]> {
    let query = supabase
      .from("audit_logs")
      .select("*, user:users(full_name, username)")
      .order("created_at", { ascending: false });

    if (filter.user_id) {
      query = query.eq("user_id", filter.user_id);
    }
    if (filter.action) {
      query = query.eq("action", filter.action);
    }
    if (filter.entity_type) {
      query = query.eq("entity_type", filter.entity_type);
    }
    if (filter.date_from) {
      query = query.gte("created_at", filter.date_from);
    }
    if (filter.date_to) {
      query = query.lte("created_at", filter.date_to);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || []).map((log: any) => ({
      ...log,
      user_name: log.user?.full_name || log.user?.username || "Unknown",
    }));
  }

  async exportAll(): Promise<string> {
    const data = await this.getAll();
    return JSON.stringify(data, null, 2);
  }
}

export const auditLogService = new AuditLogService();
