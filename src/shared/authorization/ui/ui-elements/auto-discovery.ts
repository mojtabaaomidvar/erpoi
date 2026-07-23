// src/shared/authorization/uiElements/auto-discovery.ts

import type { UIElement, UIElementType } from "./types";
import { uiElementRegistry, registerUIElements } from "./registry";

import { dashboardElements } from "@pages/dashboard/elements";
import { ClientElements } from "../elements/ClientElements";
import { ContractElements } from "../elements/ContractElements";
import { InspectorElements } from "../elements/InspectorElements";
import { InspectionElements } from "../elements/InspectionElements";

function extractTypeFromId(id: string): UIElementType {
  const prefix = id.split("_")[0];

  const typeMap: Record<string, UIElementType> = {
    btn: "button",
    card: "card",
    modal: "modal",
    stat: "stat",
    progress: "progress_bar",
    field: "form_field",
    table: "table_column",
    list: "list_item",
    chart: "chart",
    section: "section",
    badge: "badge",
  };

  return typeMap[prefix] || "badge";
}

function extractEntityFromModule(module: string): string {
  if (module.endsWith("s") && !module.endsWith("ss")) {
    return module.slice(0, -1);
  }
  return module;
}

export function convertToUIElements(
  moduleName: string,
  elements: Record<string, Record<string, string>>,
): UIElement[] {
  const entity = extractEntityFromModule(moduleName);
  const result: UIElement[] = [];

  Object.entries(elements).forEach(([component, componentElements]) => {
    Object.entries(componentElements).forEach(([id, name]) => {
      const type = extractTypeFromId(id);
      const isClickable = id.endsWith("_click");

      result.push({
        id: `${entity}_${id}`,
        name,
        type,
        entity,
        module: moduleName,
        component,
        clickable: isClickable || undefined,
      });
    });
  });

  return result;
}

export function autoDiscoverAndRegister(): void {
  // 🔧 FIX: ثبت مستقیم ماژول‌های import شده
  const modules = [
    { elements: dashboardElements, name: "dashboard" },
    { elements: ClientElements, name: "client" },
    { elements: ContractElements, name: "contract" },
    { elements: InspectionElements, name: "project" },
    { elements: InspectorElements, name: "inspector" },
    { elements: InspectionElements, name: "inspection" },
  ];

  for (const { elements, name } of modules) {
    if (elements) {
      const uiElements = convertToUIElements(name, elements as any);
      registerUIElements(name, uiElements);
    }
  }

  const totalElements = uiElementRegistry.getAllElements().length;

  window.dispatchEvent(
    new CustomEvent("ui-elements-ready", {
      detail: { count: totalElements },
    }),
  );
}
