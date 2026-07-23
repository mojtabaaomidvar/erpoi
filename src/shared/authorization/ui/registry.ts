// src/shared/authorization/ui/registry.ts

import type { 
  UIElementDefinition, 
  UIModuleElements, 
  ValidationError, 
  RegistryStats 
} from './types';

class ElementRegistry {
  private elements: Map<string, UIElementDefinition> = new Map();
  private moduleElements: Map<string, UIModuleElements> = new Map();
  private validationErrors: ValidationError[] = [];
  private isInitialized = false;

  /**
   * Register a module's elements
   */
  registerModule(moduleName: string, moduleElements: UIModuleElements): void {
    this.moduleElements.set(moduleName, moduleElements);
    
    // Extract all elements and flatten them
    for (const [pageName, pageElements] of Object.entries(moduleElements)) {
      for (const [elementName, element] of Object.entries(pageElements)) {
        const fullPath = `${moduleName}.${pageName}.${elementName}`;
        const reference = `${pageName}.${elementName}`;
        
        // Store with full ID
        this.elements.set(element.id, {
          ...element,
          // Store metadata for reference resolution
          _module: moduleName,
          _page: pageName,
          _elementName: elementName,
          _reference: reference,
        } as any);
      }
    }
  }

  /**
   * Initialize and validate the registry
   */
  initialize(): void {
    if (this.isInitialized) return;
    
    this.validate();
    this.isInitialized = true;
    
    if (this.validationErrors.length > 0) {
      console.error('❌ Element Registry Validation Errors:');
      this.validationErrors.forEach(err => {
        console.error(`  - [${err.type}] ${err.message}`, err.elementId || '', err.path || '');
      });
      
      // In production, you might want to throw an error
      // throw new Error(`Element Registry validation failed with ${this.validationErrors.length} errors`);
    }
  }

  /**
   * Get an element by its ID
   */
  get(elementId: string): UIElementDefinition | undefined {
    return this.elements.get(elementId);
  }

  /**
   * Get an element by reference (e.g., "InspectionList.list_view")
   */
  getByReference(reference: string): UIElementDefinition | undefined {
    for (const element of this.elements.values()) {
      if ((element as any)._reference === reference) {
        return element;
      }
    }
    return undefined;
  }

  /**
   * Check if an element exists
   */
  has(elementId: string): boolean {
    return this.elements.has(elementId);
  }

  /**
   * Get all elements
   */
  getAll(): UIElementDefinition[] {
    return Array.from(this.elements.values());
  }

  /**
   * Get all elements for a specific module
   */
  getByModule(moduleName: string): UIElementDefinition[] {
    return this.getAll().filter(el => (el as any)._module === moduleName);
  }

  /**
   * Get all elements for a specific page
   */
  getByPage(pageName: string): UIElementDefinition[] {
    return this.getAll().filter(el => (el as any)._page === pageName);
  }

  /**
   * Get all root elements (no dependencies)
   */
  getRootElements(): UIElementDefinition[] {
    return this.getAll().filter(el => !el.requires || el.requires.length === 0);
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const [id, element] of this.elements.entries()) {
      const deps = element.requires.map(ref => {
        const depElement = this.getByReference(ref);
        return depElement?.id || ref;
      });
      graph.set(id, deps);
    }
    
