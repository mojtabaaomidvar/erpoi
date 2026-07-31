//src/features/inspection-management/repositories/SupabaseInspectionRepository.ts

import { supabase } from "@shared/database/supabase";
import type { IInspectionRepository } from "./IInspectionRepository";

export interface InspectorAssignment {
  id: string;
  tpi_request_id: string;
  inspector_id: string;
  assigned_by: string;
  assigned_at: string;
  execution_date?: string;
  location?: string;
  vendor_site?: string;
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  actual_start_time?: string;
  actual_end_time?: string;
  weather_conditions?: string;
  general_remarks?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  cancellation_notes?: string;
  related_assignment_id?: string;
  new_scheduled_date?: string;
  date_is_unknown?: boolean;
  new_scope?: string[];
  created_at: string;
  updated_at: string;
}

export class SupabaseInspectionRepository implements IInspectionRepository {
  private getTableTarget(category: "TPI" | "MWS") {
    return category === "TPI"
      ? {
          schema: "tpi",
          table: "tpi_requests",
          assignmentsTable: "tpi_inspector_assignments",
        }
      : {
          schema: "mws",
          table: "mws_requests",
          assignmentsTable: "mws_inspector_assignments",
        };
  }

  // ✅ انتصاب بازرس جدید (INSERT به جدول assignments)
  async assignInspector(
    requestId: string,
    category: "TPI" | "MWS",
    inspectorId: string,
    assignedBy: string,
    executionDate?: string,
    location?: string,
    vendorSite?: string,
  ): Promise<InspectorAssignment> {
    const target = this.getTableTarget(category);

    const newAssignment = {
      tpi_request_id: requestId,
      inspector_id: inspectorId,
      assigned_by: assignedBy,
      execution_date: executionDate || null,
      location: location || null,
      vendor_site: vendorSite || null,
      status: "ASSIGNED",
    };

    const { data, error } = await supabase
      .schema(target.schema)
      .from(target.assignmentsTable)
      .insert(newAssignment)
      .select()
      .single();

    if (error) throw new Error(`Failed to assign inspector: ${error.message}`);

    // به‌روزرسانی status درخواست اصلی به IN_PROGRESS (اگر اولین انتصاب است)
    await supabase
      .schema(target.schema)
      .from(target.table)
      .update({ status: "IN_PROGRESS", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    return data as InspectorAssignment;
  }

  // ✅ دریافت تمام انتصابات یک درخواست
  async getAssignmentsByRequest(
    requestId: string,
    category: "TPI" | "MWS" = "TPI",
  ): Promise<InspectorAssignment[]> {
    const target = this.getTableTarget(category);

    const { data, error } = await supabase
      .schema(target.schema)
      .from(target.assignmentsTable)
      .select("*")
      .eq("tpi_request_id", requestId)
      .order("assigned_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as InspectorAssignment[];
  }

  // ✅ به‌روزرسانی یک انتصاب خاص
  async updateAssignment(
    assignmentId: string,
    category: "TPI" | "MWS",
    updateData: Partial<InspectorAssignment>,
  ): Promise<InspectorAssignment> {
    const target = this.getTableTarget(category);

    const { data, error } = await supabase
      .schema(target.schema)
      .from(target.assignmentsTable)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update assignment: ${error.message}`);
    return data as InspectorAssignment;
  }

  async cancelAssignment(
    assignmentId: string,
    category: "TPI" | "MWS",
    cancelledBy: string,
    reason?: string,
    cancellationNotes?: string,
  ): Promise<InspectorAssignment> {
    return this.updateAssignment(assignmentId, category, {
      status: "CANCELLED",
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: reason,
      cancellation_notes: cancellationNotes,
    });
  }

  async getAssignmentsByInspectorAndDate(
    inspectorId: string,
    executionDate: string,
    category: "TPI" | "MWS" = "TPI",
  ): Promise<InspectorAssignment[]> {
    const target = this.getTableTarget(category);

    const { data, error } = await supabase
      .schema(target.schema)
      .from(target.assignmentsTable)
      .select("*")
      .eq("inspector_id", inspectorId)
      .eq("execution_date", executionDate)
      .in("status", ["ASSIGNED", "IN_PROGRESS"]);

    if (error) throw new Error(error.message);
    return (data || []) as InspectorAssignment[];
  }

  async getAll(category: "TPI" | "MWS" = "TPI"): Promise<any[]> {
    const target = this.getTableTarget(category);
    const { data, error } = await supabase
      .schema(target.schema)
      .from(target.table)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(
    id: string,
    category: "TPI" | "MWS" = "TPI",
  ): Promise<any | null> {
    const target = this.getTableTarget(category);
    const { data, error } = await supabase
      .schema(target.schema)
      .from(target.table)
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data;
  }

  async getByInspectionRequest(
    requestId: string,
    category: "TPI" | "MWS" = "TPI",
  ): Promise<any[]> {
    return this.getAssignmentsByRequest(requestId, category);
  }

  async create(data: any, category: "TPI" | "MWS" = "TPI"): Promise<any> {
    throw new Error("Use TPIRequestApplicationService.create() instead");
  }

  async update(
    id: string,
    data: any,
    category: "TPI" | "MWS" = "TPI",
  ): Promise<any> {
    const target = this.getTableTarget(category);
    const { data: updatedRecord, error } = await supabase
      .schema(target.schema)
      .from(target.table)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updatedRecord;
  }

  async delete(id: string, category: "TPI" | "MWS" = "TPI"): Promise<void> {
    throw new Error("Use TPIRequestApplicationService.delete() instead");
  }

  async updateExecution(
    requestId: string,
    category: "TPI" | "MWS",
    updateData: any,
  ): Promise<any> {
    // ✅ این متد اکنون باید به جدول assignments مراجعه کند
    throw new Error("Use assignInspector() or updateAssignment() instead");
  }

  async cancelInspection(
    requestId: string,
    category: "TPI" | "MWS",
    cancelledBy: string,
    reason?: string,
    relatedInspectionId?: string,
    newScheduledDate?: string,
    dateIsUnknown?: boolean,
    newScopes?: string[],
    cancellationNotes?: string,
  ): Promise<any> {
    // ✅ اکنون یک انتصاب خاص را لغو می‌کند
    return this.cancelAssignment(
      requestId,
      category,
      cancelledBy,
      reason,
      cancellationNotes,
    );
  }

  async getInspectionWithDetails(
    requestId: string,
    category: "TPI" | "MWS",
  ): Promise<any> {
    const target = this.getTableTarget(category);

    const { data: request, error: reqError } = await supabase
      .schema(target.schema)
      .from(target.table)
      .select(
        `
        *,
        project:project_id (id, name),
        client:client_id (id, name_en, name_fa),
        vendor:vendor_id (id, name)
      `,
      )
      .eq("id", requestId)
      .single();

    if (reqError || !request) throw new Error("Request not found");

    // دریافت انتصابات
    const assignments = await this.getAssignmentsByRequest(requestId, category);

    return { request, assignments };
  }

  async getAllAssignments(category: "TPI" | "MWS" = "TPI"): Promise<any[]> {
    console.log("🔍 [getAllAssignments] START - Category:", category);
    const target = this.getTableTarget(category);
    console.log("🔍 [getAllAssignments] Target:", target);

    try {
      // ۱. دریافت انتصابات
      const { data: assignments, error: assignError } = await supabase
        .schema(target.schema)
        .from(target.assignmentsTable)
        .select("*")
        .order("execution_date", { ascending: true });

      if (assignError) {
        throw new Error(assignError.message);
      }

      if (!assignments || assignments.length === 0) {
        return [];
      }

      const requestIds = [
        ...new Set(
          assignments.map((a: any) => a.tpi_request_id).filter(Boolean),
        ),
      ];
      if (requestIds.length === 0) return assignments;

      const { data: requests, error: reqError } = await supabase
        .schema(target.schema)
        .from(target.table)
        .select(
          "id, project_id, client_id, vendor_id, methods, stages, disciplines",
        )
        .in("id", requestIds);

      const projectIds = [
        ...new Set(
          (requests || []).map((r: any) => r.project_id).filter(Boolean),
        ),
      ];
      const clientIds = [
        ...new Set(
          (requests || []).map((r: any) => r.client_id).filter(Boolean),
        ),
      ];
      const vendorIds = [
        ...new Set(
          (requests || []).map((r: any) => r.vendor_id).filter(Boolean),
        ),
      ];

      let projectsMap: Record<string, string> = {};
      if (projectIds.length > 0) {
        const { data: projects, error: projError } = await supabase
          .schema("projects")
          .from("projects")
          .select("id, name")
          .in("id", projectIds);

        if (!projError)
          projectsMap = Object.fromEntries(
            (projects || []).map((p: any) => [
              p.id,
              p.name || "Unknown Project",
            ]),
          );
      }

      let clientsMap: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: clients, error: clientError } = await supabase
          .schema("crm")
          .from("clients")
          .select("id, name_en, name_fa")
          .in("id", clientIds);

        if (!clientError)
          clientsMap = Object.fromEntries(
            (clients || []).map((c: any) => [
              c.id,
              c.name ||
                c.name_en ||
                c.name_fa ||
                c.client_name ||
                "Unknown Client",
            ]),
          );
      }

      let vendorsMap: Record<string, string> = {};
      if (vendorIds.length > 0) {
        console.log(
          "🔍 [getAllAssignments] Fetching vendors from inspection.vendors",
        );
        const { data: vendors, error: vendorError } = await supabase
          .schema("inspection")
          .from("vendors")
          .select("id, name")
          .in("id", vendorIds);

        if (!vendorError) {
          if (vendors) {
            vendorsMap = Object.fromEntries(
              vendors.map((v: any) => [
                v.id,
                v.name ||
                  v.name_en ||
                  v.name_fa ||
                  v.vendor_name ||
                  "Unknown Vendor",
              ]),
            );
          }
        }
      }

      const requestsMap = Object.fromEntries(
        (requests || []).map((r: any) => [r.id, r]),
      );

      const result = assignments.map((a: any) => {
        const req = requestsMap[a.tpi_request_id] || {};
        return {
          ...a,
          project_name: projectsMap[req.project_id] || "Unknown Project",
          client_name:
            clientsMap[req.client_id] || a.location || "Unknown Client",
          vendor_name:
            vendorsMap[req.vendor_id] || a.vendor_site || "Unknown Vendor",
          inspection_method: req.methods || "N/A",
          inspection_stages: req.stages || null,
          disciplines: req.disciplines || null,
        };
      });

      return result;
    } catch (err) {
      return [];
    }
  }
}

export const inspectionRepository = new SupabaseInspectionRepository();
