// src/shared/authorization/uiElements/auto-discovery.ts

import type { UIElement, UIElementType } from './types';
import { uiElementRegistry, registerUIElements } from './registry';

// 🔧 FIX: Import مستقیم فقط ماژول‌هایی که قطعاً وجود دارن
import { clientElements } from '@features/client-management/elements';
import { contractElements } from '@features/contract-management/elements';
import { dashboardElements } from '@pages/dashboard/elements';

function extractTypeFromId(id: string): UIElementType {
  const prefix = id.split('_')[0];
  
  const typeMap: Record<string, UIElementType> = {
    btn: 'button',
    card: 'card',
    modal: 'modal',
    stat: 'stat',
    progress: 'progress_bar',
    field: 'form_field',
    table: 'table_column',
    list: 'list_item',
    chart: 'chart',
    section: 'section',
    badge: 'badge',
  };
  
  return typeMap[prefix] || 'badge';
}

function extractEntityFromModule(module: string): string {
  if (module.endsWith('s') && !module.endsWith('ss')) {
    return module.slice(0, -1);
  }
  return module;
}

export function convertToUIElements(
  moduleName: string,
  elements: Record<string, Record<string, string>>
): UIElement[] {
  const entity = extractEntityFromModule(moduleName);
  const result: UIElement[] = [];
  
  Object.entries(elements).forEach(([component, componentElements]) => {
    Object.entries(componentElements).forEach(([id, name]) => {
      const type = extractTypeFromId(id);
      const isClickable = id.endsWith('_click');
      
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
  console.log('[AutoDiscovery] 🚀 Starting...');
  
  // 🔧 FIX: ثبت مستقیم ماژول‌های import شده
  const modules = [
    { elements: clientElements, name: 'client' },
    { elements: contractElements, name: 'contract' },
    { elements: dashboardElements, name: 'dashboard' },
  ];
  
  for (const { elements, name } of modules) {
    if (elements) {
      const uiElements = convertToUIElements(name, elements);
      registerUIElements(name, uiElements);
      console.log(`[AutoDiscovery] ✅ Registered ${uiElements.length} elements for "${name}"`);
    }
  }
  
  const totalElements = uiElementRegistry.getAllElements().length;
  console.log(`[AutoDiscovery] ✅ Registry ready with ${totalElements} elements`);
  
  // 🔧 FIX: Dispatch event
  window.dispatchEvent(new CustomEvent('ui-elements-ready', {
    detail: { count: totalElements }
  }));
}