// src/features/tpi-management/repositories/index.ts

// Interfaces

export * from "./IResidentInspectionRepository";
export * from "./IMonthlyReportRepository";
export * from "./IInspectorAttendanceRepository";

// Implementations
export * from "./SupabaseTPIRequestRepository";
export * from "./SupabaseResidentInspectionRepository";
export * from "./SupabaseMonthlyReportRepository";
export * from "./SupabaseInspectorAttendanceRepository";
