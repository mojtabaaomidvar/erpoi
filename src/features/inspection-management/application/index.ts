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
export * from "./InspectionSessionApplicationService";
export * from "./FindingApplicationService";

// DTOs
export * from "./dto/CreateInspectionRequestCommand";
export * from "./dto/InspectionCommand";
export * from "./dto/DocumentReviewCommand";
