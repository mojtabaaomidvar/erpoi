// src/features/resident-inspection/application/ResidentManDayApplicationService.ts

import type { ResidentManDay, AttendanceSummary } from "../domain/types";
import type { IResidentEngagementRepository } from "../repositories/IResidentEngagementRepository";
import type { IResidentAssignmentRepository } from "../repositories/IResidentAssignmentRepository";

interface IResidentManDayRepository {
  getByAssignment(assignmentId: string): Promise<ResidentManDay[]>;
  getByAssignmentAndMonth(
    assignmentId: string,
    month: string,
  ): Promise<ResidentManDay[]>;
  create(
    data: Omit<ResidentManDay, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentManDay>;
  update(id: string, data: Partial<ResidentManDay>): Promise<ResidentManDay>;
}

export class ResidentManDayApplicationService {
  constructor(
    private manDayRepository: IResidentManDayRepository,
    private assignmentRepository: IResidentAssignmentRepository,
    private engagementRepository: IResidentEngagementRepository,
  ) {}

  async getByAssignment(assignmentId: string) {
    return this.manDayRepository.getByAssignment(assignmentId);
  }

  async getByAssignmentAndMonth(assignmentId: string, month: string) {
    return this.manDayRepository.getByAssignmentAndMonth(assignmentId, month);
  }

  /**
   * Record attendance for an inspector on a given date
   */
  async recordAttendance(
    engagementId: string,
    assignmentId: string,
    data: {
      work_date: string;
      attendance_status: string;
      hours_worked: number;
      overtime_hours?: number;
      activity_type?: string;
      remarks?: string;
    },
  ): Promise<ResidentManDay> {
    const engagement = await this.engagementRepository.getById(engagementId);
    if (!engagement || engagement.status !== "ACTIVE") {
      throw new Error("Cannot record man-days for non-active engagement");
    }

    const assignment = await this.assignmentRepository.getById(assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const inspector = assignment.inspector_id;

    return this.manDayRepository.create({
      resident_engagement_id: engagementId,
      resident_assignment_id: assignmentId,
      inspector_id: inspector,
      work_date: data.work_date,
      attendance_status: (data.attendance_status as any) || "PRESENT",
      hours_worked: data.hours_worked,
      overtime_hours: data.overtime_hours || 0,
      activity_type: (data.activity_type as any) || "INSPECTION",
      notes: data.remarks,
      is_billable: true, // Default to billable; can be overridden
    });
  }

  /**
   * Generate monthly attendance summary for an assignment
   */
  async getMonthlySummary(
    assignmentId: string,
    month: string,
  ): Promise<AttendanceSummary> {
    const records = await this.manDayRepository.getByAssignmentAndMonth(
      assignmentId,
      month,
    );

    const totalDays = records.length;
    const presentDays = records.filter(
      (r) => r.attendance_status === "PRESENT",
    ).length;
    const absentDays = records.filter(
      (r) => r.attendance_status === "ABSENT",
    ).length;
    const lateDays = records.filter(
      (r) => r.attendance_status === "LATE",
    ).length;
    const leaveDays = records.filter(
      (r) => r.attendance_status === "LEAVE",
    ).length;

    return {
      inspector_id: assignmentId,
      inspector_name: "", // Will be enriched at UI level
      discipline: "",
      total_days: totalDays,
      present_days: presentDays,
      absent_days: absentDays,
      late_days: lateDays,
      leave_days: leaveDays,
      attendance_percentage:
        totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
    };
  }

  async update(
    id: string,
    data: Partial<ResidentManDay>,
  ): Promise<ResidentManDay> {
    return this.manDayRepository.update(id, data);
  }
}
