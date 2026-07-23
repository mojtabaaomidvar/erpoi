// src/shared/authorization/ui/helpers.ts

import { elementRegistry } from "./registry";
import type { UIElementDefinition } from "./types";

// تابع کمکی برای پیدا کردن المان هم با ID و هم با Reference
function getElementByKey(key: string): UIElementDefinition | undefined {
  const all = (elementRegistry as any).getAll();
  return all.find((el: any) => el.id === key || el._reference === key);
}

export function getAllElements(): UIElementDefinition[] {
  return (elementRegistry as any).getAll();
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
    const depElement = getElementByKey(depRef);
    const depKey = depElement ? depElement.id : depRef; // تبدیل Reference به ID

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
    const depElement = getElementByKey(depRef);
    const depKey = depElement ? depElement.id : depRef; // تبدیل Reference به ID برای چک کردن در Set

    const isAllowed = allowedSet.has(depKey); // حالا به درستی ID را در لیست مجازها (شامل basePermissions) چک می‌کند

    if (!isAllowed) {
      allSatisfied = false;
      missing.push(depRef); // نمایش Reference در UI برای خوانایی بهتر

      if (depElement) {
        const chainResult = checkDependenciesChain(depKey, allowedSet, visited);
        if (!chainResult.satisfied) {
          missing.push(...chainResult.missing);
        }
      }
    } else {
      // اگر خودش مجاز است، باید وابستگی‌های فرعی آن را هم چک کنیم
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
  const all = (elementRegistry as any).getAll();
  const targetElement = getElementByKey(elementKey);
  const targetRef = targetElement
    ? (targetElement as any)._reference
    : elementKey;

  for (const el of all) {
    const requires = (el as any)?.requires || [];
    // چک کردن هم با Reference و هم با ID برای اطمینان کامل
    if (requires.includes(targetRef) || requires.includes(elementKey)) {
      children.push(el.id);
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
