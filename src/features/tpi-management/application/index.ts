// src/features/tpi-management/application/index.ts

export * from "./TPIRequestApplicationService";
export * from "./ResidentInspectionApplicationService";
export * from "./MonthlyReportApplicationService";
export * from "./InspectorAttendanceApplicationService";
export { tpiRequestAppService } from "./TPIRequestApplicationService";
export { inspectionItemAppService } from "./InspectionItemApplicationService";
export * from "./TpiFindingExportApplicationService";
export * from "./TPIEngagementApplicationService";

import { tpiEngagementRepository } from "../repositories/SupabaseTPIEngagementRepository";
import { TPIEngagementApplicationService } from "./TPIEngagementApplicationService";
import { masterDataAppService } from "@shared/application/MasterDataApplicationService";

export const tpiEngagementAppService = new TPIEngagementApplicationService(
  tpiEngagementRepository,
  masterDataAppService,
);