    return graph;
  }

  /**
   * Get reverse dependency graph (who depends on this element)
   */
  getReverseDependencyGraph(): Map<string, string[]> {
    const reverseGraph = new Map<string, string[]>();
    
    for (const [id, element] of this.elements.entries()) {
      if (!reverseGraph.has(id)) {
        reverseGraph.set(id, []);
      }
      
      for (const ref of element.requires) {
        const depElement = this.getByReference(ref);
        if (depElement) {
          if (!reverseGraph.has(depElement.id)) {
            reverseGraph.set(depElement.id, []);
          }
          reverseGraph.get(depElement.id)!.push(id);
        }
      }
    }
    
    return reverseGraph;
  }

  /**
   * Check if all dependencies are satisfied
   */
  checkDependencies(elementId: string, allowedElements: Set<string>): boolean {
    const element = this.get(elementId);
    if (!element) return false;
    if (!element.requires || element.requires.length === 0) return true;

    return element.requires.every(ref => {
      const depElement = this.getByReference(ref);
      return depElement && allowedElements.has(depElement.id);
    });
  }

  /**
   * Get full dependency chain (recursive)
   */
  getDependencyChain(elementId: string, visited: Set<string> = new Set()): string[] {
    if (visited.has(elementId)) return [];
    visited.add(elementId);

    const element = this.get(elementId);
    if (!element || !element.requires || element.requires.length === 0) {
      return [];
    }

    const chain: string[] = [];
    for (const ref of element.requires) {
      const depElement = this.getByReference(ref);
      if (depElement) {
        chain.push(depElement.id);
        chain.push(...this.getDependencyChain(depElement.id, visited));
      }
    }

    return [...new Set(chain)];
  }

  /**
   * Validate the registry
   */
  private validate(): void {
    this.validationErrors = [];
    
    const ids = new Set<string>();
    const labels = new Set<string>();
    const routes = new Set<string>();
    const references = new Set<string>();

    for (const [id, element] of this.elements.entries()) {
      // Check duplicate ID
      if (ids.has(id)) {
        this.validationErrors.push({
          type: 'DUPLICATE_ID',
          message: `Duplicate element ID: ${id}`,
          elementId: id,
        });
      }
      ids.add(id);

      // Check duplicate label
      if (labels.has(element.label)) {
        this.validationErrors.push({
          type: 'DUPLICATE_LABEL',
          message: `Duplicate label: ${element.label}`,
          elementId: id,
        });
      }
      labels.add(element.label);

      // Check duplicate route
      if (element.route && routes.has(element.route)) {
        this.validationErrors.push({
          type: 'DUPLICATE_ROUTE',
          message: `Duplicate route: ${element.route}`,
          elementId: id,
        });
      }
      if (element.route) routes.add(element.route);

      // Check dependencies
      if (element.requires) {
        for (const ref of element.requires) {
          const depElement = this.getByReference(ref);
          
          // Check missing dependency
          if (!depElement) {
            this.validationErrors.push({
              type: 'MISSING_DEPENDENCY',
              message: `Missing dependency reference: ${ref}`,
              elementId: id,
              path: ref,
            });
          } else {
            // Check circular dependency
            if (this.hasCircularDependency(id, depElement.id)) {
              this.validationErrors.push({
                type: 'CIRCULAR_DEPENDENCY',
                message: `Circular dependency detected: ${id} <-> ${depElement.id}`,
                elementId: id,
              });
            }
          }
        }
      }
    }

    // Check orphan elements (elements that are not referenced by anything and have no dependencies)
    const reverseGraph = this.getReverseDependencyGraph();
    for (const [id, element] of this.elements.entries()) {
      const dependents = reverseGraph.get(id) || [];
      const hasDeps = element.requires && element.requires.length > 0;
      
      if (dependents.length === 0 && !hasDeps && element.type !== 'page') {
        this.validationErrors.push({
          type: 'ORPHAN_ELEMENT',
          message: `Orphan element (no dependencies and not referenced): ${id}`,
          elementId: id,
        });
      }
    }
  }

  /**
   * Check for circular dependency between two elements
   */
  private hasCircularDependency(id1: string, id2: string, visited: Set<string> = new Set()): boolean {
    if (visited.has(id2)) return false;
    visited.add(id2);

    const element = this.get(id2);
    if (!element || !element.requires) return false;

    for (const ref of element.requires) {
      const depElement = this.getByReference(ref);
      if (depElement) {
        if (depElement.id === id1) return true;
        if (this.hasCircularDependency(id1, depElement.id, visited)) return true;
      }
    }

    return false;
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const allElements = this.getAll();
    const rootElements = this.getRootElements();
    const totalDeps = allElements.reduce((sum, el) => sum + (el.requires?.length || 0), 0);

    return {
      totalElements: allElements.length,
      totalModules: this.moduleElements.size,
      totalDependencies: totalDeps,
      rootElements: rootElements.length,
      validationErrors: this.validationErrors,
    };
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.elements.clear();
    this.moduleElements.clear();
    this.validationErrors = [];
    this.isInitialized = false;
  }
}

// Singleton instance
export const elementRegistry = new ElementRegistry();