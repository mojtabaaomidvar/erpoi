// src/features/inspector-management/application/index.ts

import { SupabaseInspectorRepository } from "../repositories/SupabaseInspectorRepository";
import { InspectorApplicationService } from "./InspectorApplicationService";

export const inspectorAppService = new InspectorApplicationService(
  new SupabaseInspectorRepository(),
);
export * from "./InspectorApplicationService";
