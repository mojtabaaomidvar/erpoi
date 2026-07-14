// src/shared/authorization/uiElements/types.ts

export type UIElementType =
  | "card"
  | "progress_bar"
  | "button"
  | "modal"
  | "table_column"
  | "form_field"
  | "section"
  | "badge"
  | "stat"
  | "chart"
  | "list_item"
  | "page"
  | "sidebar_item";

export type UIElementAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export";

export interface UIElement {
  id: string;
  name: string;
  type: UIElementType;
  entity: string;
  module?: string;
  description?: string;
  component?: string;
  priority?: number;
  action?: UIElementAction;

  actions?: UIElementAction[];
  sensitive?: boolean;
  parentElementId?: string;
  clickable?: boolean;
}

export interface ModuleUIElements {
  module: string;
  elements: UIElement[];
}
