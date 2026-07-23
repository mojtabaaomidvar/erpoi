// src/features/inspection-management/application/index.ts

import { SupabaseInspectionRepository } from "../repositories/SupabaseInspectionRepository";
import { InspectionApplicationService } from "./InspectionApplicationService";

const inspectionRepo = new SupabaseInspectionRepository();
export const inspectionAppService = new InspectionApplicationService(
  inspectionRepo,
);

// Application Services
export * from "./InspectionRequestApplicationService";
export * from "./InspectionApplicationService";
export * from "./DocumentReviewApplicationService";
export * from "./ChecklistApplicationService";
export * from "./NCRApplicationService";
export * from "./ReportApplicationService";
export * from "./CertificateApplicationService";
export * from "./VendorApplicationService";

// DTOs
export * from "./dto/CreateInspectionRequestCommand";
export * from "./dto/InspectionCommand";
export * from "./dto/DocumentReviewCommand";
export * from "./dto/ChecklistCommand";
export * from "./dto/NCRCommand";
export * from "./dto/ReportCommand";
export * from "./dto/CertificateCommand";
export * from "./dto/VendorCommand";
