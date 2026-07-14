// src/shared/authorization/ui/DebugPermission.tsx

import { usePermissionMapping } from "../hooks/usePermissionMapping";
import { useEffect } from "react";

export function DebugPermission() {
  const mapping = usePermissionMapping();
  
  useEffect(() => {
    console.log('═══════════════════════════════════');
    console.log('🔐 PERMISSION MAPPING DEBUG');
    console.log('═══════════════════════════════════');
    console.log('Base Permissions:', mapping.basePermissions);
    console.log('Custom Permissions:', mapping.customPermissions);
    console.log('All Permissions:', mapping.allPermissions);
    console.log('───────────────────────────────────');
    console.log('Allowed Elements Count:', mapping.allowedElements.size);
    console.log('Sample Allowed (first 10):', Array.from(mapping.allowedElements).slice(0, 10));
    console.log('───────────────────────────────────');
    console.log('canAccessElement("client_list_item_click"):', mapping.canAccessElement("client_list_item_click"));
    console.log('canAccessElement("contract_list_item_click"):', mapping.canAccessElement("contract_list_item_click"));
    console.log('canAccessElement("client_btn_add"):', mapping.canAccessElement("client_btn_add"));
    console.log('canAccessElement("contract_btn_add"):', mapping.canAccessElement("contract_btn_add"));
    console.log('═══════════════════════════════════');
  }, [mapping]);
  
  return null;
}