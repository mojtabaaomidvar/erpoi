// src/shared/authorization/uiElements/index.ts

export * from './types';
export { uiElementRegistry, registerUIElements } from './registry';
export { autoDiscoverAndRegister, convertToUIElements } from './auto-discovery';
export { useUIElements } from './useUIElements';

// 🔧 FIX: اجرای sync در زمان import
import { autoDiscoverAndRegister } from './auto-discovery';

autoDiscoverAndRegister();
console.log('[UIElements] ✅ Initialization triggered');