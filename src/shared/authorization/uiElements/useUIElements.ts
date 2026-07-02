// src/shared/authorization/uiElements/useUIElements.ts

import { useState, useEffect } from 'react';
import { uiElementRegistry } from './registry';
import type { DBUIElement } from '@shared/database/types';

export function useUIElements(): DBUIElement[] {
  const [elements, setElements] = useState<DBUIElement[]>([]);

  useEffect(() => {
    // 🔧 FIX: sync load (چون registry الان sync پر میشه)
    const registryElements = uiElementRegistry.getAllElements();
    
    if (registryElements.length > 0) {
      const dbElements = registryElements.map(el => ({
        ...el,
        module: el.module || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) as DBUIElement[];
      
      setElements(dbElements);
      console.log(`[useUIElements] ✅ Loaded ${dbElements.length} elements`);
    } else {
      // 🔧 FIX: اگه خالی بود، ۱۰۰ms بعد دوباره تلاش کن
      const timer = setTimeout(() => {
        const retryElements = uiElementRegistry.getAllElements();
        if (retryElements.length > 0) {
          const dbElements = retryElements.map(el => ({
            ...el,
            module: el.module || 'unknown',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })) as DBUIElement[];
          setElements(dbElements);
          console.log(`[useUIElements] ✅ Loaded ${dbElements.length} elements (retry)`);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return elements;
}