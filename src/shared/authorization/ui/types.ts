// src/shared/authorization/ui/types.ts

// ═══════════════════════════════════════
// 🎯 Type Definitions for UI Element Metadata
// ═══════════════════════════════════════

export type UIElementType =
  | "page"
  | "section"
  | "tab"
  | "dialog"
  | "panel"
  | "card"
  | "action"
  | "button"
  | "filter"
  | "field"
  | "table"
  | "dropdown"
  | "column"
  | "chart"
  | "report"
  | "badge"
  | "statistic"
  | "widget"
  | "progress"
  | "information"
  | "search";

export interface UIElementDefinition {
  id: string;
  label: string;
  type: UIElementType;
  requires: string[]; // Reference-based: "PageName.elementName"
  description?: string;
  icon?: string;
  route?: string;
  featureFlag?: string;
  analyticsEvent?: string;
  auditEvent?: string;
  shortcut?: string;
  help?: string;
  tooltip?: string;
  hidden?: boolean;
  experimental?: boolean;
}

export type UIElementMap = Record<string, UIElementDefinition>;
export type UIModuleElements = Record<string, UIElementMap>;

export interface ValidationError {
  type:
    | "DUPLICATE_ID"
    | "CIRCULAR_DEPENDENCY"
    | "MISSING_DEPENDENCY"
    | "INVALID_REFERENCE"
    | "ORPHAN_ELEMENT"
    | "DUPLICATE_LABEL"
    | "DUPLICATE_ROUTE"
    | "UNREACHABLE_ELEMENT"
    | "INVALID_CATEGORY"
    | "INVALID_TYPE";
  message: string;
  elementId?: string;
  path?: string;
}

export interface RegistryStats {
  totalElements: number;
  totalModules: number;
  totalDependencies: number;
  rootElements: number;
  validationErrors: ValidationError[];
}
