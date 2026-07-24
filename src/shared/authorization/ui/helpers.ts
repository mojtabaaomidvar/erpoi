// src/shared/authorization/ui/helpers.ts

import type { UIElementDefinition } from "./types";

// ✅ ایمپورت مستقیم تمام ماژول‌های المان‌ها
import { ClientElements } from "./elements/ClientElements";
import { ContractElements } from "./elements/ContractElements";
import { InspectorElements } from "./elements/InspectorElements";
import { InspectionElements } from "./elements/InspectionElements";
import { ProjectElements } from "./elements/ProjectElements";

/**
 * تابع کمکی برای تخت کردن ساختار تو در تو و افزودن متادیتا
 */
function flattenElements(
  moduleName: string,
  moduleData: any,
): UIElementDefinition[] {
  const flattened: UIElementDefinition[] = [];

  for (const [pageName, pageElements] of Object.entries(moduleData)) {
    for (const [elementKey, elementData] of Object.entries(
      pageElements as any,
    )) {
      if (typeof elementData === "object" && elementData !== null) {
        flattened.push({
          ...(elementData as any),
          _module: moduleName,
          _page: pageName,
          _elementKey: elementKey,
          _reference: (elementData as any).id,
        });
      }
    }
  }
  return flattened;
}

/**
 * ✅ دریافت تمام المان‌ها
 */
export function getAllElements(): UIElementDefinition[] {
  return [
    ...flattenElements("client", ClientElements),
    ...flattenElements("contract", ContractElements),
    ...flattenElements("inspector", InspectorElements),
    ...flattenElements("inspection", InspectionElements),
    ...flattenElements("project", ProjectElements),
  ];
}

/**
 * ✅ تبدیل Reference به فرمت Component.element_key به ID واقعی (entity_element_key)
 * مثال‌ها:
 *   "ProjectList.list_item_view" → "project_list_item_view"
 *   "ClientDetails.btn_edit"     → "client_btn_edit"
 *   "ContractForm.field_type"    → "contract_field_type"
 */
function resolveReference(ref: string): string {
  // اگر نقطه ندارد، احتمالاً خودش ID است
  if (!ref.includes(".")) return ref;

  const [component, elementKey] = ref.split(".");

  // تبدیل نام کامپوننت به نام entity
  // مثال: ClientList → client, ProjectDetails → project, ContractForm → contract
  const entity = component
    .replace(/(List|Details|Form|EditModal|Modal|CreateModal)$/i, "")
    .toLowerCase();

  return `${entity}_${elementKey}`;
}

/**
 * پیدا کردن المان بر اساس ID یا Reference (با پشتیبانی از resolveReference)
 */
function getElementByKey(key: string): UIElementDefinition | undefined {
  const all = getAllElements();
  const resolvedKey = resolveReference(key);

  return all.find(
    (el) =>
      el.id === key ||
      el.id === resolvedKey ||
      (el as any)._reference === key ||
      (el as any)._reference === resolvedKey,
  );
}

export function getAllDependenciesChain(
  elementKey: string,
  visited: Set<string> = new Set(),
): string[] {
  if (visited.has(elementKey)) return [];
  visited.add(elementKey);

  const element = getElementByKey(elementKey);
  if (!element) return [];

  const requires = (element as any)?.requires || [];
  if (requires.length === 0) return [];

  const chain: string[] = [];
  for (const depRef of requires) {
    // ✅ تبدیل Reference به ID واقعی
    const depKey = resolveReference(depRef);
    const depElement = getElementByKey(depKey);

    chain.push(depKey);
    chain.push(...getAllDependenciesChain(depKey, visited));
  }
  return [...new Set(chain)];
}

export function checkDependenciesChain(
  elementKey: string,
  allowedElements: string[] | Set<string>,
  visited: Set<string> = new Set(),
): { satisfied: boolean; missing: string[] } {
  if (visited.has(elementKey)) return { satisfied: true, missing: [] };
  visited.add(elementKey);

  const element = getElementByKey(elementKey);
  if (!element) return { satisfied: false, missing: [elementKey] };

  const requires = (element as any)?.requires || [];
  if (requires.length === 0) return { satisfied: true, missing: [] };

  const allowedSet =
    allowedElements instanceof Set ? allowedElements : new Set(allowedElements);
  const missing: string[] = [];
  let allSatisfied = true;

  for (const depRef of requires) {
    // ✅ تبدیل Reference به ID واقعی قبل از بررسی
    const depKey = resolveReference(depRef);
    const isAllowed = allowedSet.has(depKey) || allowedSet.has(depRef);

    if (!isAllowed) {
      allSatisfied = false;
      missing.push(depRef);

      const depElement = getElementByKey(depKey);
      if (depElement) {
        const chainResult = checkDependenciesChain(depKey, allowedSet, visited);
        if (!chainResult.satisfied) {
          missing.push(...chainResult.missing);
        }
      }
    } else {
      const depElement = getElementByKey(depKey);
      if (depElement) {
        const chainResult = checkDependenciesChain(depKey, allowedSet, visited);
        if (!chainResult.satisfied) {
          allSatisfied = false;
          missing.push(...chainResult.missing);
        }
      }
    }
  }
  return { satisfied: allSatisfied, missing: [...new Set(missing)] };
}

export function getAllChildren(elementKey: string): string[] {
  const children: string[] = [];
  const all = getAllElements();
  const targetElement = getElementByKey(elementKey);
  const targetRef = targetElement
    ? (targetElement as any)._reference
    : elementKey;
  const resolvedTargetKey = resolveReference(elementKey);

  for (const el of all) {
    const requires = (el as any)?.requires || [];
    for (const req of requires) {
      const resolvedReq = resolveReference(req);
      if (
        resolvedReq === resolvedTargetKey ||
        resolvedReq === targetRef ||
        resolvedReq === elementKey ||
        req === elementKey ||
        req === targetRef
      ) {
        children.push(el.id);
        break;
      }
    }
  }
  return children;
}

export function getAllChildrenChain(
  elementKey: string,
  visited: Set<string> = new Set(),
): string[] {
  if (visited.has(elementKey)) return [];
  visited.add(elementKey);

  const directChildren = getAllChildren(elementKey);
  const chain: string[] = [...directChildren];

  for (const childKey of directChildren) {
    chain.push(...getAllChildrenChain(childKey, visited));
  }
  return [...new Set(chain)];
}
