// src/shared/authorization/ui/index.ts

import { elementRegistry } from "./registry";
import { ClientElements } from "./elements/ClientElements";
import { ContractElements } from "./elements/ContractElements";
import { InspectorElements } from "./elements/InspectorElements";
import { InspectionElements } from "./elements/InspectionElements";

// Register all modules
elementRegistry.registerModule("Client", ClientElements);
elementRegistry.registerModule("Contract", ContractElements);
elementRegistry.registerModule("Inspector", InspectorElements);
elementRegistry.registerModule("Inspection", InspectionElements);

// Initialize and validate
elementRegistry.initialize();

// Export registry and types
export * from "./registry";
export * from "./types";
export * from "./elements";
export * from "./helpers";

// Log stats in development
if (process.env.NODE_ENV === "development") {
  const stats = elementRegistry.getStats();
  console.log("📊 Element Registry Stats:", stats);

  if (stats.validationErrors.length > 0) {
    console.warn("⚠️  Validation errors detected:", stats.validationErrors);
  }
}
