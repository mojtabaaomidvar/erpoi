// src/shared/authorization/uiElements/registry.ts

import type { UIElement, ModuleUIElements } from './types';

/**
 * 🎯 تبدیل plural به singular
 * مثال: 'clients' → 'client', 'contracts' → 'contract'
 */
function toSingular(module: string): string {
  // قواعد ساده
  if (module.endsWith('ies')) {
    return module.slice(0, -3) + 'y';  // companies → company
  }
  if (module.endsWith('ses') || module.endsWith('xes')) {
    return module.slice(0, -2);  // classes → class
  }
  if (module.endsWith('s') && !module.endsWith('ss')) {
    return module.slice(0, -1);  // clients → client
  }
  return module;
}

class UIElementRegistry {
  private static instance: UIElementRegistry;
  private modules: Map<string, ModuleUIElements> = new Map();
  private elements: Map<string, UIElement> = new Map();

  private constructor() {}

  static getInstance(): UIElementRegistry {
    if (!UIElementRegistry.instance) {
      UIElementRegistry.instance = new UIElementRegistry();
    }
    return UIElementRegistry.instance;
  }

  /**
   * 📝 ثبت UI Elements یک ماژول
   */
  register(module: string, elements: UIElement[]): void {
    // 🔧 FIX: تبدیل module به singular
    const singularModule = toSingular(module);
    
    if (this.modules.has(singularModule)) {
      console.warn(`[UIElementRegistry] Module "${singularModule}" already registered. Merging...`);
    }

    // 🔧 FIX: اضافه کردن prefix با singular module
    const prefixedElements = elements.map(el => {
      const prefixedId = el.id.startsWith(`${singularModule}_`) 
        ? el.id 
        : `${singularModule}_${el.id}`;
      
      return {
        ...el,
        id: prefixedId,
        module: singularModule,  // 🔧 FIX: singular module
      };
    });

    // Merge با existing elements اگه وجود داشته باشه
    const existingModule = this.modules.get(singularModule);
    const mergedElements = existingModule 
      ? [...existingModule.elements, ...prefixedElements]
      : prefixedElements;

    this.modules.set(singularModule, { module: singularModule, elements: mergedElements });

    // اضافه به elements map
    prefixedElements.forEach(el => {
      this.elements.set(el.id, el);
    });
  }

  /**
   * 🔍 گرفتن همه elements
   */
  getAllElements(): UIElement[] {
    return Array.from(this.elements.values());
  }

  /**
   * 🔍 گرفتن element بر اساس id
   */
  getElement(id: string): UIElement | undefined {
    return this.elements.get(id);
  }

  /**
   * 🔍 گرفتن elements بر اساس module
   */
  getElementsByModule(module: string): UIElement[] {
    const moduleData = this.modules.get(module);
    return moduleData?.elements || [];
  }

  /**
   * 🔍 گرفتن elements بر اساس entity
   */
  getElementsByEntity(entity: string): UIElement[] {
    return this.getAllElements().filter(el => el.entity === entity);
  }

  /**
   * 🔍 گرفتن elements بر اساس type
   */
  getElementsByType(type: string): UIElement[] {
    return this.getAllElements().filter(el => el.type === type);
  }

  /**
   * 📋 گرفتن لیست ماژول‌های ثبت شده
   */
  getRegisteredModules(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * 📊 گرفتن آمار
   */
  getStats() {
    return {
      totalModules: this.modules.size,
      totalElements: this.elements.size,
      modules: Array.from(this.modules.entries()).map(([module, data]) => ({
        module,
        count: data.elements.length,
      })),
    };
  }

  /**
   * 🗑️ پاک کردن registry (برای تست)
   */
  clear(): void {
    this.modules.clear();
    this.elements.clear();
  }
}

export const uiElementRegistry = UIElementRegistry.getInstance();

/**
 * 🎯 Helper function برای ثبت آسان
 */
export function registerUIElements(module: string, elements: UIElement[]): void {
  uiElementRegistry.register(module, elements);
}